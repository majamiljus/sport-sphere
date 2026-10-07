export type ReakcijaObjekta = 'svidjanje' | 'nesvidjanje';

export interface Komentar {
  id: string;
  username: string;
  ime: string;
  prezime: string;
  reakcija: ReakcijaObjekta;
  komentar: string;
  datum: string;
  mojKomentar: boolean;
}

export interface PodaciOcenaObjekta {
  svidjanja: number;
  nesvidjanja: number;
  mozeDaOceni: boolean;
  brojPotvrdjenihRezervacija: number;
  brojOstavljenihOcena: number;
  komentari: Komentar[];
}

export interface ObjekatZaOcenjivanje {
  id: string;
  naziv: string;
  grad: string;
  adresa: string;
  naslovnaSlika: string;
  sportovi: string[];
  svidjanja: number;
  nesvidjanja: number;
  brojPotvrdjenihRezervacija: number;
  brojOstavljenihOcena: number;
  brojPreostalihOcena: number;
}