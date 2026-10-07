import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userRouter from "./router/login_reg.router";
import publicRouter from "./router/index.router";
import sportistaRouter from "./router/sportista.router";
import zaposleniRouter from "./router/zaposleni.router";
import adminRouter from "./router/admin.router";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/images",express.static("src/images"));
mongoose.connect("mongodb://127.0.0.1:27017/SportSphere");
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("db connection ok");
});

const router = express.Router();
app.use("/", router);
router.use("/index", publicRouter);
router.use("/users", userRouter);
router.use("/sportista", sportistaRouter);
router.use("/zaposleni",zaposleniRouter);
router.use("/admin",adminRouter);

app.listen(4000, () => console.log(`Express server running on port 4000`));
