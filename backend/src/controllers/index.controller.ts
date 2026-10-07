import * as express from "express";
import {FacilityModel} from "../models/facility";
import {PromotionModel} from "../models/promotion";
import {OcenaModel} from "../models/ocena";
export class IndexController {

 getHomeData = async(req: express.Request,res: express.Response) => {
    try {
      const trenutnoVreme = new Date();
      const aktivniObjekti = await FacilityModel.find({status: "aktivan"});
      const svePromocije = await PromotionModel.find({aktivna: true}).sort({datumPocetka: -1});
      const objektiSaOcenama = [];
      for(const objekat of aktivniObjekti) {
        const svidjanja = await OcenaModel.countDocuments({
          objekatId: objekat._id,
          reakcija: "svidjanje"
        });
        const nesvidjanja = await OcenaModel.countDocuments({
          objekatId: objekat._id,
          reakcija: "nesvidjanje"
        });
        objektiSaOcenama.push({
          objekat: objekat,
          svidjanja: svidjanja,
          nesvidjanja: nesvidjanja
        });
      }
      const najboljiObjekti = [...objektiSaOcenama].sort((prvi,drugi) => {
        if(drugi.svidjanja !== prvi.svidjanja) {
          return drugi.svidjanja - prvi.svidjanja;
        }
        return prvi.objekat.naziv.localeCompare(drugi.objekat.naziv,"sr");
      }).slice(0,3);
      const gradovi: string[] = [];
      for(const objekat of aktivniObjekti) {
        if(!gradovi.includes(objekat.grad)) {
          gradovi.push(objekat.grad);
        }
      }
      const sportovi: string[] = [];
      for(const objekat of aktivniObjekti) {
        for(const sport of objekat.sportovi) {
          if(!sportovi.includes(sport)) {
            sportovi.push(sport);
          }
        }
      }
      const promocije = [];
      for(const promocija of svePromocije) {
        const pocetakPromocije = new Date(promocija.datumPocetka);
        const krajPromocije = new Date(promocija.datumKraja);
        const trenutnoVazi = pocetakPromocije <= trenutnoVreme && krajPromocije >= trenutnoVreme;
        if(!trenutnoVazi) {continue;}
        const objekat = aktivniObjekti.find(aktivniObjekat => String(aktivniObjekat._id) === String(promocija.objekatId));
        if(!objekat) {continue;}
        promocije.push({
          id: String(promocija._id),
          naziv: promocija.naziv,
          objekatId: String(objekat._id),
          nazivObjekta: objekat.naziv,
          gradObjekta: objekat.grad,
          datumPocetka: promocija.datumPocetka,
          datumKraja: promocija.datumKraja,
          tipPopusta: promocija.tipPopusta,
          vrednostPopusta: promocija.vrednostPopusta,
          sport: promocija.sport
        });
        if(promocije.length === 3) {break;}
      }
      res.json({
        brojAktivnihObjekata: aktivniObjekti.length,
        najboljiObjekti: najboljiObjekti.map(podatak => this.napraviObjekat(podatak.objekat.toObject(),podatak.svidjanja,podatak.nesvidjanja)),
        promocije: promocije,
        gradovi: gradovi,
        sportovi: sportovi
      });
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  getObjects = async(req: express.Request,res: express.Response) => {
    try {
      const objekti = await FacilityModel.find({status: "aktivan"});
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
        rezultat.push(this.napraviObjekat(objekat.toObject(),svidjanja,nesvidjanja));
      }
      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  getObjDetails = async(req: express.Request,res: express.Response) => {
    try {
      const id = req.params.id;
      const objekat = await FacilityModel.findOne({_id: id,status: "aktivan"});
      if(!objekat) {
        res.sendStatus(404);
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
      res.json(this.napraviObjekat(objekat.toObject(),svidjanja,nesvidjanja));
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  private napraviObjekat = (objekat: any,svidjanja: number,nesvidjanja: number) => {
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
      tereni: (objekat.tereni || []).map((teren: any) => ({
        naziv: teren.naziv,
        tip: teren.tip,
        sport: teren.sport,
        kapacitet: teren.kapacitet,
        cenaPoSatu: teren.cenaPoSatu,
        opisOpreme: teren.opisOpreme || ""
      }))
    };
  };

}