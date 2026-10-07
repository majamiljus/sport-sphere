export interface Zahtev {
  id: string;
  username: string;
  ime: string;
  prezime: string;
  status: 'na_cekanju' | 'odobren' | 'odbijen';
}

export interface Oglas {
  id: string;
  username: string;
  ime: string;
  prezime: string;
  sport: string;
  grad: string;
  datum: string;
  vremeOd: string;
  vremeDo: string;
  brojNedostajucihIgraca: number;
  status: 'aktivan' | 'popunjen' | 'zatvoren' | 'istekao';
  zahtevi: Zahtev[];
}