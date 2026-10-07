import express from "express";
import multer from "multer";
import {ZaposleniController} from "../controllers/zaposleni/zaposleni.controller";
import {RezTreningZaposlenogController} from "../controllers/zaposleni/zaposleni_rez_trening.controller";
import {ZaposleniPromoOpremaController} from "../controllers/zaposleni/zaposleni_promo_oprema.controller";
import {ZaposleniKalendarController} from "../controllers/zaposleni/zaposleni_kalendar.controller";

const zaposleniRouter = express.Router();

const uploadSlike = multer({dest: "src/images"});

const uploadJson = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 2 * 1024 * 1024}
});

const uploadOpreme = multer({
  dest: "src/images",
  limits: {fileSize: 3 * 1024 * 1024},
  fileFilter: (req,file,callback) => {
    if(file.mimetype.startsWith("image/")) {
      callback(null,true);
      return;
    }
    callback(new Error("Dozvoljeni su samo fajlovi slika."));
  }
});

const zaposleniController = new ZaposleniController();
const rezTreningZaposlenogController = new RezTreningZaposlenogController();
const zaposleniPromoOpremaController = new ZaposleniPromoOpremaController();
const zaposleniKalendarController = new ZaposleniKalendarController();

zaposleniRouter.get("/profil/:username",zaposleniController.dohvatiProfil);
zaposleniRouter.put("/profil/:username",uploadSlike.single("image"),zaposleniController.izmeniProfil);

zaposleniRouter.post("/objekti/:username",zaposleniController.dodajObjekat);
zaposleniRouter.post("/objekti/:username/json",uploadJson.single("json"),zaposleniController.dodajObjekatIzJson);
zaposleniRouter.put("/objekti/:username/:id",zaposleniController.azurirajObjekat);

zaposleniRouter.get("/rezervacije-treninzi/:username",rezTreningZaposlenogController.dohvatiRezervacijeITreninge);
zaposleniRouter.put("/rezervacije-treninzi/:username/rezervacije/:rezervacijaId/potvrdi",rezTreningZaposlenogController.potvrdiRezervaciju);
zaposleniRouter.delete("/rezervacije-treninzi/:username/rezervacije/:rezervacijaId/odbij",rezTreningZaposlenogController.odbijRezervaciju);
zaposleniRouter.put("/rezervacije-treninzi/:username/rezervacije/:rezervacijaId/odjavi",rezTreningZaposlenogController.odjaviRezervaciju);
zaposleniRouter.put("/rezervacije-treninzi/:username/treninzi/:treningId/potvrdi",rezTreningZaposlenogController.potvrdiTrening);
zaposleniRouter.delete("/rezervacije-treninzi/:username/treninzi/:treningId/odbij",rezTreningZaposlenogController.odbijTrening);
zaposleniRouter.put("/rezervacije-treninzi/:username/treninzi/:treningId/odjavi",rezTreningZaposlenogController.odjaviTrening);

zaposleniRouter.get("/promocije/objekti/:username",zaposleniPromoOpremaController.dohvatiAktivneObjekteZaposlenog);
zaposleniRouter.get("/promocije/:username",zaposleniPromoOpremaController.dohvatiPromocije);
zaposleniRouter.post("/promocije/:username",zaposleniPromoOpremaController.kreirajPromociju);
zaposleniRouter.delete("/promocije/:username/istekle",zaposleniPromoOpremaController.obrisiIsteklePromocije);
zaposleniRouter.put("/promocije/:username/:promocijaId",zaposleniPromoOpremaController.azurirajPromociju);

zaposleniRouter.get("/oprema",zaposleniPromoOpremaController.dohvatiOpremu);
zaposleniRouter.post("/oprema",uploadOpreme.single("slika"),zaposleniPromoOpremaController.dodajOpremu);
zaposleniRouter.put("/oprema/:opremaId",uploadOpreme.single("slika"),zaposleniPromoOpremaController.azurirajOpremu);

zaposleniRouter.get("/porudzbine",zaposleniPromoOpremaController.dohvatiPorudzbine);
zaposleniRouter.put("/porudzbine/:porudzbinaId/preuzeto",zaposleniPromoOpremaController.oznaciPorudzbinuKaoPreuzetu);
zaposleniRouter.put("/porudzbine/:porudzbinaId/otkazi",zaposleniPromoOpremaController.otkaziPorudzbinu);
zaposleniRouter.delete("/porudzbine/otkazane",zaposleniPromoOpremaController.obrisiOtkazanePorudzbine);

zaposleniRouter.get("/kalendar/:username",zaposleniKalendarController.dohvatiKalendar);
zaposleniRouter.put("/kalendar/:username/pomeri",zaposleniKalendarController.pomeriTermin);

zaposleniRouter.get("/izvestaji/popunjenost",zaposleniController.generisiIzvestajPopunjenosti);
zaposleniRouter.get("/izvestaji/promet-opreme",zaposleniController.generisiIzvestajPrometaOpreme);

export default zaposleniRouter;