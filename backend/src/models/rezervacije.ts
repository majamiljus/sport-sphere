import mongoose from 'mongoose';

const rezervacijaSchema = new mongoose.Schema({
  korisnikId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  grad: {
    type: String,
    required: true
  },
  teren: {
    type: String,
    required: true
  },
  sport: {
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
  status: {
  type: String,
  enum: [
   "zakazan",
    "otkazan",
    "zavrsen",
    "neodrzan"
    ],
    default: "na_cekanju"
  }
});

export const RezervacijaModel = mongoose.model(
  'rezervacija',
  rezervacijaSchema,
  'rezervacije'
);