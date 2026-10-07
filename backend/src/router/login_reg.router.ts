import express from "express";
import multer from "multer";

import { LoginRegController } from "../controllers/login_reg.controller";

const loginRegRouter = express.Router();

const upload = multer({
  dest: "src/images"
});

loginRegRouter.route("/login").post((req, res) => new LoginRegController().login(req, res));
loginRegRouter.route("/forgot-password").post((req, res) =>new LoginRegController().requestPasswordReset(req, res));
loginRegRouter.route("/reset-password").post((req, res) =>new LoginRegController().resetPassword(req, res));

loginRegRouter.route("/admin/login").post((req, res) => new LoginRegController().adminLogin(req, res));

loginRegRouter.route("/register").post(upload.single("image"),(req, res) => new LoginRegController().register(req, res));
loginRegRouter.route("/available-facilities").get((req,res) =>new LoginRegController().availableFacilities(req,res));
export default loginRegRouter;