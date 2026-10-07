import * as express from "express";
import mongoose from "mongoose";
import {FacilityModel} from "../../models/facility";
import {UserModel} from "../../models/user";
import {TrenerModel} from "../../models/trener";
import {IndividualniTreningModel} from "../../models/trening";
import {OcenaModel} from "../../models/ocena";
export class ObjekatTreneriController {

  dohvatiZahteveZaObjekte = async(req: express.Request,res: express.Response) => {
    try {
      const objekti = await FacilityModel.find({
        status: "na_cekanju"
      }).sort({
        grad: 1,
        naziv: 1
      });

      const rezultat = [];

      for(const objekat of objekti) {
        const zaposleni = await UserModel.findOne({
          tip: "zaposleni",
          objekti: objekat._id
        });
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
          sportovi: objekat.sportovi || [],
          tipoviTerena: Array.from(new Set((objekat.tereni || []).map(teren => teren.tip))),
          svidjanja: svidjanja,
          nesvidjanja: nesvidjanja,
          kratakOpis: objekat.kratakOpis || "",
          naslovnaSlika: objekat.naslovnaSlika,
          radnoVremeOd: objekat.radnoVremeOd,
          radnoVremeDo: objekat.radnoVremeDo,
          dozvoljenaNePojavljivanja: objekat.dozvoljenaNePojavljivanja,
          status: objekat.status,
          galerija: objekat.galerija || [],
          tereni: (objekat.tereni || []).map(teren => ({
            naziv: teren.naziv,
            tip: teren.tip,
            sport: teren.sport,
            kapacitet: teren.kapacitet,
            cenaPoSatu: teren.cenaPoSatu,
            opisOpreme: teren.opisOpreme || ""
          })),
          zaposleni: zaposleni ? {
            username: zaposleni.username,
            ime: zaposleni.ime,
            prezime: zaposleni.prezime,
            imejl: zaposleni.imejl
          } : null
        });
      }

      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Zahteve za sportske objekte trenutno nije moguće učitati."
      });
    }
  };

  odobriObjekat = async(req: express.Request,res: express.Response) => {
    try {
      const objekatId = String(req.params.objekatId || "").trim();

      if(!mongoose.isValidObjectId(objekatId)) {
        res.status(400).json({
          message: "Identifikator objekta nije ispravan."
        });
        return;
      }

      const objekat = await FacilityModel.findOne({
        _id: new mongoose.Types.ObjectId(objekatId),
        status: "na_cekanju"
      });

      if(!objekat) {
        res.status(404).json({
          message: "Zahtev za sportski objekat nije pronađen."
        });
        return;
      }

      objekat.status = "aktivan";
      await objekat.save();

      res.json({
        message: "Sportski objekat je uspešno odobren."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Sportski objekat trenutno nije moguće odobriti."
      });
    }
  };

  odbijObjekat = async(req: express.Request,res: express.Response) => {
    try {
      const objekatId = String(req.params.objekatId || "").trim();

      if(!mongoose.isValidObjectId(objekatId)) {
        res.status(400).json({
          message: "Identifikator objekta nije ispravan."
        });
        return;
      }

      const objekatObjectId = new mongoose.Types.ObjectId(objekatId);

      const objekat = await FacilityModel.findOne({
        _id: objekatObjectId,
        status: "na_cekanju"
      });

      if(!objekat) {
        res.status(404).json({
          message: "Zahtev za sportski objekat nije pronađen."
        });
        return;
      }

      await UserModel.updateMany({
        tip: "zaposleni",
        objekti: objekatObjectId
      },{
        $pull: {
          objekti: objekatObjectId
        }
      });

      await FacilityModel.deleteOne({
        _id: objekatObjectId
      });

      res.json({
        message: "Zahtev za sportski objekat je odbijen i objekat je obrisan."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Sportski objekat trenutno nije moguće odbiti."
      });
    }
  };

  dohvatiTrenere = async(req: express.Request,res: express.Response) => {
    try {
      const treneri = await TrenerModel.find({
        aktivan: true
      }).sort({
        prezime: 1,
        ime: 1
      });

      const rezultat = [];

      for(const trener of treneri) {
        const objekat = await FacilityModel.findById(trener.objekatId);

        rezultat.push({
          id: String(trener._id),
          ime: trener.ime,
          prezime: trener.prezime,
          objekatId: String(trener.objekatId),
          nazivObjekta: objekat ? objekat.naziv : "Objekat nije pronađen",
          sport: trener.sport,
          specijalizacija: trener.specijalizacija,
          prosecnaOcena: trener.prosecnaOcena,
          cenaPoSatu: trener.cenaPoSatu
        });
      }

      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Trenere trenutno nije moguće učitati."
      });
    }
  };

  deaktivirajTrenera = async(req: express.Request,res: express.Response) => {
    try {
      const trenerId = String(req.params.trenerId || "").trim();

      if(!mongoose.isValidObjectId(trenerId)) {
        res.status(400).json({
          message: "Identifikator trenera nije ispravan."
        });
        return;
      }

      const trener = await TrenerModel.findOne({
        _id: new mongoose.Types.ObjectId(trenerId),
        aktivan: true
      });

      if(!trener) {
        res.status(404).json({
          message: "Aktivni trener nije pronađen."
        });
        return;
      }

      await IndividualniTreningModel.deleteMany({
        trenerId: trener._id,
        status: "zakazan"
      });

      trener.aktivan = false;
      await trener.save();

      res.json({
        message: "Trener je uspešno deaktiviran, a njegovi zakazani treninzi su obrisani."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Trenera trenutno nije moguće deaktivirati."
      });
    }
  };
}