import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';

export interface DostupanObjekat {
  id: string;
  naziv: string;
}

export interface PodaciPrijavljenogKorisnika {
  id: string;
  username: string;
  ime: string;
  prezime: string;
  tip: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:4000/users';

  prijava(username: string,lozinka: string) {
    return this.http.post<PodaciPrijavljenogKorisnika>(`${this.url}/login`,{username: username,password: lozinka});
  }

  prijavaAdministratora(username: string,lozinka: string) {
    return this.http.post<PodaciPrijavljenogKorisnika>(`${this.url}/admin/login`,{username: username,password: lozinka});
  }

  registracija(podaci: FormData) {
    return this.http.post<{message: string}>(`${this.url}/register`,podaci);
  }

  dohvatiDostupneObjekte() {
    return this.http.get<DostupanObjekat[]>(`${this.url}/available-facilities`);
  }

  zahtevajPromenuLozinke(id: string) {
    return this.http.post<void>(`${this.url}/forgot-password`,{id: id});
  }

  promeniLozinku(token: string,lozinka: string) {
    return this.http.post<void>(`${this.url}/reset-password`,{token: token,password: lozinka});
  }
}