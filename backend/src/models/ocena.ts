import mongoose from "mongoose";

const ocenaSchema = new mongoose.Schema({
  objekatId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  korisnikId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
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
  reakcija: {
    type: String,
    enum: ["svidjanje","nesvidjanje"],
    required: true
  },
  komentar: {
    type: String,
    trim: true,
    maxlength: 500
  },
  datum: {
    type: Date,
    default: Date.now
  }
});

ocenaSchema.index({
  objekatId: 1,
  datum: -1
});

export const OcenaModel = mongoose.model(
  "ocena",
  ocenaSchema,
  "ocene"
);