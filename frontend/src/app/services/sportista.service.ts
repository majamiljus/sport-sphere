import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Promocija} from '../models/neregistrovan';
import {Objekat} from '../models/objekti';
import {ObjekatZaOcenjivanje,PodaciOcenaObjekta,ReakcijaObjekta} from '../models/ocena';
import {Oglas} from '../models/oglas';
import {Oprema,Porudzbina,StavkaKorpe} from '../models/prodavnica';
import {PodaciProfila,Profil,TerminKalendara} from '../models/sportista';
import {PodaciStatistike} from '../models/statistika';
import {Trener,Trening} from '../models/trening';

@Injectable({
  providedIn: 'root'
})
export class SportistaService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:4000/sportista';

  dohvatiProfil(username: string) {
    return this.http.get<PodaciProfila>(`${this.url}/profil/${username}`);
  }

  izmeniProfil(profil: Profil,slika: File | null) {
    const podaci = new FormData();
    podaci.append('ime',profil.ime);
    podaci.append('prezime',profil.prezime);
    podaci.append('telefon',profil.telefon);
    podaci.append('imejl',profil.imejl);
    podaci.append('sportovi',JSON.stringify(profil.sportovi));
    if(slika) {podaci.append('slika',slika);}
    return this.http.put<Profil>(`${this.url}/profil/${profil.username}`,podaci);
  }

  otkaziRezervaciju(rezervacijaId: string,username: string) {
    return this.http.put<{message: string}>(`${this.url}/rezervisi/${rezervacijaId}/otkazi`,{username: username});
  }

  pretraziObjekte(naziv: string,grad: string,sport: string,tipTerena: string,samoSlobodniDanas: boolean) {
    return this.http.post<Objekat[]>
    (`${this.url}/rezervisi/pretraga`,{naziv: naziv,grad: grad,sport: sport,tipTerena: tipTerena,samoSlobodniDanas: samoSlobodniDanas});
  }

  dohvatiTermine(objekatId: string,username: string,teren: string,od: string,doDatuma: string) {
    return this.http.post<{termini: TerminKalendara[]; mozeDaRezervise: boolean; poruka: string}>
    (`${this.url}/rezervisi/termini/${objekatId}`,{username: username,teren: teren,od: od,doDatuma: doDatuma});
  }

  napraviRezervaciju(username: string,objekatId: string,teren: string,pocetak: string,promocijaId: string) {
    return this.http.post<{message: string; cena: number}>
    (`${this.url}/rezervisi`,{username: username,objekatId: objekatId,teren: teren,pocetak: pocetak,promocijaId: promocijaId});
  }

  objaviOglas(oglas: Oglas) {
    return this.http.post<{message: string}>
    (`${this.url}/oglasi`,{username: oglas.username,sport: oglas.sport,grad: oglas.grad,datum: oglas.datum,vremeOd: oglas.vremeOd,vremeDo: oglas.vremeDo,brojNedostajucihIgraca: oglas.brojNedostajucihIgraca});
  }

  dohvatiAktivneOglase(username: string) {
    return this.http.get<Oglas[]>(`${this.url}/oglasi/aktivni/${username}`);
  }

  dohvatiZatvoreneOglase(username: string) {
    return this.http.get<Oglas[]>(`${this.url}/oglasi/zatvoreni/${username}`);
  }

  posaljiZahtev(oglasId: string,username: string) {
    return this.http.post<{message: string}>(`${this.url}/oglasi/${oglasId}/zahtevi`,{username: username});
  }

  obradiZahtev(oglasId: string,usernameZahteva: string,username: string,odluka: string) {
    return this.http.put<{message: string}>
    (`${this.url}/oglasi/${oglasId}/zahtevi/${usernameZahteva}`,{username: username,odluka: odluka});
  }

  zatvoriOglas(oglasId: string,username: string) {
    return this.http.put<{message: string}>(`${this.url}/oglasi/${oglasId}/zatvori`,{username: username});
  }

  dohvatiObjekteZaTrening() {
    return this.http.get<Objekat[]>(`${this.url}/treninzi/objekti`);
  }

  proveriPravoZakazivanjaTreninga(username: string,objekatId: string) {
    return this.http.get<{message: string}>(`${this.url}/treninzi/provera-prava`,{params: {username: username,objekatId: objekatId}});
  }

  dohvatiTrenere(objekatId: string,sport: string) {
    return this.http.get<Trener[]>(`${this.url}/treninzi/treneri/${objekatId}`,{params: {sport: sport}});
  }

  zakaziTrening(username: string,trenerId: string,objekatId: string,teren: string,datum: string,vreme: string,promocijaId: string) {
    return this.http.post<{message: string; cena: number}>
    (`${this.url}/treninzi`,{username: username,trenerId: trenerId,objekatId: objekatId,teren: teren,datum: datum,vreme: vreme,promocijaId: promocijaId});
  }

  dohvatiArhivuTreninga(username: string) {
    return this.http.get<Trening[]>(`${this.url}/treninzi/arhiva/${username}`);
  }

  otkaziTrening(treningId: string,username: string) {
    return this.http.put<{message: string}>(`${this.url}/treninzi/${treningId}/otkazi`,{username: username});
  }

  dohvatiZauzeteTermine(trenerId: string,objekatId: string,teren: string,datum: string) {
    return this.http.get<string[]>
    (`${this.url}/treninzi/treneri/${trenerId}/termini`,{params: {objekatId: objekatId,teren: teren,datum: datum}});
  }

  dohvatiOpremu(sport: string) {
    let adresa = `${this.url}/prodavnica/oprema`;
    if(sport) {adresa += `?sport=${encodeURIComponent(sport)}`;}
    return this.http.get<Oprema[]>(adresa);
  }

  kreirajPorudzbinu(username: string,stavke: StavkaKorpe[]) {
    return this.http.post<{message: string; id: string}>
    (`${this.url}/prodavnica/porudzbine`,{username: username,stavke: stavke.map(stavka => ({opremaId: stavka.opremaId,kolicina: stavka.kolicina}))});
  }

  dohvatiPorudzbine(username: string) {
    return this.http.get<Porudzbina[]>(`${this.url}/prodavnica/porudzbine/${username}`);
  }

  otkaziPorudzbinu(porudzbinaId: string,username: string) {
    return this.http.put<{message: string}>(`${this.url}/prodavnica/porudzbine/${porudzbinaId}/otkazi`,{username: username});
  }

  dohvatiObjekteZaOcenjivanje(username: string) {
    return this.http.get<ObjekatZaOcenjivanje[]>(`${this.url}/ocenjivanje/objekti/${username}`);
  }

  dohvatiOceneObjekta(objekatId: string,username: string) {
    let adresa = `${this.url}/objekti/${objekatId}/ocene`;
    if(username) {adresa += `?username=${encodeURIComponent(username)}`;}
    return this.http.get<PodaciOcenaObjekta>(adresa);
  }

  ostaviOcenuObjekta(objekatId: string,username: string,reakcija: ReakcijaObjekta,komentar: string) {
    return this.http.post<{message: string}>
    (`${this.url}/objekti/${objekatId}/ocene`,{username: username,reakcija: reakcija,komentar: komentar});
  }

  dohvatiPromocijeObjekta(objekatId: string) {
    return this.http.get<Promocija[]>(`${this.url}/objekti/${objekatId}/promocije`);
  }

  dohvatiStatistiku() {return this.http.get<PodaciStatistike>(`${this.url}/statistika`);}
}