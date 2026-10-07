import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TerminKalendara} from '../../models/sportista';
import {Objekat,Teren} from '../../models/objekti';
import {Promocija} from '../../models/neregistrovan';
import {SportistaService} from '../../services/sportista.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {SportistaHeader} from '../../shared/sportista/header';
import {DomSanitizer,SafeResourceUrl} from '@angular/platform-browser';
@Component({
  selector: 'app-rezervisi',
  standalone: true,
  imports: [CommonModule,FormsModule,SportistaHeader,PublicFooter],
  templateUrl: './rezervisi.html',
  styleUrl: './rezervisi.css'
})
export class Rezervisi implements OnInit {
  private readonly sportistaService = inject(SportistaService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  mapaUrl: SafeResourceUrl | null = null;
  korisnickoIme = '';
  sportovi = [
    'Atletika',
    'Badminton',
    'Biciklizam',
    'Borilački sportovi',
    'Fudbal',
    'Gimnastika',
    'Košarka',
    'Odbojka',
    'Plivanje',
    'Rukomet',
    'Skijanje',
    'Stoni tenis',
    'Tenis',
    'Vaterpolo',
    'Fitnes'
  ];
  objekti: Objekat[] = [];
  izabraniObjekat: Objekat | null = null;
  izabraniTeren: Teren | null = null;
  indeksTerena = 0;
  termini: TerminKalendara[] = [];
  promocije: Promocija[] = [];
  izabranaPromocijaId = '';
  ucitavanjePromocija = false;
  sati: number[] = [];
  pocetakNedelje = this.nadjiPonedeljak(new Date());
  dani: Date[] = [];
  izabraniPocetak: Date | null = null;
  krajIzabranogTermina: Date | null = null;
  ucitavanjePretrage = false;
  ucitavanjeTermina = false;
  cuvanje = false;
  naziv = '';
  grad = '';
  sport = '';
  tipTerena = '';
  samoSlobodniDanas = false;
  poruka = '';
  uspesnaPoruka = false;
  mozeDaRezervise = true;

  ngOnInit(): void {
    const sacuvaniKorisnik =
      localStorage.getItem('currentUser');

    if(!sacuvaniKorisnik) {
      this.router.navigate(['/prijava']);
      return;
    }
    const korisnik =JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== 'sportista') {
      this.router.navigate(['/']);
      return;
    }
    this.korisnickoIme = korisnik.username;
    this.osveziDane();
    this.pretrazi();
  }

  pretrazi(): void {
    this.ucitavanjePretrage = true;
    this.poruka = '';
    this.mozeDaRezervise = true;
    this.sportistaService.pretraziObjekte(this.naziv,this.grad,this.sport,this.tipTerena,this.samoSlobodniDanas).subscribe({
        next: objekti => {
          this.objekti = objekti;
          this.izabraniObjekat = null;
          this.izabraniTeren = null;
          this.izabraniPocetak = null;
          this.krajIzabranogTermina = null;
          this.indeksTerena = 0;
          this.termini = [];
          this.promocije = [];
          this.izabranaPromocijaId = '';
          this.sati = [];
          this.ucitavanjePretrage = false;
        },
        error: () => {
          this.poruka ='Objekte trenutno nije moguće učitati.';
          this.uspesnaPoruka = false;
          this.ucitavanjePretrage = false;
        }
      });
  }

  ponistiPretragu(): void {
    this.naziv = '';
    this.grad = '';
    this.sport = '';
    this.tipTerena = '';
    this.samoSlobodniDanas = false;
    this.pretrazi();
  }

  izaberiObjekat(objekat: Objekat): void {
    this.izabraniObjekat = objekat;
    this.indeksTerena = 0;
    this.izabraniTeren = objekat.tereni[0] || null;
    this.izabraniPocetak = null;
    this.krajIzabranogTermina = null;
    this.izabranaPromocijaId = '';
    this.termini = [];
    this.mozeDaRezervise = true;
    this.poruka = '';

    this.postaviMapu();
    this.osveziSate();
    this.ucitajPromocije();
    this.ucitajTermine();

    setTimeout(() => {
      document.getElementById('terenScroll')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    },0);
  }
  
  postaviMapu(): void {
    if(!this.izabraniObjekat) {
      this.mapaUrl = null;
      return;
    }
    const lokacija = encodeURIComponent(`${this.izabraniObjekat.adresa}, ${this.izabraniObjekat.grad}, Srbija`);
    const url =`https://www.google.com/maps?q=${lokacija}&output=embed`;
    this.mapaUrl =this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ucitajPromocije(): void {
    this.promocije = [];
    this.izabranaPromocijaId = '';
    if(!this.izabraniObjekat) {
      return;
    }
    this.ucitavanjePromocija = true;
    this.sportistaService.dohvatiPromocijeObjekta(this.izabraniObjekat.id).subscribe({
        next: promocije => {
          this.promocije = promocije;
          this.ucitavanjePromocija = false;
        },
        error: () => {
          this.promocije = [];
          this.ucitavanjePromocija = false;
        }
      });
  }

  dostupnePromocije(): Promocija[] {
    if(!this.izabraniTeren) {return [];}
    return this.promocije.filter(
      promocija => promocija.sport === null || promocija.sport === this.izabraniTeren?.sport
    );
  }

  izaberiPromociju(promocijaId: string): void {
    if(this.izabranaPromocijaId === promocijaId) {
      this.izabranaPromocijaId = '';
    } else {
      this.izabranaPromocijaId = promocijaId;
    }
  }

  promeniTeren(pomeraj: number): void {
    if(!this.izabraniObjekat) {
      return;
    }
    const brojTerena = this.izabraniObjekat.tereni.length;
    if(brojTerena === 0) {
      this.izabraniTeren = null;
      return;
    }
    this.indeksTerena =(this.indeksTerena + pomeraj + brojTerena) % brojTerena;
    this.izabraniTeren = this.izabraniObjekat.tereni[this.indeksTerena];
    this.izabraniPocetak = null;
    this.krajIzabranogTermina = null;
    this.izabranaPromocijaId = '';
    this.mozeDaRezervise = true;
    this.poruka = '';
    this.ucitajTermine();
  }

  promeniNedelju(pomeraj: number): void {
    const noviPocetak = new Date(this.pocetakNedelje);
    noviPocetak.setDate(noviPocetak.getDate() + pomeraj * 7);
    this.pocetakNedelje = noviPocetak;
    this.izabraniPocetak = null;
    this.krajIzabranogTermina = null;
    this.osveziDane();
    this.ucitajTermine();
  }
   
  ucitajTermine(): void {
    if(!this.izabraniObjekat ||!this.izabraniTeren) {
      return;
    }
    this.ucitavanjeTermina = true;
    this.poruka = '';
    const od = new Date(this.pocetakNedelje);
    od.setHours(0,0,0,0);
    const doDatuma = new Date(od);
    doDatuma.setDate(doDatuma.getDate() + 7);
    this.sportistaService.dohvatiTermine(this.izabraniObjekat.id,this.korisnickoIme,this.izabraniTeren.naziv,od.toISOString(),doDatuma.toISOString()).subscribe({
      next: odgovor => {
        this.termini = odgovor.termini;
        this.mozeDaRezervise = odgovor.mozeDaRezervise;
        if(!odgovor.mozeDaRezervise) {
          this.poruka = odgovor.poruka;
          this.uspesnaPoruka = false;
        }
        this.ucitavanjeTermina = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Termine trenutno nije moguće učitati.';
        this.uspesnaPoruka = false;
        this.ucitavanjeTermina = false;
      }
    });
  }

  statusCelije(dan: Date,sat: number): string {
    const pocetak = this.napraviPocetak(dan,sat);
    if(pocetak <= new Date()) {return 'prosao';}
    if(this.izabraniPocetak && this.izabraniPocetak.getTime() === pocetak.getTime()) {
      return 'izabran';
    }
    const kraj = new Date(pocetak.getTime() +60 * 60 * 1000);
    const zauzet = this.termini.some(termin =>
          new Date(termin.pocetak) < kraj &&
          new Date(termin.kraj) > pocetak
      );
    return zauzet ? 'zauzet' : 'slobodan';
  }

  tekstCelije(dan: Date,sat: number): string {
    const status = this.statusCelije(dan,sat);
    if(status === 'zauzet') {return 'Zauzeto';}
    if(status === 'izabran') {return 'Izabrano';}
    if(status === 'prosao') {return 'Prošlo';}
    return 'Slobodno';
  }

  izaberiTermin(dan: Date,sat: number): void {
    const status = this.statusCelije(dan,sat);
    if(status === 'zauzet' ||status === 'prosao' || !this.mozeDaRezervise) {
      return;
    }
    const pocetak = this.napraviPocetak(dan,sat);
    if(this.izabraniPocetak && this.izabraniPocetak.getTime() === pocetak.getTime()) {
      this.izabraniPocetak = null;
      this.krajIzabranogTermina = null;
      return;
    }
    this.izabraniPocetak = pocetak;
    this.krajIzabranogTermina = new Date(pocetak.getTime() + 60 * 60 * 1000);
  }

  rezervisi(): void {
    if(!this.izabraniObjekat || !this.izabraniTeren || !this.izabraniPocetak || !this.mozeDaRezervise) {
      return;
    }
    this.cuvanje = true;
    this.poruka = '';
    this.sportistaService.napraviRezervaciju(this.korisnickoIme,this.izabraniObjekat.id,this.izabraniTeren.naziv,this.izabraniPocetak.toISOString(),this.izabranaPromocijaId).subscribe({
        next: odgovor => {
          this.poruka = odgovor.message;
          this.uspesnaPoruka = true;
          this.cuvanje = false;
          this.izabraniPocetak = null;
          this.krajIzabranogTermina = null;
          this.izabranaPromocijaId = '';
          this.ucitajTermine();
        },
        error: greska => {
          this.poruka = greska.error?.message || 'Rezervaciju nije moguće napraviti.';
          this.uspesnaPoruka = false;
          this.cuvanje = false;
          this.izabraniPocetak = null;
          this.krajIzabranogTermina = null;
          this.ucitajTermine();
        }
      });
  }
// pomocne za html i formatiranje
  izabranaPromocija(): Promocija | undefined {
    return this.dostupnePromocije().find(promocija => promocija.id === this.izabranaPromocijaId);
  }
  cenaTermina(): number {
    if(!this.izabraniTeren) {return 0;}
    let cena = this.izabraniTeren.cenaPoSatu;
    const promocija = this.izabranaPromocija();
    if(!promocija) {return cena;}
    if(promocija.tipPopusta === 'procenat') {
      cena = cena - cena * promocija.vrednostPopusta / 100;
    } else {
      cena = cena - promocija.vrednostPopusta;
    }

    return Math.max(0,Math.round(cena));
  }
  tekstPopusta(promocija: Promocija): string {
    if(promocija.tipPopusta === 'procenat') {
      return `${promocija.vrednostPopusta}% popusta`;
    }
    return `${promocija.vrednostPopusta} RSD popusta`;
  }
  osveziDane(): void {
    this.dani = [];
    for(let indeks = 0;indeks < 7;indeks++) {
      const dan = new Date(this.pocetakNedelje);
      dan.setDate(dan.getDate() + indeks);
      this.dani.push(dan);
    }
  }
  osveziSate(): void {
    this.sati = [];
    if(!this.izabraniObjekat) {
      return;
    }
    const pocetniSat = Number(this.izabraniObjekat.radnoVremeOd.split(':')[0]);
    let krajnjiSat = Number(this.izabraniObjekat.radnoVremeDo.split(':')[0]);
    if(this.izabraniObjekat.radnoVremeDo === '00:00') {
      krajnjiSat = 24;
    }
    for(let sat = pocetniSat; sat < krajnjiSat; sat++) {
      this.sati.push(sat);
    }
  }
  tekstTermina(sat: number): string {
    const sledeciSat = (sat + 1) % 24;
    const pocetak =String(sat).padStart(2,'0');
    const kraj = String(sledeciSat).padStart(2,'0');
    return `${pocetak}:00 – ${kraj}:00`;
  }
  nazivDana(dan: Date): string {
    const naziv =['NED','PON','UTO','SRE','ČET','PET','SUB'];
    return naziv[dan.getDay()];
  }
  datumDana(dan: Date): string {
    return dan.toLocaleDateString('sr-RS',{day: '2-digit',month: '2-digit'});
  }
  rasponNedelje(): string {
    const poslednjiDan = this.dani[this.dani.length - 1];
    if(!poslednjiDan) {return '';}
    return this.pocetakNedelje .toLocaleDateString('sr-RS') + ' – ' + poslednjiDan .toLocaleDateString('sr-RS');
  }
  sportoviObjekta(objekat: Objekat): string {
    return objekat.sportovi.join(', ');
  }
  putanjaSlike(slika: string): string {
    if(!slika) {return '/logo.png';}
    if(
      slika.startsWith('/') ||
      slika.startsWith('http')
    ) {
      return slika;
    }
    return `http://localhost:4000/images/${slika}`;
  }
  private napraviPocetak(dan: Date,sat: number): Date {
    const pocetak =new Date(dan);
    pocetak.setHours(sat,0,0,0);
    return pocetak;
  }
  private nadjiPonedeljak(datum: Date): Date {
    const ponedeljak = new Date(datum);
    const dan = ponedeljak.getDay();
    const pomeraj = dan === 0 ? -6 : 1 - dan;
    ponedeljak.setDate(ponedeljak.getDate() + pomeraj);
    ponedeljak.setHours(0,0,0,0);
    return ponedeljak;
  }
  
  // ---
}