export interface TerminiPoSportu {
  sport: string;
  odigrani: number;
  rezervisani: number;
}

export interface MesecnaAktivnost {
  mesec: string;
  odigrani: number;
  rezervisani: number;
}

export interface PotrosnjaPoSportu {
  sport: string;
  potrosnja: number;
}

export interface PodaciStatistike {
  ukupanBrojRezervacija: number;
  ukupanBrojOdigranihTermina: number;
  ukupnaPotrosnja: number;
  terminiPoSportovima: TerminiPoSportu[];
  mesecnaAktivnost: MesecnaAktivnost[];
  potrosnjaPoSportovima: PotrosnjaPoSportu[];
}