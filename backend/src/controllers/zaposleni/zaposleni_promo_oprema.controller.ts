import * as express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import {UserModel} from "../../models/user";
import {FacilityModel} from "../../models/facility";
import {PromotionModel} from "../../models/promotion";
import {OpremaModel} from "../../models/oprema";
import {PorudzbinaModel} from "../../models/porudzbina";
import {OcenaModel} from "../../models/ocena";
export class ZaposleniPromoOpremaController {

  dohvatiPromocije = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const objekatIds = zaposleni.objekti || [];
      const objekti = await FacilityModel.find({
        _id: {$in: objekatIds}
      });
      const promocije = await PromotionModel.find({objekatId: {$in: objekatIds}}).sort({datumPocetka: -1});

      const rezultat = promocije.map(promocija => {
        const objekat = objekti.find(objekat => String(objekat._id) === String(promocija.objekatId));
        return {
          id: String(promocija._id),
          naziv: promocija.naziv,
          objekatId:  String(promocija.objekatId),
          nazivObjekta: objekat ? objekat.naziv : "",
          gradObjekta: objekat ? objekat.grad : "",
          datumPocetka: promocija.datumPocetka,
          datumKraja: promocija.datumKraja,
          tipPopusta: promocija.tipPopusta,
          vrednostPopusta: promocija.vrednostPopusta,
          sport: promocija.sport
        };
      });
      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Promocije trenutno nije moguće učitati."
      });
    }
  };
  
  kreirajPromociju = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const naziv = String(req.body.naziv || "").trim();
      const objekatId = String(req.body.objekatId || "").trim();
      const datumPocetka = String(req.body.datumPocetka || "").trim();
      const datumKraja = String(req.body.datumKraja || "").trim();
      const tipPopusta = String(req.body.tipPopusta || "").trim();
      const vrednostPopusta = Number(req.body.vrednostPopusta);
      const sport = req.body.sport ? String(req.body.sport).trim() : null;
      if(!naziv || !objekatId || !datumPocetka || !datumKraja || !tipPopusta || Number.isNaN(vrednostPopusta)) {res.status(400).json({message: "Podaci promocije nisu ispravni."});return;}
      if(tipPopusta !== "procenat" && tipPopusta !== "fiksni") {res.status(400).json({message: "Tip popusta nije ispravan."});return;}
      if(datumPocetka > datumKraja) {res.status(400).json({message: "Datum početka ne može biti posle datuma završetka."});return;}
      if(vrednostPopusta <= 0) {res.status(400).json({message: "Vrednost popusta mora biti veća od nule."});return;}
      if(tipPopusta === "procenat" && vrednostPopusta > 100) {res.status(400).json({message: "Procentualni popust ne može biti veći od 100%."});return;}
      if(!mongoose.isValidObjectId(objekatId)) {res.status(400).json({message: "Identifikator objekta nije ispravan."});return;}
      const objekatObjectId = new mongoose.Types.ObjectId(objekatId);
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni",
        objekti: objekatObjectId
      });
      if(!zaposleni) {res.status(403).json({message: "Nemate pravo upravljanja izabranim objektom."});return;}
      const objekat = await FacilityModel.findOne({
        _id: objekatObjectId,
        status: "aktivan"
      });
      if(!objekat) {res.status(404).json({message: "Sportski objekat nije pronađen."});return;}
      if(sport && !objekat.sportovi.includes(sport)) {res.status(400).json({message: "Izabrani sport nije dostupan u ovom objektu."});return;}
      const promocija = await PromotionModel.create({
        _id: crypto.randomUUID(),
        naziv: naziv,
        objekatId: objekatObjectId,
        datumPocetka: datumPocetka,
        datumKraja: datumKraja,
        tipPopusta: tipPopusta,
        vrednostPopusta: vrednostPopusta,
        sport: sport,
        aktivna: true
      });
      res.status(201).json({
        message: "Promocija je uspešno kreirana.",
        promocija: {
          id: String(promocija._id),
          naziv: promocija.naziv,
          objekatId: String(promocija.objekatId),
          nazivObjekta: objekat.naziv,
          gradObjekta: objekat.grad,
          datumPocetka: promocija.datumPocetka,
          datumKraja: promocija.datumKraja,
          tipPopusta: promocija.tipPopusta,
          vrednostPopusta: promocija.vrednostPopusta,
          sport: promocija.sport
        }
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Promociju trenutno nije moguće kreirati."
      });
    }
  };
  obrisiIsteklePromocije = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const danas = new Date();
      const godina = danas.getFullYear();
      const mesec = String(danas.getMonth() + 1).padStart(2,"0");
      const dan = String(danas.getDate()).padStart(2,"0");
      const danasnjiDatum = `${godina}-${mesec}-${dan}`;
      const rezultat = await PromotionModel.deleteMany({
        objekatId: {
          $in: zaposleni.objekti || []
        },
        datumKraja: {
          $lt: danasnjiDatum
        }
      });
      res.json({
        message: rezultat.deletedCount === 0 ? "Nema isteklih promocija za brisanje." : `Uspešno je obrisano ${rezultat.deletedCount} isteklih promocija.`,
        obrisano: rezultat.deletedCount
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Istekle promocije trenutno nije moguće obrisati."
      });
    }
  };
  azurirajPromociju = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const promocijaId = String(req.params.promocijaId || "").trim();
      const naziv = String(req.body.naziv || "").trim();
      const objekatId = String(req.body.objekatId || "").trim();
      const datumPocetka = String(req.body.datumPocetka || "").trim();
      const datumKraja = String(req.body.datumKraja || "").trim();
      const tipPopusta = String(req.body.tipPopusta || "").trim();
      const vrednostPopusta = Number(req.body.vrednostPopusta);
      const sport = req.body.sport ? String(req.body.sport).trim() : null;
      if(!promocijaId || !naziv || !objekatId || !datumPocetka || !datumKraja || Number.isNaN(vrednostPopusta)) {res.status(400).json({message: "Podaci promocije nisu ispravni."});return;}
      if(tipPopusta !== "procenat" && tipPopusta !== "fiksni") {res.status(400).json({message: "Tip popusta nije ispravan."});return;}
      if(datumPocetka > datumKraja) {res.status(400).json({message: "Datum početka ne može biti posle datuma završetka."});return;}
      if(vrednostPopusta <= 0) {res.status(400).json({message: "Vrednost popusta mora biti veća od nule."});return;}
      if(tipPopusta === "procenat" && vrednostPopusta > 100) {res.status(400).json({message: "Procentualni popust ne može biti veći od 100%."});return;}
      if(!mongoose.isValidObjectId(objekatId)) {res.status(400).json({message: "Identifikator objekta nije ispravan."});return;}
      const objekatObjectId = new mongoose.Types.ObjectId(objekatId);
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni",
        objekti: objekatObjectId
      });
      if(!zaposleni) {res.status(403).json({message: "Nemate pravo upravljanja izabranim objektom."});return;}
      const objekat = await FacilityModel.findOne({
        _id: objekatObjectId,
        status: "aktivan"
      });
      if(!objekat) {res.status(404).json({message: "Sportski objekat nije pronađen."});return;}
      if(sport && !objekat.sportovi.includes(sport)) {res.status(400).json({message: "Izabrani sport nije dostupan u ovom objektu."});return;}
      const postojecaPromocija = await PromotionModel.findOne({
        _id: promocijaId
      });
      if(!postojecaPromocija) {res.status(404).json({message: "Promocija nije pronađena."});return;}
      const upravljaStarimObjektom = await UserModel.exists({
        username: username,
        tip: "zaposleni",
        objekti: postojecaPromocija.objekatId
      });
      if(!upravljaStarimObjektom) {res.status(403).json({message: "Nemate pravo izmene ove promocije."});return;}
      postojecaPromocija.naziv = naziv;
      postojecaPromocija.objekatId = objekatObjectId;
      postojecaPromocija.datumPocetka = datumPocetka;
      postojecaPromocija.datumKraja = datumKraja;
      postojecaPromocija.tipPopusta = tipPopusta;
      postojecaPromocija.vrednostPopusta = vrednostPopusta;
      postojecaPromocija.sport = sport;
      postojecaPromocija.aktivna = true;
      await postojecaPromocija.save();
      res.json({
        message: "Promocija je uspešno ažurirana.",
        promocija: {
          id: String(postojecaPromocija._id),
          naziv: postojecaPromocija.naziv,
          objekatId: String(postojecaPromocija.objekatId),
          nazivObjekta: objekat.naziv,
          gradObjekta: objekat.grad,
          datumPocetka: postojecaPromocija.datumPocetka,
          datumKraja: postojecaPromocija.datumKraja,
          tipPopusta: postojecaPromocija.tipPopusta,
          vrednostPopusta: postojecaPromocija.vrednostPopusta,
          sport: postojecaPromocija.sport
        }
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Promociju trenutno nije moguće ažurirati."
      });
    }
  };
  dohvatiAktivneObjekteZaposlenog = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {res.status(404).json({message: "Zaposleni nije pronađen."});return;}
      const objekti = await FacilityModel.find({
        _id: {$in: zaposleni.objekti || []},
        status: "aktivan"
      });
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
        rezultat.push(this.mapirajObjekat(objekat,svidjanja,nesvidjanja));
      }
      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Aktivne objekte nije moguće učitati."
      });
    }
  };
  dohvatiOpremu = async(req: express.Request,res: express.Response) => {
    try {
      const oprema = await OpremaModel.find().sort({
        sport: 1,
        naziv: 1
      });
      res.json(oprema.map(proizvod => ({
        id: String(proizvod._id),
        naziv: proizvod.naziv,
        sport: proizvod.sport,
        slika: proizvod.slika,
        cena: proizvod.cena,
        stanje: proizvod.stanje
      })));
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Opremu trenutno nije moguće učitati."
      });
    }
  };
  dodajOpremu = async(req: express.Request,res: express.Response) => {
    try {
      const naziv = String(req.body.naziv || "").trim();
      const sport = String(req.body.sport || "").trim();
      const cena = Number(req.body.cena);
      const stanje = Number(req.body.stanje);
      const slika = req.file ? req.file.filename : "logo.png";
      if(!naziv || !sport || Number.isNaN(cena) || Number.isNaN(stanje)) {res.status(400).json({message: "Podaci opreme nisu ispravni."});return;}
      if(cena <= 0) {res.status(400).json({message: "Cena mora biti veća od nule."});return;}
      if(stanje < 0 || !Number.isInteger(stanje)) {res.status(400).json({message: "Stanje mora biti ceo broj veći ili jednak nuli."});return;}
      const postojecaOprema = await OpremaModel.findOne({
        naziv: {
          $regex: `^${this.escapeRegex(naziv)}$`,
          $options: "i"
        },
        sport: sport
      });
      if(postojecaOprema) {res.status(409).json({message: "Oprema sa ovim nazivom već postoji za izabrani sport."});return;}
      const oprema = await OpremaModel.create({
        naziv: naziv,
        sport: sport,
        slika: slika,
        cena: cena,
        stanje: stanje
      });
      res.status(201).json({
        message: "Oprema je uspešno dodata.",
        oprema: {
          id: String(oprema._id),
          naziv: oprema.naziv,
          sport: oprema.sport,
          slika: oprema.slika,
          cena: oprema.cena,
          stanje: oprema.stanje
        }
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Opremu trenutno nije moguće dodati."
      });
    }
  };
  azurirajOpremu = async(req: express.Request,res: express.Response) => {
    try {
      const opremaId = String(req.params.opremaId || "").trim();
      const naziv = String(req.body.naziv || "").trim();
      const sport = String(req.body.sport || "").trim();
      const cena = Number(req.body.cena);
      const stanje = Number(req.body.stanje);
      if(!mongoose.isValidObjectId(opremaId)) {res.status(400).json({message: "Identifikator opreme nije ispravan."});return;}
      if(!naziv || !sport || Number.isNaN(cena) || Number.isNaN(stanje)) {res.status(400).json({message: "Podaci opreme nisu ispravni."});return;}
      if(cena <= 0) {res.status(400).json({message: "Cena mora biti veća od nule."});return;}
      if(stanje < 0 || !Number.isInteger(stanje)) {res.status(400).json({message: "Stanje mora biti ceo broj veći ili jednak nuli."});return;}
      const duplikat = await OpremaModel.findOne({
        _id: {$ne: opremaId},
        naziv: {
          $regex: `^${this.escapeRegex(naziv)}$`,
          $options: "i"
        },
        sport: sport
      });
      if(duplikat) {res.status(409).json({message: "Oprema sa ovim nazivom već postoji za izabrani sport."});return;}
      const oprema = await OpremaModel.findById(opremaId);
      if(!oprema) {res.status(404).json({message: "Oprema nije pronađena."});return;}
      oprema.naziv = naziv;
      oprema.sport = sport;
      oprema.cena = cena;
      oprema.stanje = stanje;
      if(req.file) {oprema.slika = req.file.filename;}
      await oprema.save();
      res.json({
        message: "Oprema je uspešno ažurirana.",
        oprema: {
          id: String(oprema._id),
          naziv: oprema.naziv,
          sport: oprema.sport,
          slika: oprema.slika,
          cena: oprema.cena,
          stanje: oprema.stanje
        }
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Opremu trenutno nije moguće ažurirati."
      });
    }
  };
  dohvatiPorudzbine = async(req: express.Request,res: express.Response) => {
    try {
      const porudzbine = await PorudzbinaModel.find().sort({
        datumPorudzbine: -1
      });
      res.json(porudzbine.map(porudzbina => ({
        id: String(porudzbina._id),
        username: porudzbina.username,
        stavke: porudzbina.stavke.map(stavka => ({
          opremaId: String(stavka.opremaId),
          naziv: stavka.naziv,
          sport: stavka.sport,
          slika: stavka.slika,
          cena: stavka.cena,
          kolicina: stavka.kolicina
        })),
        ukupnaCena: porudzbina.ukupnaCena,
        datumPorudzbine: porudzbina.datumPorudzbine,
        status: porudzbina.status
      })));
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Porudžbine trenutno nije moguće učitati."
      });
    }
  };
  oznaciPorudzbinuKaoPreuzetu = async(req: express.Request,res: express.Response) => {
    try {
      const porudzbinaId = String(req.params.porudzbinaId || "").trim();
      if(!mongoose.isValidObjectId(porudzbinaId)) {res.status(400).json({message: "Identifikator porudžbine nije ispravan."});return;}
      const porudzbina = await PorudzbinaModel.findById(porudzbinaId);
      if(!porudzbina) {res.status(404).json({message: "Porudžbina nije pronađena."});return;}
      if(porudzbina.status !== "naruceno") {res.status(400).json({message: "Samo prihvaćena porudžbina može biti označena kao preuzeta."});return;}
      porudzbina.status = "preuzeto";
      await porudzbina.save();
      res.json({
        message: "Porudžbina je označena kao preuzeta.",
        status: "preuzeto"
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Status porudžbine trenutno nije moguće promeniti."
      });
    }
  };
  obrisiOtkazanePorudzbine = async(req: express.Request,res: express.Response) => {
    try {
      const rezultat = await PorudzbinaModel.deleteMany({
        status: "otkazano"
      });
      res.json({
        message: rezultat.deletedCount === 0 ? "Nema otkazanih porudžbina za brisanje." : `Uspešno je obrisano ${rezultat.deletedCount} otkazanih porudžbina.`,
        obrisano: rezultat.deletedCount
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Otkazane porudžbine trenutno nije moguće obrisati."
      });
    }
  };
  otkaziPorudzbinu = async(req: express.Request,res: express.Response) => {
  try {
    const porudzbinaId = String(req.params.porudzbinaId || "").trim();
    if(!mongoose.isValidObjectId(porudzbinaId)) {res.status(400).json({message: "Identifikator porudžbine nije ispravan."});return;}
    const porudzbina = await PorudzbinaModel.findById(porudzbinaId);
    if(!porudzbina) {res.status(404).json({message: "Porudžbina nije pronađena."});return;}
    if(porudzbina.status !== "naruceno") {res.status(400).json({message: "Samo prihvaćena porudžbina može biti otkazana."});return;}
    porudzbina.status = "otkazano";
    await porudzbina.save();
    res.json({
      message: "Porudžbina je uspešno otkazana.",
      status: "otkazano"
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({
      message: "Porudžbinu trenutno nije moguće otkazati."
    });
  }
  };
  private mapirajObjekat(objekat: any,svidjanja: number,nesvidjanja: number) {
    const tipoviTerena: ("otvoreni" | "zatvoreni")[] = [];
    for(const teren of objekat.tereni || []) {
      if(!tipoviTerena.includes(teren.tip)) {tipoviTerena.push(teren.tip);}
    }
    return {
      id: String(objekat._id),
      naziv: objekat.naziv,
      grad: objekat.grad,
      adresa: objekat.adresa,
      sportovi: objekat.sportovi || [],
      tipoviTerena: tipoviTerena,
      svidjanja: svidjanja,
      nesvidjanja: nesvidjanja,
      kratakOpis: objekat.kratakOpis || "",
      naslovnaSlika: objekat.naslovnaSlika || "/facilities/default-facility.jpg",
      radnoVremeOd: objekat.radnoVremeOd,
      radnoVremeDo: objekat.radnoVremeDo,
      dozvoljenaNePojavljivanja: objekat.dozvoljenaNePojavljivanja,
      status: objekat.status,
      galerija: objekat.galerija || [],
      tereni: (objekat.tereni || []).map((teren: any) => ({naziv: teren.naziv,tip: teren.tip,sport: teren.sport,kapacitet: teren.kapacitet,cenaPoSatu: teren.cenaPoSatu,opisOpreme: teren.opisOpreme || ""}))
    };
  }
  private escapeRegex(vrednost: string): string {
    return vrednost.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  }
}