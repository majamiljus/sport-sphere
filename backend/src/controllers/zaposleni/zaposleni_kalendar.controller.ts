import * as express from "express";
import mongoose from "mongoose";
import {FacilityModel} from "../../models/facility";
import {IndividualniTreningModel} from "../../models/trening";
import {RezervacijaModel} from "../../models/rezervacije";
import {UserModel} from "../../models/user";
type TipTermina = "rezervacija" | "trening";
export class ZaposleniKalendarController {

  dohvatiKalendar = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const objekatId = String(req.query.objekatId || "").trim();
      const terenNaziv = String(req.query.teren || "").trim();
      const od = new Date(String(req.query.od || ""));
      const doDatuma = new Date(String(req.query.doDatuma || ""));
      if(!username || !objekatId || !terenNaziv || Number.isNaN(od.getTime()) || Number.isNaN(doDatuma.getTime()) || od >= doDatuma) {
        res.status(400).json({message: "Podaci za učitavanje kalendara nisu ispravni."});
        return;
      }
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni",
        objekti: objekatId
      });
      if(!zaposleni) {
        res.status(403).json({message: "Nemate pravo pristupa izabranom objektu."});
        return;
      }
      const objekat = await FacilityModel.findOne({
        _id: objekatId,
        status: "aktivan"
      });
      if(!objekat) {
        res.status(404).json({message: "Aktivan sportski objekat nije pronađen."});
        return;
      }
      const teren = objekat.tereni.find(trenutniTeren => trenutniTeren.naziv === terenNaziv);

      if(!teren) {
        res.status(404).json({message: "Izabrani teren nije pronađen."});
        return;
      }
      const rezervacije = await RezervacijaModel.find({
        objekatId: objekatId,
        teren: terenNaziv,
        status: {$nin: ["otkazan"] },
        pocetak: {$lt: doDatuma},
        kraj: {$gt: od}
      }).sort({pocetak: 1});

      const treninzi = await IndividualniTreningModel.find({
        objekatId: objekatId,
        teren: terenNaziv,
        status: { $nin: ["otkazan"]},
        pocetak: {$lt: doDatuma},
        kraj: {$gt: od}
      }).sort({pocetak: 1});
      const korisnikIds: string[] = [];

      for(const rezervacija of rezervacije) {
        const korisnikId = String(rezervacija.korisnikId);
        if(!korisnikIds.includes(korisnikId)) {
          korisnikIds.push(korisnikId);
        }
      }
      for(const trening of treninzi) {
        const korisnikId = String(trening.korisnikId);
        if(!korisnikIds.includes(korisnikId)) {
          korisnikIds.push(korisnikId);
        }
      }
      const korisnici = await UserModel.find({
        _id: {
          $in: korisnikIds
        }
      });
      const podaciKorisnika = new Map<string,{
        korisnikId: string;
        ime: string;
        prezime: string;
        imejl: string;
        telefon: string;
      }>();

      for(const korisnik of korisnici) {
        podaciKorisnika.set(String(korisnik._id),{
          korisnikId: String(korisnik._id),
          ime: korisnik.ime,
          prezime: korisnik.prezime,
          imejl: korisnik.imejl,
          telefon: korisnik.telefon
        });
      }
      const termini = [
        ...rezervacije.map(rezervacija => {
          const korisnik = podaciKorisnika.get(String(rezervacija.korisnikId));
          return {
            id: String(rezervacija._id),
            tip: "rezervacija" as TipTermina,
            korisnikId: String(rezervacija.korisnikId),
            ime: korisnik?.ime || "",
            prezime: korisnik?.prezime || "",
            imejl: korisnik?.imejl || "",
            telefon: korisnik?.telefon || "",
            objekatId: rezervacija.objekatId,
            teren: rezervacija.teren,
            sport: rezervacija.sport,
            pocetak: rezervacija.pocetak,
            kraj: rezervacija.kraj,
            status: this.normalizujStatus(rezervacija.status)
          };
        }),
        ...treninzi.map(trening => {
          const korisnik = podaciKorisnika.get(String(trening.korisnikId));
          return {
            id: String(trening._id),
            tip: "trening" as TipTermina,
            korisnikId: String(trening.korisnikId),
            ime: korisnik?.ime || "",
            prezime: korisnik?.prezime || "",
            imejl: korisnik?.imejl || "",
            telefon: korisnik?.telefon || "",
            trenerId: String(trening.trenerId),
            objekatId: trening.objekatId,
            teren: trening.teren,
            sport: trening.sport,
            pocetak: trening.pocetak,
            kraj: trening.kraj,
            status: this.normalizujStatus(trening.status)
          };
        })
      ];
      termini.sort((prvi,drugi) => new Date(prvi.pocetak).getTime() - new Date(drugi.pocetak).getTime());
      res.json({
        termini: termini
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Kalendar trenutno nije moguće učitati."
      });
    }
  };

  pomeriTermin = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const tip = String(req.body.tip || "").trim() as TipTermina;
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map((id: unknown) => String(id)) : [];
      const objekatId = String(req.body.objekatId || "").trim();
      const terenNaziv = String(req.body.teren || "").trim();
      const noviPocetak = new Date(req.body.noviPocetak);
      const noviKraj = new Date(req.body.noviKraj);
      if(noviPocetak <= new Date()) {
        res.status(400).json({message: "Termin nije moguće pomeriti u prošlost."});
        return;
      }
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni",
        objekti: objekatId
      });
      if(!zaposleni) {
        res.status(403).json({message: "Nemate pravo upravljanja izabranim objektom."});
        return;
      }
      const objekat = await FacilityModel.findOne({
        _id: objekatId,
        status: "aktivan"
      });

      if(!objekat) {
        res.status(404).json({message: "Aktivan sportski objekat nije pronađen."});
        return;
      }
      const teren = objekat.tereni.find(trenutniTeren => trenutniTeren.naziv === terenNaziv);

      if(!teren) {
        res.status(404).json({message: "Izabrani teren nije pronađen."});
        return;
      }
      if(teren.tip !== "zatvoreni") {
        res.status(400).json({message: "Termini se mogu pomerati samo u zatvorenim halama i dvoranama."});
        return;
      }
      if(tip === "rezervacija") {
        await this.pomeriRezervacije(ids,objekatId,terenNaziv,noviPocetak,noviKraj,res);
        return;
      }
      await this.pomeriTrening(ids,objekatId,terenNaziv,noviPocetak,noviKraj,res);

    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Termin trenutno nije moguće pomeriti."});
    }
  };

  private pomeriRezervacije = async(ids: string[],objekatId: string,terenNaziv: string,noviPocetak: Date,noviKraj: Date,res: express.Response) => {
    const rezervacije = await RezervacijaModel.find({
      _id: {$in: ids},
      objekatId: objekatId,
      teren: terenNaziv,
      status: "zakazan"
    }).sort({pocetak: 1});

    if(rezervacije.length !== ids.length) {
      res.status(404).json({message: "Jedna ili više rezervacija nisu pronađene ili više nisu zakazane."});
      return;
    }
    const postojiRezervacija = await RezervacijaModel.exists({
      _id: {
        $nin: ids
      },
      objekatId: objekatId,
      teren: terenNaziv,
      status: "zakazan",
      pocetak: {
        $lt: noviKraj
      },
      kraj: {
        $gt: noviPocetak
      }
    });

    const postojiTrening = await IndividualniTreningModel.exists({
      objekatId: objekatId,
      teren: terenNaziv,
      status: "zakazan",
      pocetak: {
        $lt: noviKraj
      },
      kraj: {
        $gt: noviPocetak
      }
    });

    if(postojiRezervacija || postojiTrening) {
      res.status(409).json({message: "Izabrani period je već zauzet."});
      return;
    }
    const izmene = [];
    for(let indeks = 0;indeks < rezervacije.length;indeks++) {
      const pocetak = new Date(noviPocetak.getTime() + indeks * 60 * 60 * 1000);
      const kraj = new Date(pocetak.getTime() + 60 * 60 * 1000);
      izmene.push({
        updateOne: {
          filter: { _id: rezervacije[indeks]._id},
          update: {
            $set: {pocetak: pocetak,kraj: kraj}
          }
        }
      });
    }
    await RezervacijaModel.bulkWrite(izmene);
    res.json({
      message: rezervacije.length === 1 ? "Rezervacija je uspešno pomerena." : "Spojene rezervacije su uspešno pomerene."
    });
  };

  private pomeriTrening = async(ids: string[],objekatId: string,terenNaziv: string,noviPocetak: Date,noviKraj: Date,res: express.Response) => {
    const treninzi = await IndividualniTreningModel.find({
      _id: {
        $in: ids
      },
      objekatId: objekatId,
      teren: terenNaziv,
      status: "zakazan"
    }).sort({
      pocetak: 1
    });
    if(treninzi.length !== ids.length) {
      res.status(404).json({message: "Jedan ili više treninga nisu pronađeni ili više nisu zakazani."});
      return;
    }
    const ocekivanoTrajanje = treninzi.length * 60 * 60 * 1000;
    if(noviKraj.getTime() - noviPocetak.getTime() !== ocekivanoTrajanje) {
      res.status(400).json({message: "Trajanje spojenih treninga nije ispravno."});
      return;
    }
    const postojiRezervacija = await RezervacijaModel.exists({
      objekatId: objekatId,
      teren: terenNaziv,
      status: "zakazan",
      pocetak: {$lt: noviKraj},
      kraj: {$gt: noviPocetak}
    });
    const postojiDrugiTrening = await IndividualniTreningModel.exists({
      _id: {$nin: ids},
      objekatId: objekatId,
      teren: terenNaziv,
      status: "zakazan",
      pocetak: {$lt: noviKraj},
      kraj: {$gt: noviPocetak}
    });
    if(postojiRezervacija || postojiDrugiTrening) {
      res.status(409).json({message: "Izabrani period je već zauzet."});
      return;
    }
    const izmene = [];
    for(let indeks = 0;indeks < treninzi.length;indeks++) {
      const pocetak = new Date(noviPocetak.getTime() + indeks * 60 * 60 * 1000);
      const kraj = new Date(pocetak.getTime() + 60 * 60 * 1000);
      izmene.push({
        updateOne: {
          filter: {_id: treninzi[indeks]._id},
          update: {
            $set: {pocetak: pocetak,kraj: kraj}
          }
        }
      });
    }
    await IndividualniTreningModel.bulkWrite(izmene);
    res.json({message: treninzi.length === 1 ? "Trening je uspešno pomeren." : "Spojeni treninzi su uspešno pomereni."});
  };

  private normalizujStatus(status: string): string {
    if(status === "zavrsen" || status === "zavrsena" || status === "odrzan") {return "zavrsen";}
    if(status === "neodrzan" || status === "nije_dosao") {return "neodrzan";}
    if(status === "otkazan" || status === "otkazana") {return "otkazan";}
    return "zakazan";
  }
  private vremeUMinute(vreme: string): number {
    const [sat,minut] = vreme.split(":").map(Number);
    return sat * 60 + minut;
  }
  private vremeKrajaUMinute(vreme: string): number {
    if(vreme === "00:00" || vreme === "24:00") {
      return 24 * 60;
    }
    return this.vremeUMinute(vreme);
  }

}