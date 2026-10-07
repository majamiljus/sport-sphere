import * as express from "express";
import {FacilityModel} from "../../models/facility";
import {OcenaModel} from "../../models/ocena";
import {PromotionModel} from "../../models/promotion";
import {RezervacijaModel} from "../../models/rezervacije";
import {UserModel} from "../../models/user";
import {PorudzbinaModel} from "../../models/porudzbina";
import {IndividualniTreningModel} from "../../models/trening";
interface TerminiPoSportu {
  sport: string;
  odigrani: number;
  rezervisani: number;
}
interface MesecnaAktivnost {
  mesec: string;
  odigrani: number;
  rezervisani: number;
}
interface PotrosnjaPoSportu {
  sport: string;
  potrosnja: number;
}
export class OcenaController {

  dohvatiOceneObjekta = async(req: express.Request,res: express.Response) => {
    try {
      const objekatId = String(req.params.objekatId || "").trim();
      const username = String(req.query.username || "").trim();
      const objekat = await FacilityModel.findOne({_id: objekatId,status: "aktivan"});
      if(!objekat) {
        res.status(404).json({message: "Objekat nije pronađen."});
        return;
      }
      const komentari = await OcenaModel.find({objekatId: objekatId}).sort({datum: -1}).limit(5);
      const svidjanja = await OcenaModel.countDocuments({
        objekatId: objekatId,
        reakcija: "svidjanje"
      });
      const nesvidjanja = await OcenaModel.countDocuments({
        objekatId: objekatId,
        reakcija: "nesvidjanje"
      });
      let brojPotvrdjenihRezervacija = 0;
      let brojOstavljenihOcena = 0;
      let mozeDaOceni = false;
      if(username) {
        const korisnik = await UserModel.findOne({username: username,tip: "sportista"});
        if(korisnik) {
          brojPotvrdjenihRezervacija = await RezervacijaModel.countDocuments({korisnikId: korisnik._id,objekatId: objekatId,status: "zavrsen"});
          brojOstavljenihOcena = await OcenaModel.countDocuments({korisnikId: korisnik._id,objekatId: objekatId});
          mozeDaOceni = brojOstavljenihOcena < brojPotvrdjenihRezervacija;
        }
      }
      res.json({
        svidjanja: svidjanja,
        nesvidjanja: nesvidjanja,
        mozeDaOceni: mozeDaOceni,
        brojPotvrdjenihRezervacija: brojPotvrdjenihRezervacija,
        brojOstavljenihOcena: brojOstavljenihOcena,
        komentari: komentari.map(ocena => ({
          id: String(ocena._id),
          username: ocena.username,
          ime: ocena.ime,
          prezime: ocena.prezime,
          reakcija: ocena.reakcija,
          komentar: ocena.komentar,
          datum: ocena.datum,
          mojKomentar: Boolean(username) && ocena.username === username
        }))
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Podatke o ocenama nije moguće učitati."});
    }
  };

  ostaviOcenu = async(req: express.Request,res: express.Response) => {
    try {
      const objekatId = String(req.params.objekatId || "").trim();
      const username = String(req.body.username || "").trim();
      const reakcija = String(req.body.reakcija || "").trim();
      const komentar = String(req.body.komentar || "").trim();
      if(!objekatId || !username || !reakcija) {
        res.status(400).json({message: "Reakcija i komentar su obavezni."});
        return;
      }
      if(reakcija !== "svidjanje" && reakcija !== "nesvidjanje") {
        res.status(400).json({message: "Izabrana reakcija nije ispravna."});
        return;
      }
      if(komentar.length > 500) {
        res.status(400).json({message: "Komentar može imati najviše 500 karaktera."});
        return;
      }
      const korisnik = await UserModel.findOne({username: username,tip: "sportista"});
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const objekat = await FacilityModel.findOne({_id: objekatId,status: "aktivan"});
      if(!objekat) {
        res.status(404).json({message: "Objekat nije pronađen."});
        return;
      }
      const brojPotvrdjenihRezervacija = await RezervacijaModel.countDocuments({korisnikId: korisnik._id,objekatId: objekatId,status: "zavrsen"});
      if(brojPotvrdjenihRezervacija === 0) {
        res.status(403).json({message: "Objekat možete oceniti samo ako ste imali završenu rezervaciju."});
        return;
      }
      const brojOstavljenihOcena = await OcenaModel.countDocuments({korisnikId: korisnik._id,objekatId: objekatId});
      if(brojOstavljenihOcena >= brojPotvrdjenihRezervacija) {
        res.status(403).json({message: "Broj ocena ne može biti veći od broja završenih rezervacija."});
        return;
      }
      await OcenaModel.create({
        objekatId: objekatId,
        korisnikId: korisnik._id,
        username: korisnik.username,
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        reakcija: reakcija,
        komentar: komentar,
        datum: new Date()
      });
      res.status(201).json({message: "Ocena i komentar su uspešno sačuvani."});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Ocenu trenutno nije moguće sačuvati."});
    }
  };

  dohvatiPromocijeObjekta = async(req: express.Request,res: express.Response): Promise<void> => {
    try {
      const objekatId = String(req.params.objekatId || "").trim();
      const objekat = await FacilityModel.findOne({_id: objekatId,status: "aktivan"});
      if(!objekat) {
        res.status(404).json({message: "Objekat nije pronađen."});
        return;
      }
      const promocije = await PromotionModel.find({objekatId: objekatId,aktivna: true}).sort({datumPocetka: 1});
      res.json(promocije.map(promocija => ({
        id: String(promocija._id),
        naziv: promocija.naziv,
        objekatId: promocija.objekatId,
        nazivObjekta: objekat.naziv,
        gradObjekta: objekat.grad,
        datumPocetka: promocija.datumPocetka,
        datumKraja: promocija.datumKraja,
        tipPopusta: promocija.tipPopusta,
        vrednostPopusta: promocija.vrednostPopusta,
        sport: promocija.sport
      })));
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Promocije trenutno nije moguće učitati."
      });
    }
  };

  dohvatiObjekteZaOcenjivanje = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const korisnik = await UserModel.findOne({username: username,tip: "sportista"});
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const rezervacije = await RezervacijaModel.find({korisnikId: korisnik._id,status: "zavrsen"});
      const brojRezervacijaPoObjektu = new Map<string,number>();
      for(const rezervacija of rezervacije) {
        const objekatId = String(rezervacija.objekatId);
        const trenutniBroj = brojRezervacijaPoObjektu.get(objekatId) || 0;
        brojRezervacijaPoObjektu.set(objekatId,trenutniBroj + 1);
      }

      const rezultat: {
        id: string;
        naziv: string;
        grad: string;
        adresa: string;
        naslovnaSlika: string;
        sportovi: string[];
        svidjanja: number;
        nesvidjanja: number;
        brojPotvrdjenihRezervacija: number;
        brojOstavljenihOcena: number;
        brojPreostalihOcena: number;
      }[] = [];
      const rezervacijePoObjektu = Array.from(brojRezervacijaPoObjektu.entries());

      for(const podatak of rezervacijePoObjektu) {
        const objekatId = podatak[0];
        const brojPotvrdjenihRezervacija = podatak[1];
        const brojOstavljenihOcena = await OcenaModel.countDocuments({korisnikId: korisnik._id,objekatId: objekatId});
        const brojPreostalihOcena = brojPotvrdjenihRezervacija - brojOstavljenihOcena;
        if(brojPreostalihOcena <= 0) {
          continue;
        }
        const objekat = await FacilityModel.findOne({_id: objekatId,status: "aktivan"});
        if(!objekat) {
          continue;
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
          naslovnaSlika: objekat.naslovnaSlika,
          sportovi: objekat.sportovi,
          svidjanja: svidjanja,
          nesvidjanja: nesvidjanja,
          brojPotvrdjenihRezervacija: brojPotvrdjenihRezervacija,
          brojOstavljenihOcena: brojOstavljenihOcena,
          brojPreostalihOcena: brojPreostalihOcena
        });
      }
      rezultat.sort((prvi,drugi) => prvi.naziv.localeCompare(drugi.naziv,"sr",{sensitivity: "base"}));
      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Objekte za ocenjivanje trenutno nije moguće učitati."});
    }
  };

  dohvatiStatistiku = async(req: express.Request,res: express.Response) => {
    try {
      const rezervacije = await RezervacijaModel.find({});
      const treninzi = await IndividualniTreningModel.find({});
      const porudzbine = await PorudzbinaModel.find({
        status: {$ne: "otkazano"}
      });
      const sviTermini = [...rezervacije,...treninzi];
      const terminiPoSportovima = this.izracunajTerminePoSportovima(sviTermini);
      const mesecnaAktivnost =this.izracunajMesecnuAktivnost(sviTermini);
      const potrosnjaPoSportovima =this.izracunajPotrosnjuPoSportovima(porudzbine);
      const ukupanBrojRezervacija = sviTermini.filter(termin => termin.status !== "otkazan").length;
      const ukupanBrojOdigranihTermina =sviTermini.filter(termin =>termin.status === "zavrsen").length;
      let ukupnaPotrosnja = 0;
      for(const porudzbina of porudzbine) {
        ukupnaPotrosnja += Number(porudzbina.ukupnaCena || 0);
      }
      res.json({
        ukupanBrojRezervacija:ukupanBrojRezervacija,
        ukupanBrojOdigranihTermina:ukupanBrojOdigranihTermina,
        ukupnaPotrosnja:ukupnaPotrosnja,
        terminiPoSportovima:terminiPoSportovima,
        mesecnaAktivnost:mesecnaAktivnost,
        potrosnjaPoSportovima:potrosnjaPoSportovima
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message:"Statistiku trenutno nije moguće učitati."});
    }
  };

  private izracunajTerminePoSportovima(termini: any[]): TerminiPoSportu[] {
    const statistika = new Map<string,TerminiPoSportu>();
    for(const termin of termini) {
      if(termin.status === "otkazan" ||  termin.status === "neodrzan") {
        continue;
      }
      const sport = String(termin.sport || "Nepoznato");
      if(!statistika.has(sport)) {
        statistika.set(sport,
          {
            sport: sport,
            odigrani: 0,
            rezervisani: 0
          }
        );
      }
      const podatak = statistika.get(sport);
      if(!podatak) {continue;}
      if(termin.status === "zavrsen") {
        podatak.odigrani++;
      }
      if(termin.status === "zakazan") {
        podatak.rezervisani++;
      }
    }
    return Array.from(statistika.values()).sort(
        (prvi,drugi) => prvi.sport.localeCompare(drugi.sport,"sr",{sensitivity: "base"})
      );
  }

  private izracunajMesecnuAktivnost(termini: any[]): MesecnaAktivnost[] {
    const rezultat:MesecnaAktivnost[] = [];
    const sada = new Date();
    const trenutnaGodina = sada.getFullYear();
    const trenutniMesec = sada.getMonth();
    for(let brojMeseca = 0; brojMeseca <= trenutniMesec; brojMeseca++) {
      const datumMeseca = new Date(trenutnaGodina,brojMeseca,1);
      const nazivMeseca = datumMeseca.toLocaleDateString("sr-Latn-RS", { month: "short" });
      let odigrani = 0;
      let rezervisani = 0;
      for(const termin of termini) {
        const pocetak = new Date(termin.pocetak);
        if(Number.isNaN(pocetak.getTime()) || pocetak.getFullYear() !== trenutnaGodina || pocetak.getMonth() !== brojMeseca) {
          continue;
        }
        if(termin.status === "zavrsen") {
          odigrani++;
        }
        if(termin.status === "zakazan") {
          rezervisani++;
        }
      }
      rezultat.push({
        mesec: nazivMeseca,
        odigrani: odigrani,
        rezervisani: rezervisani
      });
    }
    return rezultat;
  }
  
  private izracunajPotrosnjuPoSportovima(porudzbine: any[]): PotrosnjaPoSportu[] {
    const potrosnja = new Map<string,number>();
    for(const porudzbina of porudzbine) {
      for(const stavka of porudzbina.stavke || []) {
        const sport = String(stavka.sport || "Ostalo");
        const vrednostStavke = Number(stavka.cena || 0) * Number(stavka.kolicina || 0);
        const trenutnaPotrosnja = potrosnja.get(sport) || 0;
        potrosnja.set(sport,trenutnaPotrosnja + vrednostStavke);
      }
    }
    return Array.from(potrosnja.entries()).map(podatak => ({
      sport: podatak[0],
      potrosnja: podatak[1]
    })).sort((prvi,drugi) => drugi.potrosnja - prvi.potrosnja);
  }
}