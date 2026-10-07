export type TipTerena = 'otvoreni' | 'zatvoreni';
export type PoljeSortiranja = 'naziv' | 'grad' | 'sport';
export type SmerSortiranja = 'rastuce' | 'opadajuce';
export type StatusObjekta = 'na_cekanju' | 'aktivan' | 'odbijen';

export interface Teren {
  naziv: string;
  tip: TipTerena;
  sport: string;
  kapacitet: number;
  cenaPoSatu: number;
  opisOpreme: string;
}

export interface Objekat {
  id: string;
  naziv: string;
  grad: string;
  adresa: string;
  sportovi: string[];
  tipoviTerena: TipTerena[];
  svidjanja: number;
  nesvidjanja: number;
  kratakOpis: string;
  naslovnaSlika: string;
  radnoVremeOd: string;
  radnoVremeDo: string;
  dozvoljenaNePojavljivanja: number;
  status: StatusObjekta;
  galerija: string[];
  tereni: Teren[];
}