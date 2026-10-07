import * as express from "express";
import {UserModel} from "../../models/user";
import {RezervacijaModel} from "../../models/rezervacije";
import {FacilityModel} from "../../models/facility";
import mongoose from "mongoose";
import {PromotionModel} from "../../models/promotion";
import {IndividualniTreningModel} from "../../models/trening";
import {OcenaModel} from "../../models/ocena";
export class SportistaController {

  dohvatiProfil = async(req: express.Request,res: express.Response) => {
    try {
      const korisnickoIme = req.params.username;
      const korisnik = await UserModel.findOne({username: korisnickoIme,tip: "sportista"});
      if(!korisnik) {res.status(404).json({message: "Sportista nije pronađen."});return;}
      const rezervacije = await RezervacijaModel.find({korisnikId: korisnik._id}).sort({pocetak: -1});
      res.json({
        korisnik: {
          username: korisnik.username,
          ime: korisnik.ime,
          prezime: korisnik.prezime,
          telefon: korisnik.telefon,
          imejl: korisnik.imejl,
          sportovi: korisnik.sportovi,
          slika: korisnik.slika
        },
        rezervacije: rezervacije.map(rezervacija => ({
          id: String(rezervacija._id),
          nazivObjekta: rezervacija.nazivObjekta,
          grad: rezervacija.grad,
          teren: rezervacija.teren,
          sport: rezervacija.sport,
          pocetak: rezervacija.pocetak,
          kraj: rezervacija.kraj,
          status: rezervacija.status
        }))
      });
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  izmeniProfil = async(req: express.Request,res: express.Response) => {
    try {
      const korisnickoIme = req.params.username;
      const korisnik = await UserModel.findOne({username: korisnickoIme,tip: "sportista"});
      if(!korisnik) {res.status(404).json({message: "Sportista nije pronađen."});return;}
      const sportovi = JSON.parse(req.body.sportovi || "[]");
      const korPostoji = await UserModel.findOne({imejl: req.body.imejl,_id: {$ne: korisnik._id}});
      if(korPostoji) {res.status(400).json({message: "Uneta imejl adresa je već zauzeta."});return;}
      korisnik.ime = req.body.ime;
      korisnik.prezime = req.body.prezime;
      korisnik.telefon = req.body.telefon;
      korisnik.imejl = req.body.imejl;
      korisnik.sportovi = sportovi;
      if(req.file) {korisnik.slika = req.file.filename;}
      await korisnik.save();
      res.json({
        username: korisnik.username,
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        telefon: korisnik.telefon,
        imejl: korisnik.imejl,
        sportovi: korisnik.sportovi,
        slika: korisnik.slika
      });
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  otkaziRezervaciju = async(req: express.Request,res: express.Response) => {
    try {
      const rezervacijaId = req.params.rezervacijaId;
      const korisnickoIme = req.body.username;
      const korisnik = await UserModel.findOne({username: korisnickoIme,tip: "sportista"});
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const rezervacija = await RezervacijaModel.findOne({_id: rezervacijaId,korisnikId: korisnik._id});
      if(!rezervacija) {
        res.status(404).json({message: "Rezervacija nije pronađena."});
        return;
      }
      if(rezervacija.status !== "zakazan") {
        res.status(400).json({message: "Ovu rezervaciju nije moguće otkazati."});
        return;
      }
      const vremeDoPocetka = rezervacija.pocetak.getTime() - Date.now();
      if(vremeDoPocetka < 12 * 60 * 60 * 1000) {
        res.status(400).json({message: "Rezervaciju je moguće otkazati najmanje 12 sati ranije."});
        return;
      }
      rezervacija.status = "otkazan";
      await rezervacija.save();
      res.json({message: "Rezervacija je uspešno otkazana."});
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  pretraziObjekte = async(req: express.Request,res: express.Response) => {
    try {
      const naziv = String(req.body.naziv || "").trim().toLowerCase();
      const grad = String(req.body.grad || "").trim().toLowerCase();
      const sport = String(req.body.sport || "").trim();
      const tipTerena = String(req.body.tipTerena || "").trim();
      const samoSlobodniDanas = req.body.samoSlobodniDanas === true;
      const sviObjekti = await FacilityModel.find({status: "aktivan"});
      const rezultat = [];
      for(const objekat of sviObjekti) {
        const odgovaraNaziv = !naziv || objekat.naziv.toLowerCase().includes(naziv);
        const odgovaraGrad = !grad || objekat.grad.toLowerCase().includes(grad);
        if(!odgovaraNaziv || !odgovaraGrad) {
          continue;
        }
        const odgovarajuciTereni = objekat.tereni.filter(teren => {
          const odgovaraSport = !sport || teren.sport === sport;
          const odgovaraTip = !tipTerena || teren.tip === tipTerena;
          return odgovaraSport && odgovaraTip;
        });
        if(!odgovarajuciTereni.length) {
          continue;
        }
        if(samoSlobodniDanas) {
          const postojiSlobodanTermin = await this.postojiSlobodanTerminDanas(String(objekat._id),odgovarajuciTereni.map(teren => teren.naziv),objekat.radnoVremeOd,objekat.radnoVremeDo);
          if(!postojiSlobodanTermin) {
            continue;
          }
        }
        const tipoviTerena: ("otvoreni" | "zatvoreni")[] = [];
        for(const teren of objekat.tereni) {
          if(!tipoviTerena.includes(teren.tip)) {tipoviTerena.push(teren.tip);}
        }
        const svidjanja = await OcenaModel.countDocuments({
          objekatId: objekat._id,
          reakcija: "svidjanje"
        });
        const nesvidjanja = await OcenaModel.countDocuments({
          objekatId: objekat._id,
          reakcija: "nesvidjanje"
        });
        rezultat.push({
          id: String(objekat._id),
          naziv: objekat.naziv,
          grad: objekat.grad,
          adresa: objekat.adresa,
          sportovi: objekat.sportovi,
          tipoviTerena: tipoviTerena,
          svidjanja: svidjanja,
          nesvidjanja: nesvidjanja,
          kratakOpis: objekat.kratakOpis,
          naslovnaSlika: objekat.naslovnaSlika,
          radnoVremeOd: objekat.radnoVremeOd,
          radnoVremeDo: objekat.radnoVremeDo,
          dozvoljenaNePojavljivanja: objekat.dozvoljenaNePojavljivanja,
          status: objekat.status,
          galerija: objekat.galerija,
          tereni: objekat.tereni.map(teren => ({
            naziv: teren.naziv,
            tip: teren.tip,
            sport: teren.sport,
            kapacitet: teren.kapacitet,
            cenaPoSatu: teren.cenaPoSatu,
            opisOpreme: teren.opisOpreme
          }))
        });
      }
      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };
  
  private postojiSlobodanTerminDanas = async(objekatId: string,naziviTerena: string[],radnoVremeOd: string,radnoVremeDo: string): Promise<boolean> => {
    const sada = new Date();
    const pocetakDana = new Date();
    pocetakDana.setHours(0,0,0,0);
    const krajDana = new Date(pocetakDana);
    krajDana.setDate(krajDana.getDate() + 1);
    const pocetniSat = Number(radnoVremeOd.split(":")[0]);
    let krajnjiSat = Number(radnoVremeDo.split(":")[0]);
    if(radnoVremeDo === "00:00") {
      krajnjiSat = 24;
    }
    const rezervacije = await RezervacijaModel.find({
      objekatId: objekatId,
      teren: {$in: naziviTerena},
      status: "zakazan",
      pocetak: {$lt: krajDana},
      kraj: {$gt: pocetakDana}
    });
    const treninzi = await IndividualniTreningModel.find({
      objekatId: objekatId,
      teren: {$in: naziviTerena},
      status: "zakazan",
      pocetak: {$lt: krajDana},
      kraj: {$gt: pocetakDana}
    });
    for(const nazivTerena of naziviTerena) {
      for(let sat = pocetniSat;sat < krajnjiSat;sat++) {
        const pocetak = new Date(pocetakDana);
        pocetak.setHours(sat,0,0,0);
        if(pocetak <= sada) {continue;}
        const kraj = new Date(pocetak.getTime() + 60 * 60 * 1000);
        const zauzetaRezervacijom = rezervacije.some(rezervacija =>
          rezervacija.teren === nazivTerena &&
          rezervacija.pocetak < kraj &&
          rezervacija.kraj > pocetak
        );
        const zauzetaTreningom = treninzi.some(trening =>
          trening.teren === nazivTerena &&
          trening.pocetak < kraj &&
          trening.kraj > pocetak
        );
        if(!zauzetaRezervacijom && !zauzetaTreningom) {return true;}
      }
    }
    return false;
  };

  dohvatiTermine = async(req: express.Request,res: express.Response) => {
    try {
      const objekatId = String(req.params.objekatId || "").trim();
      const teren = String(req.body.teren || "").trim();
      const korisnickoIme = String(req.body.username || "").trim();
      const od = new Date(req.body.od);
      const doDatuma = new Date(req.body.doDatuma);
      if(!teren || !korisnickoIme || Number.isNaN(od.getTime()) || Number.isNaN(doDatuma.getTime())) {res.status(400).json({message: "Podaci za pretragu termina nisu ispravni."});return;}
      const korisnik = await UserModel.findOne({
        username: korisnickoIme,
        tip: "sportista"
      });
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const objekat = await FacilityModel.findOne({
        _id: objekatId,
        status: "aktivan",
        "tereni.naziv": teren
      });
      if(!objekat) {
        res.status(404).json({message: "Objekat ili teren nije pronađen."});
        return;
      }
      const brojNedolazaka = await this.ukupanBrojNeodrzanih(korisnik._id,objekatId);
      const mozeDaRezervise = brojNedolazaka < objekat.dozvoljenaNePojavljivanja;
      const rezervacije = await RezervacijaModel.find({
        objekatId: objekatId,
        teren: teren,
        status: "zakazan",
        pocetak: {$lt: doDatuma},
        kraj: {$gt: od}
      });
      const treninzi = await IndividualniTreningModel.find({
        objekatId: objekatId,
        teren: teren,
        status: "zakazan",
        pocetak: {$lt: doDatuma},
        kraj: {$gt: od}
      });
      const termini = [
        ...rezervacije.map(rezervacija => ({
          pocetak: rezervacija.pocetak,
          kraj: rezervacija.kraj,
          status: rezervacija.status
        })),
        ...treninzi.map(trening => ({
          pocetak: trening.pocetak,
          kraj: trening.kraj,
          status: trening.status
        }))
      ];
      res.json({
        termini: termini,
        mozeDaRezervise: mozeDaRezervise,
        poruka: mozeDaRezervise ? "" : ("Nemate pravo rezervacije u ovom objektu zbog prevelikog broja neodržanih rezervacija i treninga.")
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Greška prilikom učitavanja termina."
      });
    }
  };

  napraviRezervaciju = async(req: express.Request,res: express.Response) => {
    try {
      const korisnickoIme = String(req.body.username || "").trim();
      const objekatId = String(req.body.objekatId || "").trim();
      const nazivTerena = String(req.body.teren || "").trim();
      const promocijaId = String(req.body.promocijaId || "").trim();
      const pocetak = new Date(req.body.pocetak);
      if(!korisnickoIme || !objekatId || !nazivTerena || Number.isNaN(pocetak.getTime())) {
        res.status(400).json({message: "Podaci rezervacije nisu ispravni."});
        return;
      }

      const kraj = new Date(pocetak.getTime() + 60 * 60 * 1000);
      const korisnik = await UserModel.findOne({username: korisnickoIme,tip: "sportista"});
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const objekat = await FacilityModel.findOne({_id: objekatId,status: "aktivan"});
      if(!objekat) {
        res.status(404).json({message: "Sportski objekat nije pronađen."});
        return;
      }
      const brojNedolazaka = await this.ukupanBrojNeodrzanih(korisnik._id,objekatId);
      if(brojNedolazaka >= objekat.dozvoljenaNePojavljivanja) {
        res.status(403).json({message: "Nemate pravo rezervacije u ovom objektu zbog prevelikog broja neodržanih rezervacija i treninga."});
        return;
      }
      const teren = objekat.tereni.find(teren => teren.naziv === nazivTerena);
      if(!teren) {
        res.status(404).json({message: "Izabrani teren nije pronađen."});
        return;
      }
      if(pocetak <= new Date()) {
        res.status(400).json({message: "Nije moguće rezervisati prošli termin."});
        return;
      }
      if(pocetak.getMinutes() !== 0 || pocetak.getSeconds() !== 0 || pocetak.getMilliseconds() !== 0) {
        res.status(400).json({message: "Termin mora početi na pun sat."});
        return;
      }
      const pocetakRadnogVremena = this.vremeUMinute(objekat.radnoVremeOd);
      const krajRadnogVremena = this.vremeKrajaUMinute(objekat.radnoVremeDo);
      const minutiPocetka = this.minutiDatuma(pocetak);
      const zavrsavaSledecegDanaUPonoc = this.jeSledeciDanUPonoc(pocetak,kraj);
      const minutiKraja = zavrsavaSledecegDanaUPonoc ? 24 * 60 : this.minutiDatuma(kraj);
      if(minutiPocetka < pocetakRadnogVremena || minutiKraja > krajRadnogVremena) {
        res.status(400).json({message: `Termin mora biti u okviru radnog vremena ${objekat.radnoVremeOd}–${objekat.radnoVremeDo}.`});
        return;
      }
      const postojecaRezervacija = await RezervacijaModel.findOne({
        objekatId: objekatId,
        teren: nazivTerena,
        status: "zakazan",
        pocetak: {$lt: kraj},
        kraj: {$gt: pocetak}
      });

      if(postojecaRezervacija) {
        res.status(409).json({message: "Izabrani termin je već zauzet."});
        return;
      }
      let cena = teren.cenaPoSatu;
      if(promocijaId) {
        const datumTermina = pocetak.toISOString().split("T")[0];
        const promocija = await PromotionModel.findOne({
          _id: promocijaId,
          objekatId: objekatId,
          sport: {$in: [teren.sport,null]},
          aktivna: true,
          datumPocetka: {$lte: datumTermina},
          datumKraja: {$gte: datumTermina}
        });
        if(!promocija) {
          res.status(400).json({message: "Izabrana promocija nije dostupna za ovaj termin."});
          return;
        }
        if(promocija.tipPopusta === "procenat") {
          cena = cena - cena * promocija.vrednostPopusta / 100;
        }
        else if(promocija.tipPopusta === "fiksni") {
          cena = cena - promocija.vrednostPopusta;
        }
        if(cena < 0) {cena = 0;}
      }
      cena = Math.round(cena);
      await RezervacijaModel.create({
        korisnikId: korisnik._id,
        objekatId: objekatId,
        nazivObjekta: objekat.naziv,
        grad: objekat.grad,
        teren: teren.naziv,
        sport: teren.sport,
        pocetak: pocetak,
        kraj: kraj,
        status: "zakazan"
      });
      res.status(201).json({
        message: `Rezervacija je uspešno zakazana. Cena termina je ${cena} RSD.`,
        cena: cena
      });
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  private ukupanBrojNeodrzanih = async(korisnikId: mongoose.Types.ObjectId | string,objekatId: string): Promise<number> => {
    const [brojNeodrzanihRezervacija,brojNeodrzanihTreninga] = await Promise.all([
      RezervacijaModel.countDocuments({
        korisnikId: korisnikId,
        objekatId: objekatId,
        status: "neodrzan"
      }),
      IndividualniTreningModel.countDocuments({
        korisnikId: korisnikId,
        objekatId: objekatId,
        status: "neodrzan"
      })
    ]);
    return (brojNeodrzanihRezervacija + brojNeodrzanihTreninga);
  };
  
  private vremeUMinute(vreme: string): number {
    const [sat,minut] = vreme.split(":").map(Number);
    return sat * 60 + minut;
  }
  private vremeKrajaUMinute(vreme: string): number {
    if(vreme === "00:00") {return 24 * 60;}
    return this.vremeUMinute(vreme);
  }
  private minutiDatuma(datum: Date): number {
    return (datum.getHours() * 60 + datum.getMinutes());
  }
  private jeSledeciDanUPonoc(pocetak: Date,kraj: Date): boolean {
    if(kraj.getHours() !== 0 || kraj.getMinutes() !== 0 || kraj.getSeconds() !== 0 || kraj.getMilliseconds() !== 0) {return false;}
    const ocekivaniKraj = new Date(pocetak);
    ocekivaniKraj.setDate(ocekivaniKraj.getDate() + 1);
    ocekivaniKraj.setHours(0,0,0,0);
    return (kraj.getTime() === ocekivaniKraj.getTime());
  }
}