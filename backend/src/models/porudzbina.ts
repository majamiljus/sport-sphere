import mongoose from "mongoose";

const stavkaPorudzbineSchema = new mongoose.Schema({
  opremaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  naziv: {
    type: String,
    required: true
  },
  slika: {
    type: String,
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  cena: {
    type: Number,
    required: true
  },
  kolicina: {
    type: Number,
    required: true,
    min: 1
  }
});

const porudzbinaSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  stavke: {
    type: [stavkaPorudzbineSchema],
    required: true
  },
  ukupnaCena: {
    type: Number,
    required: true,
    min: 0
  },
  datumPorudzbine: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["naruceno","preuzeto","otkazano"],
    default: "naruceno"
  }
});

export const PorudzbinaModel = mongoose.model(
  "Porudzbina",
  porudzbinaSchema,
  "porudzbine"
);