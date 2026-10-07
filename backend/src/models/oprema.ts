import mongoose from "mongoose";

const opremaSchema = new mongoose.Schema({
  naziv: {
    type: String,
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  slika: {
    type: String,
    required: true
  },
  cena: {
    type: Number,
    required: true,
    min: 0
  },
  stanje: {
    type: Number,
    required: true,
    min: 0
  }
});

export const OpremaModel = mongoose.model(
  "Oprema",
  opremaSchema,
  "oprema"
);