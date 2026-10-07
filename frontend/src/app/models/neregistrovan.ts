import {Objekat} from './objekti';

export type TipTerena = 'otvoreni' | 'zatvoreni';
export type PoljeSortiranja = 'naziv' | 'grad' | 'sport';
export type SmerSortiranja = 'rastuce' | 'opadajuce';
export type TipPopusta = 'procenat' | 'fiksni';

export interface Promocija {
  id: string;
  naziv: string;
  objekatId: string;
  nazivObjekta: string;
  gradObjekta: string;
  datumPocetka: string;
  datumKraja: string;
  tipPopusta: TipPopusta;
  vrednostPopusta: number;
  sport: string | null;
}

export interface PodaciPocetneStranice {
  brojAktivnihObjekata: number;
  najboljiObjekti: Objekat[];
  promocije: Promocija[];
  gradovi: string[];
  sportovi: string[];
}