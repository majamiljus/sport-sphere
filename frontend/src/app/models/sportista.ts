export type StatusRezervacije = 'zakazan' | 'otkazan' | 'zavrsen' | 'neodrzan';
export type PoljeSortiranjaRezervacija = 'nazivObjekta' | 'grad' | 'teren' | 'sport' | 'pocetak' | 'status';

export interface Profil {
  id: string;
  username: string;
  ime: string;
  prezime: string;
  telefon: string;
  imejl: string;
  sportovi: string[];
  slika: string;
}

export interface Rezervacija {
  id: string;
  nazivObjekta: string;
  grad: string;
  teren: string;
  sport: string;
  pocetak: string;
  kraj: string;
  status: StatusRezervacije;
}

export interface PodaciProfila {
  korisnik: Profil;
  rezervacije: Rezervacija[];
}

export interface TerminKalendara {
  pocetak: string;
  kraj: string;
  status: StatusRezervacije;
}