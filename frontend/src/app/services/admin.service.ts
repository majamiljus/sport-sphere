import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Objekat} from '../models/objekti';
import {Trener} from '../models/trening';

export type TipKorisnika = 'sportista' | 'zaposleni' | 'administrator';

export interface KorisnickiNalog {
  tip: TipKorisnika;
  username: string;
  ime: string;
  prezime: string;
  telefon: string;
  imejl: string;
  sportovi: string[];
  slika: string;
  objekti: string[];
  adresaSedista: string | null;
  maticniBroj: string | null;
  pib: string | null;
}

export interface ZaposleniObjekta {
  username: string;
  ime: string;
  prezime: string;
  imejl: string;
}

export interface ZahtevZaObjekat extends Objekat {
  zaposleni: ZaposleniObjekta | null;
}

export interface TrenerZaAdmin extends Trener {
  nazivObjekta: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:4000/admin';

  dohvatiNaloge() {return this.http.get<KorisnickiNalog[]>(`${this.url}/nalozi`);}

  izmeniNalog(originalniUsername: string,nalog: KorisnickiNalog) {
    return this.http.put<{message: string; nalog: KorisnickiNalog}>(`${this.url}/nalozi/${originalniUsername}`,nalog);
  }

  obrisiNalog(username: string) {
    return this.http.delete<{message: string}>(`${this.url}/nalozi/${username}`);
  }

  dohvatiZahteveZaRegistraciju() {
    return this.http.get<KorisnickiNalog[]>(`${this.url}/zahtevi`);
  }

  odobriZahtevZaRegistraciju(username: string) {
    return this.http.put<{message: string; nalog: KorisnickiNalog}>(`${this.url}/zahtevi/${username}/odobri`,{});
  }

  odbijZahtevZaRegistraciju(username: string) {
    return this.http.delete<{message: string}>(`${this.url}/zahtevi/${username}/odbij`);
  }

  dohvatiZahteveZaObjekte() {
    return this.http.get<ZahtevZaObjekat[]>(`${this.url}/objekti`);
  }

  odobriObjekat(objekatId: string) {
    return this.http.put<{message: string}>(`${this.url}/objekti/${objekatId}/odobri`,{});
  }

  odbijObjekat(objekatId: string) {
    return this.http.delete<{message: string}>(`${this.url}/objekti/${objekatId}/odbij`);
  }

  dohvatiTrenere() {
    return this.http.get<TrenerZaAdmin[]>(`${this.url}/treneri`);
  }

  deaktivirajTrenera(trenerId: string) {
    return this.http.put<{message: string}>(`${this.url}/treneri/${trenerId}/deaktiviraj`,{});
  }
}