import express from "express";
import {NaloziController} from "../controllers/admin/nalozi.controller";
import {ObjekatTreneriController} from "../controllers/admin/objekat_treneri.controller";
const adminRouter =express.Router();

const naloziController =new NaloziController();
const objekatTreneriController =new ObjekatTreneriController();

adminRouter.route("/nalozi").get(naloziController.dohvatiNaloge);
adminRouter.route("/nalozi/:username").put(naloziController.izmeniNalog).delete(naloziController.obrisiNalog);

adminRouter.route("/zahtevi").get(naloziController.dohvatiZahteveZaRegistraciju);
adminRouter.route("/zahtevi/:username/odobri").put(naloziController.odobriZahtevZaRegistraciju);
adminRouter.route("/zahtevi/:username/odbij").delete(naloziController.odbijZahtevZaRegistraciju);

adminRouter.route("/objekti").get(objekatTreneriController.dohvatiZahteveZaObjekte);
adminRouter.route("/objekti/:objekatId/odobri").put(objekatTreneriController.odobriObjekat);
adminRouter.route("/objekti/:objekatId/odbij").delete(objekatTreneriController.odbijObjekat);

adminRouter.route("/treneri").get(objekatTreneriController.dohvatiTrenere);
adminRouter.route("/treneri/:trenerId/deaktiviraj").put(objekatTreneriController.deaktivirajTrenera);

export default adminRouter;