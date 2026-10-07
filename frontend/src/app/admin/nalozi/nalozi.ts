import {CommonModule} from '@angular/common';
import {Component,ElementRef,inject,OnInit,ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AdminService,KorisnickiNalog,TipKorisnika} from '../../services/admin.service';
import {AdminHeader} from '../../shared/admin/header';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';

@Component({
  selector: 'app-admin-nalozi',
  standalone: true,
  imports: [CommonModule,FormsModule,AdminHeader,PublicFooter],
  templateUrl: './nalozi.html',
  styleUrl: './nalozi.css'
})
export class Nalozi implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  @ViewChild('sekcijaIzmene') sekcijaIzmene?: ElementRef<HTMLElement>;

  nalozi: KorisnickiNalog[] = [];
  prikazaniNalozi: KorisnickiNalog[] = [];
  izabraniNalog: KorisnickiNalog | null = null;
  originalnoKorisnickoIme = '';
  pretraga = '';
  izabraniTip = '';
  ucitavanje = true;
  cuvanje = false;
  brisanje = false;
  poruka = '';
  uspesnaPoruka = false;
  sportovi = ['Atletika','Badminton','Biciklizam','Borilački sportovi','Fudbal','Gimnastika','Košarka','Odbojka','Plivanje','Rukomet','Skijanje','Stoni tenis','Tenis','Vaterpolo','Fitnes'];

  ngOnInit(): void {
    const sacuvaniKorisnik = localStorage.getItem('currentUser');
    if(!sacuvaniKorisnik) {this.router.navigate(['/prijava']);return;}
    const korisnik = JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== 'administrator') {this.router.navigate(['/']);return;}
    this.ucitajNaloge();
  }

  ucitajNaloge(): void {
    this.ucitavanje = true;
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.adminService.dohvatiNaloge().subscribe({
      next: nalozi => {
        this.nalozi = nalozi.map(nalog => ({...nalog,sportovi: [...(nalog.sportovi || [])],objekti: [...(nalog.objekti || [])]}));
        this.filtrirajNaloge();
        this.ucitavanje = false;
      },
      error: greska => {
        this.nalozi = [];
        this.prikazaniNalozi = [];
        this.poruka = greska.error?.message || 'Naloge trenutno nije moguće učitati.';
        this.uspesnaPoruka = false;
        this.ucitavanje = false;
      }
    });
  }

  filtrirajNaloge(): void {
    const tekst = this.pretraga.trim().toLowerCase();
    this.prikazaniNalozi = this.nalozi.filter(nalog => {
      const odgovaraTip = !this.izabraniTip || nalog.tip === this.izabraniTip;
      const odgovaraPretraga = !tekst || nalog.username.toLowerCase().includes(tekst) || nalog.ime.toLowerCase().includes(tekst) || nalog.prezime.toLowerCase().includes(tekst) || nalog.imejl.toLowerCase().includes(tekst);
      return odgovaraTip && odgovaraPretraga;
    });
  }

  ponistiFiltere(): void {
    this.pretraga = '';
    this.izabraniTip = '';
    this.filtrirajNaloge();
  }

  izaberiNalog(nalog: KorisnickiNalog): void {
    this.izabraniNalog = {...nalog,sportovi: [...(nalog.sportovi || [])],objekti: [...(nalog.objekti || [])]};
    this.originalnoKorisnickoIme = nalog.username;
    this.poruka = '';
    this.uspesnaPoruka = false;
    setTimeout(() => {this.sekcijaIzmene?.nativeElement.scrollIntoView({behavior: 'smooth',block: 'start'});},100);
  }

  zatvoriIzmenu(): void {
    this.izabraniNalog = null;
    this.originalnoKorisnickoIme = '';
    this.poruka = '';
    this.uspesnaPoruka = false;
  }

  promeniSport(sport: string,dogadjaj: Event): void {
    if(!this.izabraniNalog) {return;}
    const input = dogadjaj.target as HTMLInputElement;
    if(input.checked) {
      if(this.izabraniNalog.sportovi.length >= 5) {
        this.poruka = 'Možete izabrati najviše pet sportova.';
        this.uspesnaPoruka = false;
        input.checked = false;
        return;
      }
      if(!this.izabraniNalog.sportovi.includes(sport)) {this.izabraniNalog.sportovi.push(sport);}
    } else {
      this.poruka = '';
      this.izabraniNalog.sportovi = this.izabraniNalog.sportovi.filter(izabraniSport => izabraniSport !== sport);
    }
  }

  sacuvajIzmene(): void {
    if(!this.izabraniNalog) {return;}
    this.poruka = '';
    this.uspesnaPoruka = false;
    const nalog = this.izabraniNalog;
    if(!nalog.username.trim() || !nalog.ime.trim() || !nalog.prezime.trim() || !nalog.telefon.trim() || !nalog.imejl.trim()) {this.poruka = 'Korisničko ime, ime, prezime, telefon i imejl su obavezni.';return;}
    if(!this.validnoIme(nalog.ime)) {this.poruka = 'Ime može sadržati samo slova.';return;}
    if(!this.validnoIme(nalog.prezime)) {this.poruka = 'Prezime može sadržati samo slova.';return;}
    if(!this.validanTelefon(nalog.telefon)) {this.poruka = 'Telefon mora sadržati od 8 do 15 cifara i može početi znakom +.';return;}
    if(!this.validanImejl(nalog.imejl)) {this.poruka = 'Imejl adresa nije ispravna.';return;}
    if(nalog.sportovi.length > 5) {this.poruka = 'Možete izabrati najviše pet sportova.';return;}
    if(nalog.tip === 'zaposleni' && (!nalog.adresaSedista?.trim() || !nalog.maticniBroj?.trim() || !nalog.pib?.trim())) {this.poruka = 'Adresa sedišta, matični broj i PIB su obavezni za zaposlenog.';return;}
    nalog.username = nalog.username.trim();
    nalog.ime = nalog.ime.trim();
    nalog.prezime = nalog.prezime.trim();
    nalog.telefon = nalog.telefon.trim();
    nalog.imejl = nalog.imejl.trim().toLowerCase();
    this.cuvanje = true;
    this.adminService.izmeniNalog(this.originalnoKorisnickoIme,nalog).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.cuvanje = false;
        this.izabraniNalog = null;
        this.originalnoKorisnickoIme = '';
        this.ucitajNaloge();
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Nalog trenutno nije moguće izmeniti.';
        this.uspesnaPoruka = false;
        this.cuvanje = false;
      }
    });
  }

  obrisiNalog(nalog: KorisnickiNalog): void {
    const potvrda = window.confirm(`Da li sigurno želite da obrišete nalog "${nalog.username}"?`);
    if(!potvrda) {return;}
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.brisanje = true;
    this.adminService.obrisiNalog(nalog.username).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.brisanje = false;
        if(this.originalnoKorisnickoIme === nalog.username) {this.zatvoriIzmenu();}
        this.ucitajNaloge();
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Nalog trenutno nije moguće obrisati.';
        this.uspesnaPoruka = false;
        this.brisanje = false;
      }
    });
  }

  nazivTipa(tip: TipKorisnika): string {
    if(tip === 'sportista') {return 'Sportista';}
    if(tip === 'zaposleni') {return 'Zaposleni';}
    return 'Administrator';
  }

  opisSportova(nalog: KorisnickiNalog): string {
    if(!nalog.sportovi.length) {return 'Nema izabranih sportova';}
    return nalog.sportovi.join(', ');
  }

  putanjaSlike(slika: string): string {
    if(!slika) {return '/default_avatar.jpg';}
    if(slika === 'default_avatar.jpg' || slika === '/default_avatar.jpg') {return '/default_avatar.jpg';}
    if(slika.startsWith('/') || slika.startsWith('http') || slika.startsWith('data:')) {return slika;}
    return `http://localhost:4000/images/${slika}`;
  }

  private validnoIme(vrednost: string): boolean {return /^[\p{L}\s'-]+$/u.test(vrednost.trim());}
  private validanTelefon(telefon: string): boolean {return /^\+?\d{8,15}$/.test(telefon.trim());}
  private validanImejl(imejl: string): boolean {return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(imejl.trim());}
}