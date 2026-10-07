import {Request,Response} from "express";
import mongoose from "mongoose";
import OglasModel from "../../models/oglas";
import {UserModel} from "../../models/user";
export class OglasController {
  private danasnjiDatum(): string {
    const datum = new Date();
    const godina = datum.getFullYear();
    const mesec = String(datum.getMonth() + 1).padStart(2,"0");
    const dan = String(datum.getDate()).padStart(2,"0");
    return `${godina}-${mesec}-${dan}`;
  }

  objaviOglas = async(req: Request,res: Response) => {
    try {
      const {username,sport,grad,datum,vremeOd,vremeDo,brojNedostajucihIgraca} = req.body;
      if(!username || !sport?.trim() || !grad?.trim() || !datum || !vremeOd || !vremeDo || !brojNedostajucihIgraca) {
        res.status(400).json({message: "Sva polja su obavezna."});
        return;
      }
      if(datum < this.danasnjiDatum()) {res.status(400).json({
        message: "Datum oglasa ne može biti u prošlosti."});
        return;
      }
      if(vremeOd >= vremeDo) {
        res.status(400).json({
          message: "Vreme završetka mora biti nakon vremena početka."});
          return;
        }
      const brojIgraca = Number(brojNedostajucihIgraca);
      if(!Number.isInteger(brojIgraca) || brojIgraca < 1) {
        res.status(400).json({message: "Broj nedostajućih igrača mora biti pozitivan ceo broj."});
        return;
      }
      const autor = await UserModel.findOne({username});
      if(!autor) {
        res.status(404).json({message: "Sportista nije pronađen."});
        return;
      }
      if(autor.tip !== "sportista") {
        res.status(403).json({message: "Samo sportista može objaviti oglas."});
        return;
      }
      const oglas = new OglasModel({
        username: autor.username,
        ime: autor.ime,
        prezime: autor.prezime,
        sport: sport.trim(),
        grad: grad.trim(),
        datum,
        vremeOd,
        vremeDo,
        brojNedostajucihIgraca: brojIgraca,
        status: "aktivan",
        zahtevi: [],
      });
      await oglas.save();
      res.status(201).json({message: "Oglas je uspešno objavljen."});
    } catch(error) {
      res.status(500).json({message: "Greška prilikom objavljivanja oglasa."});
    }
  };

  dohvatiAktivneOglase = async(req: Request,res: Response): Promise<void> => {
    try {
      const {username} = req.params;
      if(!username) {
        res.status(400).json({message: "Korisničko ime je obavezno."});
        return;
      }
      const sada = new Date();
      const danasnjiDatum = this.danasnjiDatum();
      const trenutnoVreme = `${String(sada.getHours()).padStart(2, "0")}:` + `${String(sada.getMinutes()).padStart(2, "0")}`;
      await OglasModel.updateMany({
        status: "aktivan",
        $or: [{datum: {$lt: danasnjiDatum,},},{datum: danasnjiDatum,vremeDo: {$lte: trenutnoVreme,},},
        ],
      },{$set: {status: "istekao",},
      });
      const oglasi = await OglasModel.find({status: "aktivan",}).sort({datum: 1,vremeOd: 1,});
      const rezultat = oglasi.map((oglas: any) => {
        const podatak = oglas.toObject();
        const vlasnik = podatak.username === username;
        const mojZahtev = podatak.zahtevi.find((zahtev: any) => zahtev.username === username);
        const zahtevi = vlasnik ? podatak.zahtevi : mojZahtev ? [mojZahtev] : [];
        return {
          id: String(podatak._id),
          username: podatak.username,
          ime: podatak.ime,
          prezime: podatak.prezime,
          sport: podatak.sport,
          grad: podatak.grad,
          datum: podatak.datum,
          vremeOd: podatak.vremeOd,
          vremeDo: podatak.vremeDo,
          brojNedostajucihIgraca: podatak.brojNedostajucihIgraca,
          status: podatak.status,
          zahtevi: zahtevi.map((zahtev: any) => ({
            id: String(zahtev._id),
            username: zahtev.username,
            ime: zahtev.ime,
            prezime: zahtev.prezime,
            status: zahtev.status,
          })),
        };
      });
      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Greška prilikom učitavanja oglasa.",
      });
    }
  };

  posaljiZahtev = async(req: Request,res: Response): Promise<void> => {
    try {
      const {oglasId} = req.params;
      const {username} = req.body;
      if(!mongoose.isValidObjectId(oglasId)) {
        res.status(400).json({message: "Neispravan identifikator oglasa.",});
        return;
      }
      if(!username) {
        res.status(400).json({message: "Korisničko ime sportiste je obavezno.",});
        return;
      }
      const oglas: any = await OglasModel.findById(oglasId);
      if(!oglas) {
        res.status(404).json({message: "Oglas nije pronađen.",});
        return;
      }
      if(oglas.status !== "aktivan") {
        res.status(400).json({message: "Oglas više nije aktivan.",});
        return;
      }
      if(oglas.username === username) {
        res.status(400).json({message: "Ne možete poslati zahtev na sopstveni oglas.",});
        return;
      }
      if(oglas.brojNedostajucihIgraca <= 0) {
        oglas.status = "popunjen";
        await oglas.save();
        res.status(400).json({message: "Ekipa je već kompletirana.",});
        return;
      }
      const sportista = await UserModel.findOne({username});
      if(!sportista) {
        res.status(404).json({message: "Sportista nije pronađen.",});
        return;
      }
      if(sportista.tip !== "sportista") {
        res.status(403).json({message: "Samo sportista može poslati zahtev.",});
        return;
      }
      const postojeciZahtev = oglas.zahtevi.find((zahtev: any) => zahtev.username === username);
      if(postojeciZahtev) {
        if(postojeciZahtev.status === "odbijen") {
          postojeciZahtev.status = "na_cekanju";
          postojeciZahtev.ime = sportista.ime;
          postojeciZahtev.prezime = sportista.prezime;
          await oglas.save();
          res.json({message: "Zahtev je ponovo poslat.",});
          return;
        }
        res.status(409).json({
          message: "Već ste poslali zahtev za ovaj oglas.",
        });
        return;
      }
      oglas.zahtevi.push({
        username: sportista.username,
        ime: sportista.ime,
        prezime: sportista.prezime,
        status: "na_cekanju",
      });
      await oglas.save();
      res.status(201).json({message: "Zahtev za pridruživanje je poslat.",});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom slanja zahteva.",});
    }
  };

  obradiZahtev = async(req: Request,res: Response): Promise<void> => {
    try {
      const {oglasId,zahtevUsername} = req.params;
      const {username,odluka} = req.body;
      if(!mongoose.isValidObjectId(oglasId)) {
        res.status(400).json({message: "Neispravan identifikator oglasa.",});
        return;
      }
      if(!zahtevUsername) {
        res.status(400).json({message: "Korisničko ime sportiste je obavezno.",});
        return;
        }
      if(!username) {
        res.status(400).json({message: "Korisničko ime autora je obavezno.",});
        return;
      }
      if(odluka !== "odobren" && odluka !== "odbijen") {
        res.status(400).json({message: "Odluka mora biti odobren ili odbijen.",});
        return;
      }
      const oglas: any = await OglasModel.findById(oglasId);
      if(!oglas) {
        res.status(404).json({message: "Oglas nije pronađen.",});
        return;
      }
      if(oglas.username !== username) {
        res.status(403).json({message: "Samo autor oglasa može obrađivati zahteve.",});
        return;
      }
      if(oglas.status !== "aktivan") {
        res.status(400).json({message: "Oglas više nije aktivan.",});
        return;
      }
      const zahtev: any = oglas.zahtevi.find((postojeciZahtev: any) => postojeciZahtev.username === zahtevUsername);
      if(!zahtev) {
        res.status(404).json({message: "Zahtev nije pronađen.",});
        return;
      }
      if(zahtev.status !== "na_cekanju") {
        res.status(400).json({message: "Ovaj zahtev je već obrađen.",});
        return;
      }
      if(odluka === "odbijen") {
        zahtev.status = "odbijen";
        await oglas.save();
        res.json({message: "Zahtev je odbijen.",});
        return;
      }
      if(oglas.brojNedostajucihIgraca <= 0) {
        oglas.status = "popunjen";
        await oglas.save();
        res.status(400).json({message: "Ekipa je već kompletirana.",});
        return;
      }
      zahtev.status = "odobren";
      oglas.brojNedostajucihIgraca--;
      if(oglas.brojNedostajucihIgraca === 0) {
        oglas.status = "popunjen";
        for(const postojeciZahtev of oglas.zahtevi) {
          if(postojeciZahtev.status === "na_cekanju") {
            postojeciZahtev.status = "odbijen";
          }
        }
      }
      await oglas.save();
      res.json({message: oglas.status === "popunjen" ? "Zahtev je odobren i ekipa je kompletirana." : "Zahtev je odobren.",});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom obrade zahteva.",});
    }
  };

  zatvoriOglas = async(req: Request,res: Response): Promise<void> => {
    try {
      const {oglasId} = req.params;
      const {username} = req.body;
      if(!mongoose.isValidObjectId(oglasId)) {
        res.status(400).json({message: "Neispravan identifikator oglasa.",});
        return;
      }
      if(!username) {
        res.status(400).json({message: "Korisničko ime autora je obavezno.",});
        return;
      }
      const oglas: any = await OglasModel.findById(oglasId);
      if(!oglas) {
        res.status(404).json({message: "Oglas nije pronađen.",});
        return;
      }
      if(oglas.username !== username) {
        res.status(403).json({message: "Samo autor oglasa može zatvoriti oglas.",});
        return;
      }
      if(oglas.status !== "aktivan") {
        res.status(400).json({message: "Oglas više nije aktivan.",});
        return;
      }
      oglas.status = "zatvoren";
      for(const zahtev of oglas.zahtevi) {
        if(zahtev.status === "na_cekanju") {zahtev.status = "odbijen";}
      }
      await oglas.save();
      res.json({message: "Oglas je zatvoren.",});
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom zatvaranja oglasa.",});
    }
  };

  dohvatiZatvoreneOglase = async(req: Request,res: Response): Promise<void> => {
    try {
      const {username} = req.params;
      if(!username) {
        res.status(400).json({message: "Korisničko ime je obavezno.",});
        return;
      }
      const oglasi = await OglasModel.find({
        status: {$in: ["popunjen","zatvoren","istekao"],},
        $or: [{username: username,},{"zahtevi.username": username,},],
      }).sort({datum: -1,vremeOd: -1,});
      const rezultat = oglasi.map((oglas: any) => {
        const podatak = oglas.toObject();
        const odobreniZahtevi = podatak.status === "popunjen" ? podatak.zahtevi.filter((zahtev: any) => zahtev.status === "odobren") : [];
        return {
          id: String(podatak._id),
          username: podatak.username,
          ime: podatak.ime,
          prezime: podatak.prezime,
          sport: podatak.sport,
          grad: podatak.grad,
          datum: podatak.datum,
          vremeOd: podatak.vremeOd,
          vremeDo: podatak.vremeDo,
          brojNedostajucihIgraca: podatak.brojNedostajucihIgraca,
          status: podatak.status,
          zahtevi: odobreniZahtevi.map((zahtev: any) => ({
            id: String(zahtev._id),
            username: zahtev.username,
            ime: zahtev.ime,
            prezime: zahtev.prezime,
            status: zahtev.status,
          })),
        };
      });
      res.json(rezultat);
    } catch(error) {
      console.log(error);
      res.status(500).json({message: "Greška prilikom učitavanja zatvorenih oglasa.",});
    }
  };
}