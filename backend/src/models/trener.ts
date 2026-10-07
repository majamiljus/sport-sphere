import mongoose from "mongoose";

const trenerSchema = new mongoose.Schema({
  ime: {
    type: String,
    required: true
  },
  prezime: {
    type: String,
    required: true
  },
  objekatId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  specijalizacija: {
    type: String,
    required: true
  },
  prosecnaOcena: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  cenaPoSatu: {
    type: Number,
    min: 0,
    required: true
  },
  aktivan: {
    type: Boolean,
    default: true
  }
});

export const TrenerModel = mongoose.model(
  "Trener",
  trenerSchema,
  "treneri"
);