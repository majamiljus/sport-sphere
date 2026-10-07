import mongoose from "mongoose";

const zahtevSchema = new mongoose.Schema(
  {
    username: {
    type: String,
    required: true
    },
    ime: {
      type: String,
      required: true
    },
    prezime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["na_cekanju", "odobren", "odbijen"],
      default: "na_cekanju"
    }
  }
);

const oglasSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      ref: "User",
    },
    ime: {
      type: String,
    },
    prezime: {
      type: String,
    },
    sport: {
      type: String,
    },
    grad: {
      type: String,
    },
    datum: {
      type: String,
    },
    vremeOd: {
      type: String,
    },
    vremeDo: {
      type: String,
    },
    brojNedostajucihIgraca: {
      type: Number,
  
    },
    status: {
      type: String,
      enum: ["aktivan", "popunjen", "zatvoren", "istekao"],
      default: "aktivan"
    },
    zahtevi: {
      type: [zahtevSchema],
      default: []
    }
  },
);



export default mongoose.model("oglas", oglasSchema,"oglas");