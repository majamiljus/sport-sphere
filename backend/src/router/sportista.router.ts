import express from "express";
import multer from "multer";
import {SportistaController} from "../controllers/sportista/sportista.controller";
import {OglasController} from "../controllers/sportista/sportista_oglas.controller";
import {TreningController} from "../controllers/sportista/trening.controller";
import {ProdavnicaController} from "../controllers/sportista/prodavnica.controller";
import {OcenaController} from "../controllers/sportista/sportista_ocena_stats.controller";

const sportistaRouter = express.Router();
const upload = multer({dest: "src/images"});
const sportistaController =new SportistaController();
const oglasController =new OglasController();
const treningController =new TreningController();
const prodavnicaController =new ProdavnicaController();
const ocenaController =new OcenaController();

sportistaRouter.get("/profil/:username",sportistaController.dohvatiProfil);
sportistaRouter.put("/profil/:username",upload.single("slika"),sportistaController.izmeniProfil);

sportistaRouter.put("/rezervisi/:rezervacijaId/otkazi",sportistaController.otkaziRezervaciju);
sportistaRouter.post("/rezervisi/pretraga",sportistaController.pretraziObjekte);
sportistaRouter.post("/rezervisi/termini/:objekatId",sportistaController.dohvatiTermine);
sportistaRouter.post("/rezervisi",sportistaController.napraviRezervaciju);

sportistaRouter.post("/oglasi",oglasController.objaviOglas);
sportistaRouter.get("/oglasi/aktivni/:username",oglasController.dohvatiAktivneOglase);
sportistaRouter.get("/oglasi/zatvoreni/:username",oglasController.dohvatiZatvoreneOglase);
sportistaRouter.post("/oglasi/:oglasId/zahtevi",oglasController.posaljiZahtev);
sportistaRouter.put("/oglasi/:oglasId/zahtevi/:zahtevUsername",oglasController.obradiZahtev);
sportistaRouter.put("/oglasi/:oglasId/zatvori",oglasController.zatvoriOglas);

sportistaRouter.get("/treninzi/objekti",treningController.dohvatiObjekte);
sportistaRouter.get("/treninzi/provera-prava",treningController.proveriPravoZakazivanja);
sportistaRouter.get("/treninzi/treneri/:trenerId/termini",treningController.dohvatiZauzeteTermine);
sportistaRouter.get("/treninzi/treneri/:objekatId",treningController.dohvatiTrenere);
sportistaRouter.post("/treninzi",treningController.zakaziTrening);
sportistaRouter.get("/treninzi/arhiva/:username",treningController.dohvatiTreninge);
sportistaRouter.put("/treninzi/:treningId/otkazi",treningController.otkaziTrening);

sportistaRouter.get("/prodavnica/oprema",prodavnicaController.dohvatiOpremu);
sportistaRouter.post("/prodavnica/porudzbine",prodavnicaController.kreirajPorudzbinu);
sportistaRouter.get("/prodavnica/porudzbine/:username",prodavnicaController.dohvatiPorudzbine);
sportistaRouter.put("/prodavnica/porudzbine/:porudzbinaId/otkazi",prodavnicaController.otkaziPorudzbinu);

sportistaRouter.route("/objekti/:objekatId/ocene").get(ocenaController.dohvatiOceneObjekta).post(ocenaController.ostaviOcenu);
sportistaRouter.get("/objekti/:objekatId/promocije",ocenaController.dohvatiPromocijeObjekta);
sportistaRouter.get("/ocenjivanje/objekti/:username",ocenaController.dohvatiObjekteZaOcenjivanje);

sportistaRouter.get("/statistika",ocenaController.dohvatiStatistiku);

export default sportistaRouter;