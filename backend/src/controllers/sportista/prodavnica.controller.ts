import * as express from "express";
import mongoose from "mongoose";
import {OpremaModel} from "../../models/oprema";
import {PorudzbinaModel} from "../../models/porudzbina";
import {UserModel} from "../../models/user";

export class ProdavnicaController {

  dohvatiOpremu = async(req: express.Request,res: express.Response): Promise<void> => {
    try {
      const sport = String(req.query.sport || "").trim();
      let uslov = {};
      if(sport) {
        uslov = {$or: [{sport: sport},{sport: "Svi sportovi"}]};
      }
      const oprema = await OpremaModel.find(uslov).sort({sport: 1,naziv: 1});
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
        message: "Greška prilikom učitavanja opreme."
      });
    }
  };

  kreirajPorudzbinu = async(req: express.Request,res: express.Response): Promise<void> => {
    try {
      const username = String(req.body.username || "").trim();
      const stavke = req.body.stavke;
      if(!username || !Array.isArray(stavke) || stavke.length === 0) {
        res.status(400).json({message: "Korisničko ime i stavke porudžbine su obavezni."});
        return;
      }
      const korisnik = await UserModel.findOne({username: username,tip: "sportista"});
      if(!korisnik) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      const stavkeZaPorudzbinu = [];
      let ukupnaCena = 0;

      for(const stavka of stavke) {
        const opremaId = String(stavka.opremaId || "").trim();
        const kolicina = Number(stavka.kolicina);
        if(!mongoose.isValidObjectId(opremaId)) {
          res.status(400).json({message: "Neispravan identifikator proizvoda."});
          return;
        }
        if(!Number.isInteger(kolicina) || kolicina < 1) {
          res.status(400).json({message: "Količina proizvoda nije ispravna."});
          return;
        }
        const proizvod = await OpremaModel.findById(opremaId);
        if(!proizvod) {
          res.status(404).json({message: "Jedan od izabranih proizvoda više ne postoji."});
          return;
        }
        if(proizvod.stanje < kolicina) {
          res.status(409).json({message: `Proizvod ${proizvod.naziv} nema dovoljnu količinu na stanju.`});
          return;
        }
        stavkeZaPorudzbinu.push({
          opremaId: proizvod._id,
          naziv: proizvod.naziv,
          slika: proizvod.slika,
          sport: proizvod.sport,
          cena: proizvod.cena,
          kolicina: kolicina
        });
        ukupnaCena += proizvod.cena * kolicina;
      }
      for(const stavka of stavkeZaPorudzbinu) {
        await OpremaModel.updateOne({_id: stavka.opremaId},{$inc: {stanje: -stavka.kolicina}});
      }
      const porudzbina = await PorudzbinaModel.create({
        username: username,
        stavke: stavkeZaPorudzbinu,
        ukupnaCena: ukupnaCena,
        status: "naruceno"
      });
      res.status(201).json({message: "Porudžbina je uspešno kreirana.",id: String(porudzbina._id)});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom kreiranja porudžbine."});
    }
  };

  dohvatiPorudzbine = async(req: express.Request,res: express.Response): Promise<void> => {
    try {
      const username = String(req.params.username || "").trim();
      if(!username) {
        res.status(400).json({message: "Korisničko ime je obavezno."});
        return;
      }
      const porudzbine = await PorudzbinaModel.find({username: username});
      const statusi = ["naruceno","preuzeto","otkazano"];
      porudzbine.sort((prva,druga) => {
        const prioritetPrve = statusi.indexOf(prva.status);
        const prioritetDruge = statusi.indexOf(druga.status);
        if(prioritetPrve !== prioritetDruge) {
          return prioritetPrve - prioritetDruge;
        }
        return druga.datumPorudzbine.getTime() - prva.datumPorudzbine.getTime();
      });
      res.json(porudzbine.map(porudzbina => ({
        id: String(porudzbina._id),
        username: porudzbina.username,
        stavke: porudzbina.stavke.map((stavka: any) => ({
          opremaId: String(stavka.opremaId),
          naziv: stavka.naziv,
          slika: stavka.slika,
          sport: stavka.sport,
          cena: stavka.cena,
          kolicina: stavka.kolicina
        })),
        ukupnaCena: porudzbina.ukupnaCena,
        datumPorudzbine: porudzbina.datumPorudzbine,
        status: porudzbina.status
      })));
    } catch(error) {
      res.status(500).json({message: "Porudžbine nije moguće učitati."});
    }
  };

  otkaziPorudzbinu = async(req: express.Request,res: express.Response): Promise<void> => { 
    try {
      const porudzbinaId = req.params.porudzbinaId;
      const username = String(req.body.username || "").trim();
      if(!mongoose.isValidObjectId(porudzbinaId)) {
        res.status(400).json({message: "Neispravan identifikator porudžbine."});
        return;
      }
      const porudzbina = await PorudzbinaModel.findOne({_id: porudzbinaId,username: username});
      if(!porudzbina) {
        res.status(404).json({message: "Porudžbina nije pronađena."});
        return;
      }
      if(porudzbina.status !== "naruceno") {
        res.status(400).json({message: "Moguće je otkazati samo aktivnu porudžbinu."});
        return;
      }
      porudzbina.status = "otkazano";
      for(const stavka of porudzbina.stavke) {
        await OpremaModel.updateOne({_id: stavka.opremaId},{$inc: {stanje: stavka.kolicina}});
      }
      await porudzbina.save();
      res.json({message: "Porudžbina je uspešno otkazana."});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom otkazivanja porudžbine."});
    }
  };
}