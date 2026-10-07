export interface Trener {
  id: string;
  ime: string;
  prezime: string;
  objekatId: string;
  sport: string;
  specijalizacija: string;
  prosecnaOcena: number;
  cenaPoSatu: number;
}

export interface Trening {
  id: string;
  trenerId: string;
  imeTrenera: string;
  prezimeTrenera: string;
  objekatId: string;
  nazivObjekta: string;
  sport: string;
  teren: string;
  pocetak: string;
  kraj: string;
  cena: number;
  status: 'zakazan' | 'otkazan' | 'zavrsen' | 'neodrzan';
}