import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Promocija,TipPopusta} from '../models/neregistrovan';
import {Objekat} from '../models/objekti';
import {Oprema,Porudzbina} from '../models/prodavnica';
import {Rezervacija} from '../models/sportista';
import {Trening} from '../models/trening';
import {Zaposleni} from '../models/zaposleni';

interface PodaciPromocije {
  naziv: string;
  objekatId: string;
  datumPocetka: string;
  datumKraja: string;
  tipPopusta: TipPopusta;
  vrednostPopusta: number;
  sport: string | null;
}

interface PodaciOpreme {
  id: string;
  naziv: string;
  sport: string;
  cena: number;
  stanje: number;
}

interface TerminKalendaraZaposlenog {
  id: string;
  tip: 'rezervacija' | 'trening';
  korisnikId: string;
  ime: string;
  prezime: string;
  imejl: string;
  telefon: string;
  trenerId?: string;
  objekatId: string;
  teren: string;
  sport: string;
  pocetak: string;
  kraj: string;
  status: 'zakazan' | 'otkazan' | 'zavrsen' | 'neodrzan';
}

interface PodaciPomeranjaTermina {
  tip: 'rezervacija' | 'trening';
  ids: string[];
  objekatId: string;
  teren: string;
  noviPocetak: string;
  noviKraj: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZaposleniService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:4000/zaposleni';

  dohvatiProfil(username: string) {return this.http.get<{korisnik: Zaposleni; objekti: Objekat[]}>(`${this.url}/profil/${username}`);}

  izmeniProfil(profil: Zaposleni,slika: File | null) {
    const podaci = new FormData();
    podaci.append('ime',profil.ime);
    podaci.append('prezime',profil.prezime);
    podaci.append('telefon',profil.telefon);
    podaci.append('imejl',profil.imejl);
    podaci.append('sportovi',JSON.stringify(profil.sportovi));
    if(slika) {podaci.append('image',slika);}
    return this.http.put<Zaposleni>(`${this.url}/profil/${profil.username}`,podaci);
  }

  dodajObjekat(username: string,objekat: Objekat) {
    return this.http.post<Objekat>(`${this.url}/objekti/${username}`,objekat);
  }

  azurirajObjekat(username: string,objekat: Objekat) {
    return this.http.put<Objekat>(`${this.url}/objekti/${username}/${objekat.id}`,objekat);
  }

  dodajObjekatIzJson(username: string,fajl: File) {
    const podaci = new FormData();
    podaci.append('json',fajl);
    return this.http.post<Objekat>(`${this.url}/objekti/${username}/json`,podaci);
  }

  dohvatiRezervacijeITreninge(username: string) {
    return this.http.get<{rezervacije: Rezervacija[]; treninzi: Trening[]}>(`${this.url}/rezervacije-treninzi/${username}`);
  }

  potvrdiRezervaciju(username: string,rezervacijaId: string) {
    return this.http.put<{status: 'zavrsen'; message: string}>
    (`${this.url}/rezervacije-treninzi/${username}/rezervacije/${rezervacijaId}/potvrdi`,{});
  }
  odbijRezervaciju(username: string,rezervacijaId: string) {
    return this.http.delete<{message: string}>(
      `${this.url}/rezervacije-treninzi/${username}/rezervacije/${rezervacijaId}/odbij`
    );
  }

  odjaviRezervaciju(username: string,rezervacijaId: string) {
    return this.http.put<{status: 'neodrzan'; message: string}>
    (`${this.url}/rezervacije-treninzi/${username}/rezervacije/${rezervacijaId}/odjavi`,{});
  }

  potvrdiTrening(username: string,treningId: string) {
    return this.http.put<{status: 'zavrsen'; message: string}>
    (`${this.url}/rezervacije-treninzi/${username}/treninzi/${treningId}/potvrdi`,{});
  }
  odbijTrening(username: string,treningId: string) {
    return this.http.delete<{message: string}>(
      `${this.url}/rezervacije-treninzi/${username}/treninzi/${treningId}/odbij`
    );
  }

  odjaviTrening(username: string,treningId: string) {
    return this.http.put<{status: 'neodrzan'; message: string}>
    (`${this.url}/rezervacije-treninzi/${username}/treninzi/${treningId}/odjavi`,{});
  }

  dohvatiObjekteZaposlenog(username: string) {
    return this.http.get<Objekat[]>(`${this.url}/promocije/objekti/${username}`);
  }

  dohvatiPromocijeZaposlenog(username: string) {
    return this.http.get<Promocija[]>(`${this.url}/promocije/${username}`);
  }

  kreirajPromociju(username: string,podaci: PodaciPromocije) {
    return this.http.post<{message: string; promocija: Promocija}>(`${this.url}/promocije/${username}`,podaci);
  }

  obrisiIsteklePromocije(username: string) {
    return this.http.delete<{message: string;obrisano: number;}>(`${this.url}/promocije/${username}/istekle`);
  }

  azurirajPromociju(username: string,promocijaId: string,podaci: PodaciPromocije) {
    return this.http.put<{message: string; promocija: Promocija}>(`${this.url}/promocije/${username}/${promocijaId}`,podaci);
  }

  dohvatiOpremu() {return this.http.get<Oprema[]>(`${this.url}/oprema`);}

  dodajOpremu(oprema: PodaciOpreme,slika: File | null) {
    const podaci = new FormData();
    podaci.append('naziv',oprema.naziv);
    podaci.append('sport',oprema.sport);
    podaci.append('cena',String(oprema.cena));
    podaci.append('stanje',String(oprema.stanje));
    if(slika) {podaci.append('slika',slika);}
    return this.http.post<{message: string; oprema: Oprema}>(`${this.url}/oprema`,podaci);
  }

  azurirajOpremu(oprema: PodaciOpreme,slika: File | null) {
    const podaci = new FormData();
    podaci.append('naziv',oprema.naziv);
    podaci.append('sport',oprema.sport);
    podaci.append('cena',String(oprema.cena));
    podaci.append('stanje',String(oprema.stanje));
    if(slika) {podaci.append('slika',slika);}
    return this.http.put<{message: string; oprema: Oprema}>(`${this.url}/oprema/${oprema.id}`,podaci);
  }

  dohvatiPorudzbine() {
    return this.http.get<Porudzbina[]>(`${this.url}/porudzbine`);
  }

  oznaciPorudzbinuKaoPreuzetu(porudzbinaId: string) {
    return this.http.put<{message: string; status: 'preuzeto'}>(`${this.url}/porudzbine/${porudzbinaId}/preuzeto`,{});
  }
  
  obrisiOtkazanePorudzbine() {
    return this.http.delete<{message: string;obrisano: number;}>(`${this.url}/porudzbine/otkazane`);
  }
  otkaziPorudzbinu(porudzbinaId: string) {
    return this.http.put<{message: string;status: "otkazano";}>(`${this.url}/porudzbine/${porudzbinaId}/otkazi`,{});
  }

  dohvatiKalendarZaposlenog(username: string,objekatId: string,teren: string,od: string,doDatuma: string) {
    return this.http.get<{termini: TerminKalendaraZaposlenog[];}>(`${this.url}/kalendar/${username}`,{params: {objekatId: objekatId,teren: teren,od: od,doDatuma: doDatuma}
      }
    );
  }

  pomeriTerminKalendara(username: string,podaci: PodaciPomeranjaTermina) {
    return this.http.put<{message: string}>(`${this.url}/kalendar/${username}/pomeri`,podaci);
  }

  generisiIzvestajPopunjenosti(username: string,mesec: string) {
    return this.http.get(`${this.url}/izvestaji/popunjenost`,{params: {username: username,mesec: mesec},responseType: 'blob'});
  }

  generisiIzvestajPrometaOpreme(username: string,mesec: string) {
    return this.http.get(`${this.url}/izvestaji/promet-opreme`,{params: {username: username,mesec: mesec},responseType: 'blob'});
  }
}