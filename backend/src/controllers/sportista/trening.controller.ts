import * as express from "express";
import mongoose from "mongoose";
import {FacilityModel} from "../../models/facility";
import {IndividualniTreningModel} from "../../models/trening";
import {RezervacijaModel} from "../../models/rezervacije";
import {TrenerModel} from "../../models/trener";
import {UserModel} from "../../models/user";
import {PromotionModel} from "../../models/promotion";
import {OcenaModel} from "../../models/ocena";

export class TreningController {

  dohvatiObjekte = async(req: express.Request,res: express.Response) => {
    try {
      const objekti = await FacilityModel.find({status: "aktivan"}).sort({naziv: 1});
      const rezultat = [];
      for(const objekat of objekti) {
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
          tipoviTerena: objekat.tereni.map(teren => teren.tip),
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
      res.status(500).json({message: "Greška prilikom učitavanja sportskih objekata."});
    }
  };

  proveriPravoZakazivanja = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.query.username || "").trim();
      const objekatId = String(req.query.objekatId || "").trim();
      if(!username || !objekatId) {
        res.status(400).json({message: "Korisničko ime i objekat su obavezni."});
        return;
      }
      if(!mongoose.isValidObjectId(objekatId)) {
        res.status(400).json({message: "Identifikator objekta nije ispravan."});
        return;
      }
      const korisnik = await UserModel.findOne({username: username,tip: "sportista"});
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const objekat = await FacilityModel.findOne({_id: objekatId,status: "aktivan"});
      if(!objekat) {
        res.status(404).json({message: "Sportski objekat nije pronađen."});
          return;
        }
      const dostignutLimit = await this.dostignutLimitNeodrzanih(String(korisnik._id),objekatId,objekat.dozvoljenaNePojavljivanja);
      if(dostignutLimit) {
        res.status(403).json({message: "Nemate pravo da zakažete trening u ovom objektu zbog prevelikog broja neodržanih rezervacija i treninga."});
        return;
      }
      res.json({message: "Korisnik ima pravo zakazivanja treninga."});
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Nije moguće proveriti pravo zakazivanja."
      });
    }
  };

  dohvatiTrenere = async(req: express.Request,res: express.Response) => {
    try {
      const objekatId = String(req.params.objekatId || "").trim();
      const sport = String(req.query.sport || "").trim();
      if(!objekatId || !sport) {
        res.status(400).json({message: "Objekat i sport su obavezni."});
        return;
      }
      if(!mongoose.isValidObjectId(objekatId)) {
        res.status(400).json({message: "Identifikator objekta nije ispravan."});
        return;
      }
      const objekat = await FacilityModel.findOne({_id: objekatId,status: "aktivan"});
      if(!objekat) {
        res.status(404).json({message: "Sportski objekat nije pronađen."});
        return;
      }
      if(!objekat.sportovi.includes(sport)) {
        res.status(400).json({message: "Izabrani sport nije dostupan u ovom objektu."});
        return;
      }
      const treneri = await TrenerModel.find({objekatId: objekatId,sport: sport,aktivan: true}).sort({prosecnaOcena: -1,prezime: 1});
      res.json(treneri.map(trener => ({
        id: String(trener._id),
        ime: trener.ime,
        prezime: trener.prezime,
        objekatId: trener.objekatId,
        sport: trener.sport,
        specijalizacija: trener.specijalizacija,
        prosecnaOcena: trener.prosecnaOcena,
        cenaPoSatu: trener.cenaPoSatu
      })));
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom učitavanja trenera."});
    }
  };

  zakaziTrening = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.body.username || "").trim();
      const trenerId = String(req.body.trenerId || "").trim();
      const objekatId = String(req.body.objekatId || "").trim();
      const teren = String(req.body.teren || "").trim();
      const datum = String(req.body.datum || "").trim();
      const vreme = String(req.body.vreme || "").trim();
      const promocijaId = String(req.body.promocijaId || "").trim();
      if(!username || !trenerId || !objekatId || !teren || !datum || !vreme) {
        res.status(400).json({message: "Sva polja su obavezna."});
        return;
      }
      if(!mongoose.isValidObjectId(trenerId) || !mongoose.isValidObjectId(objekatId)) {
        res.status(400).json({message: "Identifikator trenera ili objekta nije ispravan."});
        return;
      }
      const korisnik = await UserModel.findOne({username: username,tip: "sportista"});
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const objekat = await FacilityModel.findOne({_id: objekatId, status: "aktivan"});
      if(!objekat) {
        res.status(404).json({message: "Sportski objekat nije pronađen."});
        return;
      }
      const dostignutLimit = await this.dostignutLimitNeodrzanih(String(korisnik._id),objekatId,objekat.dozvoljenaNePojavljivanja);
      if(dostignutLimit) {
        res.status(403).json({message: "Nemate pravo da zakažete trening u ovom objektu zbog prevelikog broja neodržanih rezervacija i treninga."});
        return;
      }
      const izabraniTeren = objekat.tereni.find(terenObjekta => terenObjekta.naziv === teren);
      if(!izabraniTeren) {
        res.status(404).json({message: "Izabrani teren nije pronađen u objektu."});
        return;
      }
      const trener = await TrenerModel.findOne({
        _id: trenerId,
        objekatId: objekatId,
        sport: izabraniTeren.sport,
        aktivan: true
      });
      if(!trener) {
        res.status(404).json({message: "Trener nije pronađen ili ne odgovara sportu izabranog terena."});
        return;
      }
      const pocetak = new Date(`${datum}T${vreme}:00`);
      if(Number.isNaN(pocetak.getTime())) {
        res.status(400).json({message: "Datum ili vreme nisu ispravni."});
        return;
      }
      if(pocetak <= new Date()) {
        res.status(400).json({message: "Nije moguće zakazati trening u prošlosti."});
        return;
      }
      const kraj = new Date(pocetak.getTime() + 60 * 60 * 1000);
      const pocetakRadnogVremena = new Date(`${datum}T${objekat.radnoVremeOd}:00`);
      const krajRadnogVremena = new Date(`${datum}T${objekat.radnoVremeDo}:00`);
      if(objekat.radnoVremeDo === "00:00") {krajRadnogVremena.setDate(krajRadnogVremena.getDate() + 1);}

      if(pocetak < pocetakRadnogVremena || kraj > krajRadnogVremena) {
        res.status(400).json({message: `Termin mora biti u okviru radnog vremena ${objekat.radnoVremeOd}–${objekat.radnoVremeDo}.`});
        return;
      }
      const zauzetTrener = await IndividualniTreningModel.findOne({
        trenerId: trener._id,
        status: "zakazan",
        pocetak: {$lt: kraj},
        kraj: {$gt: pocetak}
      });
      if(zauzetTrener) {
        res.status(409).json({message: "Trener je zauzet u izabranom terminu."});
        return;
      }
      const zauzetSportista = await IndividualniTreningModel.findOne({
        korisnikId: korisnik._id,
        status: "zakazan",
        pocetak: {$lt: kraj},
        kraj: {$gt: pocetak}
      });
      if(zauzetSportista) {
        res.status(409).json({message: "Već imate zakazan trening u ovom terminu."});
        return;
      }
      const zauzetTreningNaTerenu = await IndividualniTreningModel.findOne({
        objekatId: objekatId,
        teren: teren,
        status: "zakazan",
        pocetak: {$lt: kraj},
        kraj: {$gt: pocetak}
      });
      if(zauzetTreningNaTerenu) {
        res.status(409).json({message: "Izabrani teren već ima zakazan trening u ovom terminu."});
        return;
      }
      const zauzetaRezervacija = await RezervacijaModel.findOne({
        objekatId: objekatId,
        teren: teren,
        status: "zakazan",
        pocetak: {$lt: kraj},
        kraj: {$gt: pocetak}
      });
      if(zauzetaRezervacija) {
        res.status(409).json({message: "Izabrani teren je rezervisan u ovom terminu."});
        return;
      }
      let cena = trener.cenaPoSatu;
      if(promocijaId) {
        const promocija = await PromotionModel.findOne({
          _id: promocijaId,
          objekatId: objekatId,
          sport: {$in: [trener.sport,null]},
          aktivna: true,
          datumPocetka: {$lte: datum},
          datumKraja: {$gte: datum}
        });
        if(!promocija) {
          res.status(400).json({message: "Izabrana promocija nije dostupna za ovaj trening."});
          return;
        }
        if(promocija.tipPopusta === "procenat") {
          cena = cena - cena * promocija.vrednostPopusta / 100;
        }
        else if(promocija.tipPopusta === "fiksni") {cena = cena - promocija.vrednostPopusta;}
        cena = Math.max(0,cena);
      }
      cena = Math.round(cena);
      await IndividualniTreningModel.create({
        korisnikId: korisnik._id,
        username: korisnik.username,
        trenerId: trener._id,
        imeTrenera: trener.ime,
        prezimeTrenera: trener.prezime,
        objekatId: objekatId,
        nazivObjekta: objekat.naziv,
        sport: trener.sport,
        teren: teren,
        pocetak: pocetak,
        kraj: kraj,
        cena: cena,
        status: "zakazan"
      });
      res.status(201).json({
        message: `Individualni trening je uspešno zakazan. Cena treninga je ${cena} RSD.`,
        cena: cena
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom zakazivanja treninga."});
    }
  };

  dohvatiTreninge = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      if(!username) {
        res.status(400).json({message: "Korisničko ime je obavezno."});
        return;
      }
      const treninzi = await IndividualniTreningModel.find({username: username}).sort({pocetak: -1});
      res.json(treninzi.map(trening => ({
        id: String(trening._id),
        trenerId: String(trening.trenerId),
        imeTrenera: trening.imeTrenera,
        prezimeTrenera: trening.prezimeTrenera,
        objekatId: trening.objekatId,
        nazivObjekta: trening.nazivObjekta,
        sport: trening.sport,
        teren: trening.teren,
        pocetak: trening.pocetak,
        kraj: trening.kraj,
        cena: trening.cena,
        status: trening.status
      })));
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom učitavanja treninga."});
    }
  };

  otkaziTrening = async(req: express.Request,res: express.Response) => {
    try {
      const treningId = String(req.params.treningId || "").trim();
      const username = String(req.body.username || "").trim();
      if(!mongoose.isValidObjectId(treningId)) {
        res.status(400).json({message: "Neispravan identifikator treninga."});
        return;
      }
      const trening = await IndividualniTreningModel.findOne({
        _id: treningId,
        username: username
      });
      if(!trening) {
        res.status(404).json({message: "Trening nije pronađen."});
        return;
      }
      if(trening.status !== "zakazan") {
        res.status(400).json({message: "Ovaj trening nije moguće otkazati."});
        return;
      }
      const vremeDoPocetka = trening.pocetak.getTime() - Date.now();
      if(vremeDoPocetka < 24 * 60 * 60 * 1000) {
        res.status(400).json({message: "Trening je moguće otkazati najmanje 12 sati ranije."});
        return;
      }
      trening.status = "otkazan";
      await trening.save();
      res.json({message: "Trening je uspešno otkazan."});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom otkazivanja treninga."});
    }
  };

  dohvatiZauzeteTermine = async(req: express.Request,res: express.Response) => {
    try {
      const trenerId = String(req.params.trenerId || "").trim();
      const objekatId = String(req.query.objekatId || "").trim();
      const teren = String(req.query.teren || "").trim();
      const datum = String(req.query.datum || "").trim();

      if(!mongoose.isValidObjectId(trenerId) || !mongoose.isValidObjectId(objekatId)) {
        res.status(400).json({message: "Identifikator trenera ili objekta nije ispravan."});
        return;
      }

      if(!teren || !datum) {
        res.status(400).json({message: "Objekat, teren i datum su obavezni."});
        return;
      }

      const objekat = await FacilityModel.findOne({
        _id: objekatId,
        status: "aktivan",
        "tereni.naziv": teren
      });

      if(!objekat) {
        res.status(404).json({message: "Sportski objekat ili teren nije pronađen."});
        return;
      }

      const pocetakDana = new Date(`${datum}T00:00:00`);

      if(Number.isNaN(pocetakDana.getTime())) {
        res.status(400).json({message: "Datum nije ispravan."});
        return;
      }

      const krajDana = new Date(pocetakDana);
      krajDana.setDate(krajDana.getDate() + 1);

      const [treninzi,rezervacije] = await Promise.all([
        IndividualniTreningModel.find({
          status: "zakazan",
          pocetak: {$lt: krajDana},
          kraj: {$gt: pocetakDana},
          $or: [
            {trenerId: trenerId},
            {objekatId: objekatId,teren: teren}
          ]
        }),
        RezervacijaModel.find({
          objekatId: objekatId,
          teren: teren,
          status: "zakazan",
          pocetak: {$lt: krajDana},
          kraj: {$gt: pocetakDana}
        })
      ]);

      const zauzetiTermini: string[] = [];

      for(const trening of treninzi) {
        const termin = this.formatirajVreme(trening.pocetak);
        if(!zauzetiTermini.includes(termin)) {
          zauzetiTermini.push(termin);
        }
      }

      for(const rezervacija of rezervacije) {
        const termin = this.formatirajVreme(rezervacija.pocetak);
        if(!zauzetiTermini.includes(termin)) {
          zauzetiTermini.push(termin);
        }
      }

      zauzetiTermini.sort();

      res.json(zauzetiTermini);
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom učitavanja zauzetih termina."});
    }
  };
  
  private dostignutLimitNeodrzanih = async(korisnikId: string,objekatId: string,dozvoljenaNePojavljivanja: number): Promise<boolean> => {
    const [brojNeodrzanihTreninga,brojNeodrzanihRezervacija] = await Promise.all([
      IndividualniTreningModel.countDocuments({
        korisnikId: korisnikId,
        objekatId: objekatId,
        status: "neodrzan"
      }),
      RezervacijaModel.countDocuments({
        korisnikId: korisnikId,
        objekatId: objekatId,
        status: "neodrzan"
      })
    ]);
    return (brojNeodrzanihTreninga + brojNeodrzanihRezervacija) >= dozvoljenaNePojavljivanja;
  };
  private formatirajVreme(datum: Date): string {
    const sati = String(datum.getHours()).padStart(2,"0");
    const minuti = String(datum.getMinutes()).padStart(2,"0");
    return `${sati}:${minuti}`;
  }
}