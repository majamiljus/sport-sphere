import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  tip: {
    type: String,
    enum: ["sportista","zaposleni","administrator"],
    required: true
  },

  username: {
    type: String,
    required: true,
    unique: true
  },

  password: {
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

  telefon: {
    type: String,
    required: true
  },

  imejl: {
    type: String,
    required: true,
    unique: true
  },

  sportovi: {
    type: [String],
    default: []
  },

  slika: {
    type: String,
    default: "default_avatar.jpg"
  },

  objekti: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },

  adresaSedista: {
    type: String,
    default: null
  },

  maticniBroj: {
    type: String,
    default: null
  },

  pib: {
    type: String,
    default: null
  },

  aktivan: {
    type: Boolean,
    default: false
  },

  tokenZaPromenuLozinke: {
    type: String,
    default: null
  },

  istekTokenaZaPromenuLozinke: {
    type: Date,
    default: null
  }
});

export const UserModel = mongoose.model(
  "korisnik",
  userSchema,
  "korisnici"
);