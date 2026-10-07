import * as express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import {UserModel} from "../models/user";
import {FacilityModel} from "../models/facility";

export class LoginRegController {

  login = async(req: express.Request,res: express.Response) => {
    const username = req.body.username?.trim();
    const password = req.body.password;

    try {
      const user = await UserModel.findOne({
        username: username,
        tip: {
          $in: ["sportista","zaposleni"]
        },
        aktivan: true
      });

      if(!user) {
        res.sendStatus(401);
        return;
      }

      const checkPass = await bcrypt.compare(password,user.password);

      if(!checkPass) {
        res.sendStatus(401);
        return;
      }

      res.json({
        id: String(user._id),
        username: user.username,
        ime: user.ime,
        prezime: user.prezime,
        tip: user.tip
      });
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  register = async(req: express.Request,res: express.Response) => {
    const tip = req.body.tip;
    const username = req.body.username?.trim();
    const password = req.body.password;
    const ime = req.body.ime?.trim();
    const prezime = req.body.prezime?.trim();
    const telefon = req.body.telefon?.trim();
    const imejl = req.body.imejl?.trim().toLowerCase();
    const adresaSedista = req.body.adresaSedista?.trim();
    const maticniBroj = req.body.maticniBroj?.trim();
    const pib = req.body.pib?.trim();
    const facilityChoice = req.body.facilityChoice;
    const facilityId = req.body.facilityId?.trim();

    let sportovi: string[] = [];

    try {
      sportovi = JSON.parse(req.body.sportovi || "[]");
    } catch {
      res.status(400).json({
        message: "Izabrani sportovi nisu ispravni."
      });
      return;
    }

    try {
      if(tip !== "sportista" && tip !== "zaposleni") {
        res.status(400).json({
          message: "Tip korisnika nije ispravan."
        });
        return;
      }

      const postojiKor = await UserModel.findOne({
        $or: [
          {
            username: username
          },
          {
            imejl: imejl
          }
        ]
      });

      if(postojiKor) {
        res.status(409).json({
          message: "Korisničko ime ili imejl već postoje."
        });
        return;
      }

      const objektiKorisnika: mongoose.Types.ObjectId[] = [];

      if(tip === "zaposleni") {
        if(!adresaSedista || !/^\d{8}$/.test(maticniBroj) || !/^[1-9]\d{8}$/.test(pib)) {
          res.status(400).json({
            message: "Adresa sedišta, matični broj ili PIB nisu ispravni."
          });
          return;
        }

        if(facilityChoice === "postojeci") {
          if(!facilityId) {
            res.status(400).json({
              message: "Izaberite postojeći sportski objekat."
            });
            return;
          }

          if(!mongoose.isValidObjectId(facilityId)) {
            res.status(400).json({
              message: "Identifikator sportskog objekta nije ispravan."
            });
            return;
          }

          const objekatObjectId = new mongoose.Types.ObjectId(facilityId);

          const facility = await FacilityModel.findOne({
            _id: objekatObjectId,
            status: "aktivan"
          });

          if(!facility) {
            res.status(404).json({
              message: "Izabrani sportski objekat ne postoji ili nije aktivan."
            });
            return;
          }

          const employeeCount = await UserModel.countDocuments({
            tip: "zaposleni",
            objekti: objekatObjectId
          });

          if(employeeCount >= 2) {
            res.status(409).json({
              message: "Izabrani sportski objekat već ima dva zaposlena."
            });
            return;
          }

          objektiKorisnika.push(facility._id);
        }
      }

      const sifrovanaLozinka = await bcrypt.hash(password,10);

      let slika = "default_avatar.jpg";

      if(req.file) {
        slika = req.file.filename;
      }

      const korisnik = new UserModel({
        tip: tip,
        username: username,
        password: sifrovanaLozinka,
        ime: ime,
        prezime: prezime,
        telefon: telefon,
        imejl: imejl,
        sportovi: sportovi,
        slika: slika,
        objekti: tip === "zaposleni" ? objektiKorisnika : [],
        adresaSedista: tip === "zaposleni" ? adresaSedista : null,
        maticniBroj: tip === "zaposleni" ? maticniBroj : null,
        pib: tip === "zaposleni" ? pib : null,
        aktivan: false
      });

      await korisnik.save();

      res.status(201).json({
        message: "Zahtev za registraciju je uspešno poslat. Prijava će biti moguća nakon odobrenja administratora."
      });
    } catch(error: any) {
      console.log(error);
      res.status(500).json({
        message: "Došlo je do greške prilikom registracije."
      });
    }
  };

  adminLogin = async(req: express.Request,res: express.Response) => {
    const username = req.body.username?.trim();
    const password = req.body.password;

    try {
      const user = await UserModel.findOne({
        username: username,
        tip: "administrator",
        aktivan: true
      });

      if(!user) {
        res.sendStatus(401);
        return;
      }

      const passCheck = await bcrypt.compare(password,user.password);

      if(!passCheck) {
        res.sendStatus(401);
        return;
      }

      res.json({
        id: String(user._id),
        username: user.username,
        ime: user.ime,
        prezime: user.prezime,
        tip: user.tip
      });
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  availableFacilities = async(req: express.Request,res: express.Response) => {
    try {
      const objekti = await FacilityModel.find({
        status: "aktivan"
      }).sort({
        naziv: 1
      });

      const result: {
        id: string;
        naziv: string;
      }[] = [];

      for(const obj of objekti) {
        const employeeCount = await UserModel.countDocuments({
          tip: "zaposleni",
          objekti: obj._id
        });

        if(employeeCount < 2) {
          result.push({
            id: String(obj._id),
            naziv: obj.naziv
          });
        }
      }

      res.json(result);
    } catch(error) {
      console.log(error);
      res.status(500).json({
        message: "Objekte trenutno nije moguće učitati."
      });
    }
  };

  requestPasswordReset = async(req: express.Request,res: express.Response) => {
    const id = req.body.id?.trim();

    try {
      if(!id) {
        res.sendStatus(400);
        return;
      }

      const user = await UserModel.findOne({
        $or: [
          {
            username: id
          },
          {
            imejl: id.toLowerCase()
          }
        ],
        aktivan: true
      });

      if(!user) {
        res.sendStatus(200);
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const entoken = crypto.createHash("sha256").update(token).digest("hex");

      user.tokenZaPromenuLozinke = entoken;
      user.istekTokenaZaPromenuLozinke = new Date(Date.now() + 30 * 60 * 1000);

      await user.save();

      const resetLink = `http://localhost:4200/postavi-lozinku/${token}`;

      console.log("\nLink za password reset:");
      console.log(resetLink);

      res.status(200).send();
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };

  resetPassword = async(req: express.Request,res: express.Response) => {
    const token = req.body.token;
    const password = req.body.password;

    try {
      if(!token || !password) {
        res.sendStatus(400);
        return;
      }

      const entoken = crypto.createHash("sha256").update(token).digest("hex");

      const user = await UserModel.findOne({
        tokenZaPromenuLozinke: entoken,
        istekTokenaZaPromenuLozinke: {
          $gt: new Date()
        },
        aktivan: true
      });

      if(!user) {
        res.sendStatus(400);
        return;
      }

      user.password = await bcrypt.hash(password,10);
      user.tokenZaPromenuLozinke = null;
      user.istekTokenaZaPromenuLozinke = null;

      await user.save();

      res.status(200).send();
    } catch(error) {
      console.log(error);
      res.sendStatus(500);
    }
  };
}