import express from "express";
import {IndexController} from "../controllers/index.controller";

const indexRouter = express.Router();

indexRouter.route("/home").get((req, res) =>new IndexController().getHomeData(req, res));
indexRouter.route("/obj").get((req, res) => new IndexController().getObjects(req, res));
indexRouter.route("/objDetails/:id").get((req, res) =>new IndexController().getObjDetails(req, res));

export default indexRouter;
