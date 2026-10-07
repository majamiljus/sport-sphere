export interface Oprema {
  id: string;
  naziv: string;
  sport: string;
  slika: string;
  cena: number;
  stanje: number;
}

export interface StavkaKorpe {
  opremaId: string;
  naziv: string;
  sport: string;
  slika: string;
  cena: number;
  kolicina: number;
  stanje: number;
}

export interface StavkaPorudzbine {
  opremaId: string;
  naziv: string;
  sport: string;
  slika: string;
  cena: number;
  kolicina: number;
}

export interface Porudzbina {
  id: string;
  username: string;
  stavke: StavkaPorudzbine[];
  ukupnaCena: number;
  datumPorudzbine: string;
  status: 'naruceno' | 'preuzeto' | 'otkazano';
}