import mongoose from "mongoose";

const promocijaSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  naziv: {
    type: String,
    required: true
  },
  objekatId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  datumPocetka: {
    type: String,
    required: true
  },
  datumKraja: {
    type: String,
    required: true
  },
  tipPopusta: {
    type: String,
    enum: ["procenat","fiksni"],
    required: true
  },
  vrednostPopusta: {
    type: Number,
    min: 0,
    required: true
  },
  sport: {
    type: String,
    default: null
  },
  aktivna: {
    type: Boolean,
    default: true
  }
});

export const PromotionModel = mongoose.model(
  "promocija",
  promocijaSchema,
  "promocije"
);