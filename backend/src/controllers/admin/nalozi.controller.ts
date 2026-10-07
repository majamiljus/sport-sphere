import * as express from "express";
import {UserModel} from "../../models/user";
import {PorudzbinaModel} from "../../models/porudzbina";
import {IndividualniTreningModel} from "../../models/trening";
import {RezervacijaModel} from "../../models/rezervacije";
import {FacilityModel} from "../../models/facility";
export class NaloziController {

  dohvatiNaloge = async(req: express.Request,res: express.Response) => {
    try {
      const nalozi = await UserModel.find({
        tip: {
          $ne: "administrator"
        },
        aktivan: true
      }).sort({
        tip: 1,
        prezime: 1,
        ime: 1
      });
      res.json(nalozi.map(nalog => this.mapirajNalog(nalog)));
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Naloge trenutno nije moguće učitati."
      });
    }
  };
  izmeniNalog = async(req: express.Request,res: express.Response) => {
    try {
      const originalnoKorisnickoIme = String(req.params.username || "").trim();
      const username = String(req.body.username || "").trim();
      const ime = String(req.body.ime || "").trim();
      const prezime = String(req.body.prezime || "").trim();
      const telefon = String(req.body.telefon || "").trim();
      const imejl = String(req.body.imejl || "").trim().toLowerCase();
      const sportovi = Array.isArray(req.body.sportovi) ? req.body.sportovi.map((sport: unknown) => String(sport).trim()) : [];
      const adresaSedista = req.body.adresaSedista === null || req.body.adresaSedista === undefined ? null : String(req.body.adresaSedista).trim();
      const maticniBroj = req.body.maticniBroj === null || req.body.maticniBroj === undefined ? null : String(req.body.maticniBroj).trim();
      const pib = req.body.pib === null || req.body.pib === undefined ? null : String(req.body.pib).trim();

      if(!originalnoKorisnickoIme || !username || !ime || !prezime || !telefon || !imejl) {res.status(400).json({message: "Nedostaju obavezni podaci."});return;}
      const nalog = await UserModel.findOne({
        username: originalnoKorisnickoIme
      });
      if(!nalog) {res.status(404).json({message: "Korisnički nalog nije pronađen."});return;}
      const zauzetoKorisnickoIme = await UserModel.findOne({
        username: username,
        _id: {
          $ne: nalog._id
        }
      });
      if(zauzetoKorisnickoIme) {res.status(409).json({message: "Korisničko ime je već zauzeto."});return;}
      const zauzetImejl = await UserModel.findOne({
        imejl: imejl,
        _id: {
          $ne: nalog._id
        }
      });
      if(zauzetImejl) {res.status(409).json({message: "Imejl adresa je već zauzeta."});return;}
      nalog.username = username;
      nalog.ime = ime;
      nalog.prezime = prezime;
      nalog.telefon = telefon;
      nalog.imejl = imejl;
      nalog.sportovi = sportovi;
      if(nalog.tip === "zaposleni") {nalog.adresaSedista = adresaSedista;nalog.maticniBroj = maticniBroj;nalog.pib = pib;}
      await nalog.save();
      res.json({
        message: "Korisnički nalog je uspešno izmenjen.",
        nalog: this.mapirajNalog(nalog)
      });
    } catch(error: any) {
      console.log(error);
      res.status(500).json({
        message: "Nalog trenutno nije moguće izmeniti."
      });
    }
  };
  obrisiNalog = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      if(!username) {res.status(400).json({message: "Korisničko ime je obavezno."});return;}
      const nalog = await UserModel.findOne({
        username: username
      });
      if(!nalog) {res.status(404).json({message: "Korisnički nalog nije pronađen."});return;}
      if(nalog.tip === "administrator") {
        const brojAdministratora = await UserModel.countDocuments({
          tip: "administrator"
        });
        if(brojAdministratora <= 1) {res.status(403).json({message: "Nije moguće obrisati jedinog administratora sistema."});return;}
      }
      await Promise.all([
        PorudzbinaModel.deleteMany({
          username: nalog.username,
          status: "naruceno"
        }),
        IndividualniTreningModel.deleteMany({
          korisnikId: nalog._id,
          status: "zakazan"
        }),
        RezervacijaModel.deleteMany({
          korisnikId: nalog._id,
          status: "zakazan"
        })
      ]);
      if(nalog.tip === "zaposleni") {await FacilityModel.deleteMany({_id: {$in: nalog.objekti},status: "na_cekanju"});}
      await UserModel.deleteOne({
        _id: nalog._id
      });
      res.json({
        message: "Korisnički nalog i povezani aktivni podaci su uspešno obrisani."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Nalog trenutno nije moguće obrisati."
      });
    }
  };
  private mapirajNalog(nalog: any) {
    return {
      tip: nalog.tip,
      username: nalog.username,
      ime: nalog.ime,
      prezime: nalog.prezime,
      telefon: nalog.telefon,
      imejl: nalog.imejl,
      sportovi: nalog.sportovi || [],
      slika: nalog.slika || "default_avatar.jpg",
      objekti: nalog.objekti || [],
      adresaSedista: nalog.adresaSedista ?? null,
      maticniBroj: nalog.maticniBroj ?? null,
      pib: nalog.pib ?? null
    };
  }
  dohvatiZahteveZaRegistraciju = async(req: express.Request,res: express.Response) => {
    try {
      const zahtevi = await UserModel.find({
        tip: {
          $ne: "administrator"
        },
        aktivan: false
      }).sort({
        tip: 1,
        prezime: 1,
        ime: 1
      });
      res.json(zahtevi.map(zahtev => this.mapirajNalog(zahtev)));
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Zahteve za registraciju trenutno nije moguće učitati."
      });
    }
  };
  odobriZahtevZaRegistraciju = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      if(!username) {res.status(400).json({message: "Korisničko ime je obavezno."});return;}
      const zahtev = await UserModel.findOne({
        username: username,
        tip: {
          $ne: "administrator"
        },
        aktivan: false
      });
      if(!zahtev) {res.status(404).json({message: "Zahtev za registraciju nije pronađen."});return;}
      zahtev.aktivan = true;
      await zahtev.save();
      res.json({
        message: "Zahtev za registraciju je uspešno odobren.",
        nalog: this.mapirajNalog(zahtev)
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Zahtev trenutno nije moguće odobriti."
      });
    }
  };
  odbijZahtevZaRegistraciju = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      if(!username) {res.status(400).json({message: "Korisničko ime je obavezno."});return;}
      const zahtev = await UserModel.findOne({
        username: username,
        tip: {
          $ne: "administrator"
        },
        aktivan: false
      });
      if(!zahtev) {res.status(404).json({message: "Zahtev za registraciju nije pronađen."});return;}
      await UserModel.deleteOne({
        _id: zahtev._id
      });
      res.json({
        message: "Zahtev za registraciju je odbijen."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Zahtev trenutno nije moguće odbiti."
      });
    }
  };
}