import mongoose from "mongoose";

const terenSchema = new mongoose.Schema(
  {
    naziv: {
      type: String,
      required: true
    },
    tip: {
      type: String,
      enum: ["otvoreni","zatvoreni"],
      required: true
    },
    sport: {
      type: String,
      required: true
    },
    kapacitet: {
      type: Number,
      min: 1,
      required: true
    },
    cenaPoSatu: {
      type: Number,
      min: 0,
      required: true
    },
    opisOpreme: {
      type: String,
      maxlength: 300,
      default: ""
    }
  },
  {
    _id: false
  }
);

const objekatSchema = new mongoose.Schema({
  naziv: {
    type: String,
    required: true
  },
  grad: {
    type: String,
    required: true
  },
  adresa: {
    type: String,
    required: true
  },
  sportovi: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ["na_cekanju","aktivan","odbijen"],
    default: "na_cekanju"
  },
  kratakOpis: {
    type: String,
    default: ""
  },
  naslovnaSlika: {
    type: String,
    default: "/facilities/default-facility.jpg"
  },
  radnoVremeOd: {
    type: String,
    required: true
  },
  radnoVremeDo: {
    type: String,
    required: true
  },
  dozvoljenaNePojavljivanja: {
    type: Number,
    min: 1,
    required: true
  },
  tereni: {
    type: [terenSchema],
    default: []
  },
  galerija: {
    type: [String],
    default: []
  }
});

objekatSchema.index(
  {
    naziv: 1,
    grad: 1
  },
  {
    unique: true
  }
);

export const FacilityModel = mongoose.model(
  "objekat",
  objekatSchema,
  "objekti"
);