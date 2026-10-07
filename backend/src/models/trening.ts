import mongoose from "mongoose";

const individualniTreningSchema =
  new mongoose.Schema({
    korisnikId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    trenerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    imeTrenera: {
      type: String,
      required: true
    },
    prezimeTrenera: {
      type: String,
      required: true
    },
    objekatId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    nazivObjekta: {
      type: String,
      required: true
    },
    sport: {
      type: String,
      required: true
    },
    teren: {
      type: String,
      required: true
    },
    pocetak: {
      type: Date,
      required: true
    },
    kraj: {
      type: Date,
      required: true
    },
    cena: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: [
        "zakazan",
        "otkazan",
        "zavrsen",
        "neodrzan"
      ],
      default: "zakazan"
    }
  });

export const IndividualniTreningModel =
  mongoose.model(
    "IndividualniTrening",
    individualniTreningSchema,
    "treninzi"
  );