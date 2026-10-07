import * as express from "express";
import mongoose from "mongoose";
import {FacilityModel} from "../../models/facility";
import {UserModel} from "../../models/user";
import PDFDocument from "pdfkit";
import {RezervacijaModel} from "../../models/rezervacije";
import {IndividualniTreningModel} from "../../models/trening";
import {PorudzbinaModel} from "../../models/porudzbina";
import {OcenaModel} from "../../models/ocena";

export class ZaposleniController {

  dohvatiProfil = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const korisnik = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!korisnik) {
        res.status(404).json({message: "Zaposleni nije pronađen."});return;
      }
      const objekti = await FacilityModel.find({_id: {$in: korisnik.objekti}}).sort({naziv: 1});
      const rezultatObjekata = [];
      for(const objekat of objekti) {
        const svidjanja = await OcenaModel.countDocuments({
          objekatId: objekat._id,
          reakcija: "svidjanje"
        });
        const nesvidjanja = await OcenaModel.countDocuments({
          objekatId: objekat._id,
          reakcija: "nesvidjanje"
        });
        rezultatObjekata.push(this.mapirajObjekat(objekat,svidjanja,nesvidjanja));
      }
      res.json({
        korisnik: {
          username: korisnik.username,
          ime: korisnik.ime,
          prezime: korisnik.prezime,
          telefon: korisnik.telefon,
          imejl: korisnik.imejl,
          sportovi: korisnik.sportovi,
          slika: korisnik.slika,
          adresaSedista: korisnik.adresaSedista,
          maticniBroj: korisnik.maticniBroj,
          pib: korisnik.pib
        },
        objekti: rezultatObjekata
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Profil trenutno nije moguće učitati."});
    }
  };

  izmeniProfil = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const ime = String(req.body.ime || "").trim();
      const prezime = String(req.body.prezime || "").trim();
      const telefon = String(req.body.telefon || "").trim();
      const imejl = String(req.body.imejl || "").trim().toLowerCase();
      let sportovi: string[] = [];
      try {
        sportovi = JSON.parse(req.body.sportovi || "[]");
      }
      catch {
        res.status(400).json({message: "Izabrani sportovi nisu ispravni."});
        return;
      }
      if(!username || !ime || !prezime || !telefon || !imejl) {
        res.status(400).json({message: "Sva lična polja su obavezna."});
        return;
      }
      if(!Array.isArray(sportovi) || sportovi.length > 5 || !sportovi.every(sport => typeof sport === "string")) {
        res.status(400).json({message: "Možete izabrati najviše pet sportova."});
        return;
      }
      const zauzetImejl = await UserModel.findOne({imejl: imejl,username: {$ne: username}});
      if(zauzetImejl) {
        res.status(409).json({message: "Imejl adresa je već zauzeta."});
        return;
      }
      const korisnik = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!korisnik) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      korisnik.ime = ime;
      korisnik.prezime = prezime;
      korisnik.telefon = telefon;
      korisnik.imejl = imejl;
      korisnik.sportovi = sportovi;
      if(req.file) {
        korisnik.slika = req.file.filename;
      }
      await korisnik.save();
      res.json({
        username: korisnik.username,
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        telefon: korisnik.telefon,
        imejl: korisnik.imejl,
        sportovi: korisnik.sportovi,
        slika: korisnik.slika,
        adresaSedista: korisnik.adresaSedista,
        maticniBroj: korisnik.maticniBroj,
        pib: korisnik.pib
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Podatke trenutno nije moguće sačuvati."});
    }
  };

  dodajObjekat = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const korisnik = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!korisnik) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const greska = this.validirajObjekat(req.body);
      if(greska) {
        res.status(400).json({message: greska});
        return;
      }
      const objekat = await FacilityModel.create(this.pripremiObjekat(req.body));
      korisnik.objekti.push(objekat._id);
      await korisnik.save();
      res.status(201).json(this.mapirajObjekat(objekat,0,0));
    } catch(error: any) {
      console.log(error);
      res.status(500).json({message: "Objekat trenutno nije moguće dodati."});
    }
  };

  azurirajObjekat = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const id = String(req.params.id || "").trim();
      const korisnik = await UserModel.findOne({
        username: username,
        tip: "zaposleni",
        objekti: id
      });
      if(!korisnik) {
        res.status(403).json({message: "Nemate dozvolu za ažuriranje ovog objekta."});
        return;
      }
      const greska = this.validirajObjekat(req.body);
      if(greska) {
        res.status(400).json({message: greska});
        return;
      }
      const podaci = this.pripremiObjekat(req.body,false);
      const objekat = await FacilityModel.findByIdAndUpdate(id,{$set: podaci},{new: true,runValidators: true});
      if(!objekat) {
        res.status(404).json({message: "Objekat nije pronađen."});
        return;
      }
      const svidjanja = await OcenaModel.countDocuments({
        objekatId: objekat._id,
        reakcija: "svidjanje"
      });
      const nesvidjanja = await OcenaModel.countDocuments({
        objekatId: objekat._id,
        reakcija: "nesvidjanje"
      });
      res.json(this.mapirajObjekat(objekat,svidjanja,nesvidjanja));
    } catch(error: any) {
      console.log(error);
      if(error.code === 11000) {
        res.status(409).json({message: "Objekat sa tim nazivom već postoji u izabranom gradu."});
        return;
      }
      res.status(500).json({message: "Objekat trenutno nije moguće ažurirati."});
    }
  };

 dodajObjekatIzJson = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const korisnik = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!korisnik) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      if(!req.file) {
        res.status(400).json({message: "JSON fajl nije izabran."});
        return;
      }
      let podaci: any;
      try {
        podaci = JSON.parse(req.file.buffer.toString("utf-8"));
      }
      catch {
        res.status(400).json({message: "Sadržaj JSON fajla nije ispravan."});
        return;
      }
      const greska = this.validirajObjekat(podaci);
      if(greska) {
        res.status(400).json({message: greska});
        return;
      }
      const objekat = await FacilityModel.create(this.pripremiObjekat(podaci));
      korisnik.objekti.push(objekat._id);
      await korisnik.save();
      res.status(201).json(this.mapirajObjekat(objekat,0,0));
    }
    catch(error: any) {
      console.log(error);
      if(error.code === 11000) {
        res.status(409).json({
          message: "Objekat sa tim nazivom već postoji u tom gradu."
        });
        return;
      }
      res.status(500).json({
        message: "Objekat trenutno nije moguće dodati."
      });
    }
  };

  private validirajObjekat(podaci: any): string | null {
    if(!String(podaci.naziv || "").trim() || !String(podaci.grad || "").trim() || !String(podaci.adresa || "").trim()) {
      return "Naziv, grad i adresa su obavezni.";
    }
    if(!String(podaci.radnoVremeOd || "").trim() || !String(podaci.radnoVremeDo || "").trim()) {
      return "Radno vreme je obavezno.";
    }
    if(!Number.isInteger(Number(podaci.dozvoljenaNePojavljivanja)) || Number(podaci.dozvoljenaNePojavljivanja) < 1) {
      return "Broj dozvoljenih nedolazaka mora biti ceo broj i najmanje 1.";
    }
    if(!Array.isArray(podaci.tereni) || podaci.tereni.length === 0) {
      return "Objekat mora imati najmanje jedan teren, halu ili dvoranu.";
    }
    const nazivi: string[] = [];
    let postojiOtvoreniTeren = false;

    for(const teren of podaci.tereni) {
      const naziv = String(teren.naziv || "").trim().toLowerCase();
      if(!naziv) {return "Svaki teren mora imati naziv.";}
      if(nazivi.includes(naziv)) {
        return "Nazivi terena, hala i dvorana moraju biti jedinstveni.";
      }
      nazivi.push(naziv);
      if(!["otvoreni","zatvoreni"].includes(teren.tip)) {
        return "Tip terena nije ispravan.";
      }
      if(!String(teren.sport || "").trim()) {
        return "Sport svakog terena je obavezan.";
      }
      if(Number(teren.kapacitet) < 1) {
        return "Kapacitet mora biti najmanje 1.";
      }
      if(Number(teren.cenaPoSatu) < 0) {
        return "Cena terena ne može biti negativna.";
      }
      if(String(teren.opisOpreme || "").length > 300) {
        return "Opis opreme može imati najviše 300 karaktera.";
      }
      if(teren.tip === "otvoreni" && Number(teren.kapacitet) >= 4) {
        postojiOtvoreniTeren = true;
      }
    }
    if(!postojiOtvoreniTeren) {
      return "Objekat mora imati najmanje jedan otvoreni teren kapaciteta najmanje 4.";
    }
    return null;
  }

  private pripremiObjekat(podaci: any,novi = true) {
    const sportovi: string[] = [];
    for(const teren of podaci.tereni) {
      const sport = String(teren.sport).trim();
      if(!sportovi.includes(sport)) {sportovi.push(sport);}
    }
    const objekat: any = {
      naziv: String(podaci.naziv).trim(),
      grad: String(podaci.grad).trim(),
      adresa: String(podaci.adresa).trim(),
      sportovi: sportovi,
      kratakOpis: String(podaci.kratakOpis || "").trim(),
      naslovnaSlika: String(podaci.naslovnaSlika || "/facilities/default-facility.jpg"),
      radnoVremeOd: String(podaci.radnoVremeOd),
      radnoVremeDo: String(podaci.radnoVremeDo),
      dozvoljenaNePojavljivanja: Number(podaci.dozvoljenaNePojavljivanja),
      tereni: podaci.tereni.map((teren: any) => ({
        naziv: String(teren.naziv).trim(),
        tip: teren.tip,
        sport: String(teren.sport).trim(),
        kapacitet: Number(teren.kapacitet),
        cenaPoSatu: Number(teren.cenaPoSatu),
        opisOpreme: String(teren.opisOpreme || "").trim()
      })),
      galerija: Array.isArray(podaci.galerija) ? podaci.galerija : []
    };
    if(novi) {
      objekat.status = "na_cekanju";
    }
    return objekat;
  }

  private mapirajObjekat(objekat: any,svidjanja: number,nesvidjanja: number) {
    return {
      id: String(objekat._id),
      naziv: objekat.naziv,
      grad: objekat.grad,
      adresa: objekat.adresa,
      sportovi: objekat.sportovi || [],
      tipoviTerena: this.dohvatiTipoveTerena(objekat.tereni || []),
      status: objekat.status,
      svidjanja: svidjanja,
      nesvidjanja: nesvidjanja,
      kratakOpis: objekat.kratakOpis || "",
      naslovnaSlika: objekat.naslovnaSlika || "/facilities/default-facility.jpg",
      radnoVremeOd: objekat.radnoVremeOd,
      radnoVremeDo: objekat.radnoVremeDo,
      dozvoljenaNePojavljivanja: objekat.dozvoljenaNePojavljivanja,
      galerija: objekat.galerija || [],
      tereni: (objekat.tereni || []).map((teren: any) => ({naziv: teren.naziv,tip: teren.tip,sport: teren.sport,kapacitet: teren.kapacitet,cenaPoSatu: teren.cenaPoSatu,opisOpreme: teren.opisOpreme || ""}))
    };
  }
  private dohvatiTipoveTerena(tereni: any[]) {
    const tipovi: ("otvoreni" | "zatvoreni")[] = [];
    for(const teren of tereni) {
      if(!tipovi.includes(teren.tip)) {tipovi.push(teren.tip);}
    }
    return tipovi;
  }

  generisiIzvestajPopunjenosti = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.query.username || "").trim();
      const mesec = String(req.query.mesec || "").trim();
      if(!username || !mesec) {
        res.status(400).json({message: "Korisničko ime i mesec su obavezni."});
        return;
      }
      const period = this.napraviPeriodMeseca(mesec);

      if(!period) {
        res.status(400).json({ message: "Mesec nije ispravan."});
        return;
      }
      const zaposleni = await UserModel.findOne({username: username,tip: "zaposleni"});

      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen." });
        return;
      }
      const objekti = await FacilityModel.find({
        _id: {$in: zaposleni.objekti},
        status: "aktivan"
      });
      const rezervacije = await RezervacijaModel.find({
        objekatId: {$in: zaposleni.objekti},
        status: {$in: ["zakazan","zavrsen","neodrzan"]},
        pocetak: {
          $gte: period.pocetak,
          $lt: period.kraj
        }
      });
      const treninzi = await IndividualniTreningModel.find({
        objekatId: {$in: zaposleni.objekti},
        status: {$in: ["zakazan","zavrsen","neodrzan"]},
        pocetak: {
          $gte: period.pocetak,
          $lt: period.kraj
        }
      });

      res.setHeader("Content-Type","application/pdf");
      res.setHeader("Content-Disposition",`attachment; filename="popunjenost-${mesec}.pdf"`
      );

     const pdf = new PDFDocument({
        size: "A4",
        margin: 40
      });

      pdf.registerFont(
        "DejaVu",
        "src/fonts/DejaVuSans.ttf"
      );

      pdf.pipe(res);

      pdf
        .font("DejaVu")
        .fontSize(18)
        .text("Izveštaj o popunjenosti terena");

      pdf.moveDown();

      pdf
        .font("DejaVu")
        .fontSize(11)
        .text(`Mesec: ${mesec}`)
        .text(`Zaposleni: ${zaposleni.ime} ${zaposleni.prezime}`);

      pdf.moveDown();

      for(const objekat of objekti) {
        pdf.fontSize(14).text(`Objekat: ${objekat.naziv}`);
        const brojDana = new Date(period.kraj.getTime() - 1).getDate();
        const pocetniSat = Number(objekat.radnoVremeOd.split(":")[0]);
        let krajnjiSat =Number(objekat.radnoVremeDo.split(":")[0]);
        if(objekat.radnoVremeDo === "00:00" || objekat.radnoVremeDo === "24:00") {
          krajnjiSat = 24;
        }
        const brojRadnihSatiDnevno =  krajnjiSat - pocetniSat;
        for(const teren of objekat.tereni) {
          let brojZauzetihTermina = 0;
          for(const rezervacija of rezervacije) {
            if(String(rezervacija.objekatId) ===  String(objekat._id) && rezervacija.teren === teren.naziv) {
              brojZauzetihTermina++;
            }
          }
          for(const trening of treninzi) {
            if(String(trening.objekatId) === String(objekat._id) && trening.teren === teren.naziv) {
              brojZauzetihTermina++;
            }
          }
          const brojDostupnihTermina = brojDana * brojRadnihSatiDnevno;
          let popunjenost = 0;
          if(brojDostupnihTermina > 0) {
            popunjenost = brojZauzetihTermina / brojDostupnihTermina * 100;
          }
          pdf.fontSize(10).text(`${teren.naziv} (${teren.sport})`)
            .text(`Zauzetih termina: ${brojZauzetihTermina}`)
            .text(`Dostupnih termina: ${brojDostupnihTermina}`)
            .text(`Popunjenost: ${popunjenost.toFixed(1)}%`);
          pdf.moveDown();
        }
      }
      pdf.end();
    } catch(error) {
      console.log(error);
      if(!res.headersSent) {
        res.status(500).json({message:"Izveštaj o popunjenosti trenutno nije moguće generisati."});
      }
    }
  };

  generisiIzvestajPrometaOpreme = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.query.username || "").trim();
      const mesec = String(req.query.mesec || "").trim();
      if(!username || !mesec) {
        res.status(400).json({ message: "Korisničko ime i mesec su obavezni."});
        return;
      }
      const period = this.napraviPeriodMeseca(mesec);
      if(!period) {
        res.status(400).json({ message: "Mesec nije ispravan."});
        return;
      }
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const porudzbine = await PorudzbinaModel.find({
        status: "preuzeto",
        datumPorudzbine: {
          $gte: period.pocetak,
          $lt: period.kraj
        }
      });
      const proizvodi: {
        opremaId: string;
        naziv: string;
        sport: string;
        kolicina: number;
        promet: number;
      }[] = [];

      let ukupanBrojKomada = 0;
      let ukupanPromet = 0;

      for(const porudzbina of porudzbine) {
        for(const stavka of porudzbina.stavke) {
          const postojeciProizvod = proizvodi.find(proizvod =>
                proizvod.opremaId === String(stavka.opremaId)
          );
          const kolicina = Number(stavka.kolicina);
          const promet = Number(stavka.cena) * kolicina;
          if(postojeciProizvod) {
            postojeciProizvod.kolicina += kolicina;
            postojeciProizvod.promet +=  promet;
          } else {
            proizvodi.push({
              opremaId: String(stavka.opremaId),
              naziv: stavka.naziv,
              sport: stavka.sport,
              kolicina: kolicina,
              promet: promet
            });
          }
          ukupanBrojKomada += kolicina;
          ukupanPromet += promet;
        }
      }
      res.setHeader("Content-Type","application/pdf");
      res.setHeader("Content-Disposition",`attachment; filename="promet-opreme-${mesec}.pdf"`
      );

      const pdf = new PDFDocument({
        size: "A4",
        margin: 40
      });
      pdf.registerFont(
        "DejaVu",
        "src/fonts/DejaVuSans.ttf"
      );
      pdf.font("DejaVu");
      pdf.pipe(res);
      pdf.fontSize(18).text("Izvestaj o prometu opreme");
      pdf.moveDown();
      pdf.fontSize(11)
        .text(`Mesec: ${mesec}`)
        .text(`Zaposleni: ${zaposleni.ime} ${zaposleni.prezime}`)
        .text(`Broj porudzbina: ${porudzbine.length}`)
        .text(`Broj prodatih komada: ${ukupanBrojKomada}`)
        .text(`Ukupan promet: ${ukupanPromet} RSD`);
      pdf.moveDown();
      if(proizvodi.length === 0) {
        pdf.text("U izabranom mesecu nije bilo preuzetih porudzbina.");
      }
      for(const proizvod of proizvodi) {
        pdf.fontSize(11).text(proizvod.naziv);
        pdf.fontSize(10)
          .text(`Sport: ${proizvod.sport}`)
          .text(`Kolicina: ${proizvod.kolicina}`)
          .text(`Promet: ${proizvod.promet} RSD`);
        pdf.moveDown();
      }
      pdf.end();

    } catch(error) {
      console.log(error);
      if(!res.headersSent) {
        res.status(500).json({message:"Izveštaj o prometu opreme trenutno nije moguće generisati."});
      }
    }
  };
  
  private napraviPeriodMeseca(mesec: string): {pocetak: Date;kraj: Date;} | null {
    const poklapanje = /^(\d{4})-(\d{2})$/.exec(mesec);
    if(!poklapanje) {return null;}
    const godina = Number(poklapanje[1]);
    const brojMeseca = Number(poklapanje[2]);
    if(brojMeseca < 1 || brojMeseca > 12) {
      return null;
    }
    const pocetak = new Date(godina,brojMeseca - 1,1,0,0,0,0);
    const kraj = new Date(godina,brojMeseca,1,0,0,0,0);
    const sada = new Date();
    const trenutniMesec = new Date(sada.getFullYear(),sada.getMonth(),1,0,0,0,0);
    if(pocetak > trenutniMesec) {
      return null;
    }
    return {
      pocetak: pocetak,
      kraj: kraj
    };
  }
  

}