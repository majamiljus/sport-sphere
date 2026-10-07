import * as express from "express";
import {IndividualniTreningModel} from "../../models/trening";
import {RezervacijaModel} from "../../models/rezervacije";
import {UserModel} from "../../models/user";
export class RezTreningZaposlenogController {

  dohvatiRezervacijeITreninge = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {res.status(404).json({message: "Zaposleni nije pronađen."});return;}
      const objekti = zaposleni.objekti || [];
      const desetMinutaRanije = new Date(Date.now() - 10 * 60 * 1000);
      await RezervacijaModel.updateMany(
        {
          objekatId: {$in: objekti},
          status: "zakazan",
          pocetak: {$lt: desetMinutaRanije}
        },
        {
          $set: {status: "zavrsen"}
        }
      );
      await IndividualniTreningModel.updateMany(
        {
          objekatId: {$in: objekti},
          status: "zakazan",
          pocetak: {$lt: desetMinutaRanije}
        },
        {
          $set: {status: "zavrsen"}
        }
      );
      const rezervacije = await RezervacijaModel.find({
        objekatId: {$in: objekti}
      }).sort({pocetak: -1});

      const treninzi = await IndividualniTreningModel.find({
        objekatId: {$in: objekti}
      }).sort({pocetak: -1});
      
      res.json({
        rezervacije: rezervacije.map(rezervacija => ({
          id: String(rezervacija._id),
          nazivObjekta: rezervacija.nazivObjekta,
          grad: rezervacija.grad,
          teren: rezervacija.teren,
          sport: rezervacija.sport,
          pocetak: rezervacija.pocetak,
          kraj: rezervacija.kraj,
          status: rezervacija.status
        })),
        treninzi: treninzi.map(trening => ({
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
        }))
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Rezervacije i treninge trenutno nije moguće učitati."
      });
    }
  };

  potvrdiRezervaciju = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const rezervacijaId = String(req.params.rezervacijaId || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const rezervacija = await RezervacijaModel.findOne({
        _id: rezervacijaId,
        objekatId: {
          $in: zaposleni.objekti
        }
      });
      if(!rezervacija) {
        res.status(404).json({message: "Rezervacija nije pronađena."});
        return;
      }
      if(rezervacija.status !== "zakazan") {
        res.status(400).json({message: "Status ove rezervacije više nije moguće promeniti."});
        return;
      }
      if(!this.dozvoljenaPromena(rezervacija.pocetak)) {
        res.status(400).json({message: "Dolazak se može evidentirati od početka termina do 10 minuta nakon početka."});
        return;
      }
      rezervacija.status = "zavrsen";
      await rezervacija.save();
      res.json({
        status: rezervacija.status,
        message: "Dolazak korisnika je potvrđen."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Rezervaciju trenutno nije moguće potvrditi."});
    }
  };

  odbijRezervaciju = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const rezervacijaId = String(req.params.rezervacijaId || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const rezervacija = await RezervacijaModel.findOne({
        _id: rezervacijaId,
        objekatId: {$in: zaposleni.objekti}
      });

      if(!rezervacija) {
        res.status(404).json({message: "Rezervacija nije pronađena."});
        return;
      }

      if(rezervacija.status !== "zakazan") {
        res.status(400).json({message: "Moguće je odbiti samo zakazanu rezervaciju."});
        return;
      }
      await rezervacija.deleteOne();
      res.json({message: "Rezervacija je odbijena i obrisana iz sistema."});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Rezervaciju trenutno nije moguće odbiti."});
    }
  };

  odjaviRezervaciju = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const rezervacijaId = String(req.params.rezervacijaId || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {res.status(404).json({message: "Zaposleni nije pronađen."});return;}
      const rezervacija = await RezervacijaModel.findOne({
        _id: rezervacijaId,
        objekatId: {
          $in: zaposleni.objekti
        }
      });
      if(!rezervacija) {
        res.status(404).json({message: "Rezervacija nije pronađena."});
        return;
      }
      if(rezervacija.status !== "zakazan") {
        res.status(400).json({message: "Status ove rezervacije više nije moguće promeniti."});
        return;
      }
      if(!this.dozvoljenaPromena(rezervacija.pocetak)) {
        res.status(400).json({message: "Nedolazak se može evidentirati od početka termina do 10 minuta nakon početka."});
        return;
      }
      rezervacija.status = "neodrzan";
      await rezervacija.save();
      res.json({
        status: rezervacija.status,
        message: "Korisnik je evidentiran kao nedolazak."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Nedolazak trenutno nije moguće evidentirati."});
    }
  };

  potvrdiTrening = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const treningId = String(req.params.treningId || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {res.status(404).json({message: "Zaposleni nije pronađen."});return;}
      const trening = await IndividualniTreningModel.findOne({
        _id: treningId,
        objekatId: {
          $in: zaposleni.objekti
        }
      });
      if(!trening) {
        res.status(404).json({message: "Trening nije pronađen."});
        return;
      }
      if(trening.status !== "zakazan") {
        res.status(400).json({message: "Status ovog treninga više nije moguće promeniti."});
        return;
      }
      if(!this.dozvoljenaPromena(trening.pocetak)) {
        res.status(400).json({message: "Dolazak se može evidentirati od početka treninga do 10 minuta nakon početka."});
        return;
      }
      trening.status = "zavrsen";
      await trening.save();
      res.json({
        status: trening.status,
        message: "Održavanje treninga je potvrđeno."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Trening trenutno nije moguće potvrditi."
      });
    }
  };

   odbijTrening = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const treningId = String(req.params.treningId || "").trim();
      const zaposleni = await UserModel.findOne({username: username,tip: "zaposleni"});

      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const trening = await IndividualniTreningModel.findOne({
        _id: treningId,
        objekatId: {
          $in: zaposleni.objekti
        }
      });
      if(!trening) {
        res.status(404).json({message: "Trening nije pronađen."});
        return;
      }
      if(trening.status !== "zakazan") {
        res.status(400).json({message: "Moguće je odbiti samo zakazani trening."});
        return;
      }
      await trening.deleteOne();
      res.json({message: "Trening je odbijen i obrisan iz sistema."});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Trening trenutno nije moguće odbiti."});
    }
  };

  odjaviTrening = async(req: express.Request,res: express.Response) => {
    try {
      const username = String(req.params.username || "").trim();
      const treningId = String(req.params.treningId || "").trim();
      const zaposleni = await UserModel.findOne({
        username: username,
        tip: "zaposleni"
      });
      if(!zaposleni) {
        res.status(404).json({message: "Zaposleni nije pronađen."});
        return;
      }
      const trening = await IndividualniTreningModel.findOne({
        _id: treningId,
        objekatId: {
          $in: zaposleni.objekti
        }
      });
      if(!trening) {
        res.status(404).json({message: "Trening nije pronađen."});
        return;
      }
      if(trening.status !== "zakazan") {
        res.status(400).json({message: "Status ovog treninga više nije moguće promeniti."});
        return;
      }
      if(!this.dozvoljenaPromena(trening.pocetak)) {
        res.status(400).json({message: "Nedolazak se može evidentirati od početka treninga do 10 minuta nakon početka."});
        return;
      }
      trening.status = "neodrzan";
      await trening.save();
      res.json({
        status: trening.status,
        message: "Trening je evidentiran kao neodržan."
      });
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Trening trenutno nije moguće odjaviti."});
    }
  };
  
  private dozvoljenaPromena(pocetak: Date): boolean {
    const sada = Date.now();
    const pocetakTermina = pocetak.getTime();
    const krajPerioda = pocetakTermina + 10 * 60 * 1000;
    return (sada >= pocetakTermina && sada <= krajPerioda);
  }
}