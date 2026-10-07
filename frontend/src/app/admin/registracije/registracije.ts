import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AdminService,KorisnickiNalog,TipKorisnika} from '../../services/admin.service';
import {AdminHeader} from '../../shared/admin/header';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';

@Component({
  selector: 'app-admin-registracije',
  standalone: true,
  imports: [CommonModule,FormsModule,AdminHeader,PublicFooter],
  templateUrl: './registracije.html',
  styleUrl: './registracije.css'
})
export class Registracije implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  zahtevi: KorisnickiNalog[] = [];
  prikazaniZahtevi: KorisnickiNalog[] = [];
  pretraga = '';
  izabraniTip = '';
  ucitavanje = true;
  obrada = false;
  poruka = '';
  uspesnaPoruka = false;

  ngOnInit(): void {
    const sacuvaniKorisnik = localStorage.getItem('currentUser');
    if(!sacuvaniKorisnik) {this.router.navigate(['/prijava']);return;}
    const korisnik = JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== 'administrator') {this.router.navigate(['/']);return;}
    this.ucitajZahteve();
  }

  ucitajZahteve(): void {
    this.ucitavanje = true;
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.adminService.dohvatiZahteveZaRegistraciju().subscribe({
      next: zahtevi => {
        this.zahtevi = zahtevi.map(zahtev => ({...zahtev,sportovi: [...(zahtev.sportovi || [])],objekti: [...(zahtev.objekti || [])]}));
        this.filtrirajZahteve();
        this.ucitavanje = false;
      },
      error: greska => {
        this.zahtevi = [];
        this.prikazaniZahtevi = [];
        this.poruka = greska.error?.message || 'Zahteve za registraciju trenutno nije moguće učitati.';
        this.uspesnaPoruka = false;
        this.ucitavanje = false;
      }
    });
  }

  filtrirajZahteve(): void {
    const tekst = this.pretraga.trim().toLowerCase();
    this.prikazaniZahtevi = this.zahtevi.filter(zahtev => {
      const odgovaraTip = !this.izabraniTip || zahtev.tip === this.izabraniTip;
      const odgovaraPretraga = !tekst || zahtev.username.toLowerCase().includes(tekst) || zahtev.ime.toLowerCase().includes(tekst) || zahtev.prezime.toLowerCase().includes(tekst) || zahtev.imejl.toLowerCase().includes(tekst);
      return odgovaraTip && odgovaraPretraga;
    });
  }

  ponistiFiltere(): void {
    this.pretraga = '';
    this.izabraniTip = '';
    this.filtrirajZahteve();
  }

  odobriZahtev(zahtev: KorisnickiNalog): void {
    const potvrda = window.confirm(`Da li želite da odobrite registraciju korisnika "${zahtev.username}"?`);
    if(!potvrda) {return;}
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.obrada = true;
    this.adminService.odobriZahtevZaRegistraciju(zahtev.username).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.obrada = false;
        this.ukloniZahtevIzPrikaza(zahtev.username);
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Zahtev trenutno nije moguće odobriti.';
        this.uspesnaPoruka = false;
        this.obrada = false;
      }
    });
  }

  odbijZahtev(zahtev: KorisnickiNalog): void {
    const potvrda = window.confirm(`Da li sigurno želite da odbijete zahtev korisnika "${zahtev.username}"?`);
    if(!potvrda) {return;}
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.obrada = true;
    this.adminService.odbijZahtevZaRegistraciju(zahtev.username).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.obrada = false;
        this.ukloniZahtevIzPrikaza(zahtev.username);
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Zahtev trenutno nije moguće odbiti.';
        this.uspesnaPoruka = false;
        this.obrada = false;
      }
    });
  }

  nazivTipa(tip: TipKorisnika): string {
    if(tip === 'sportista') {return 'Sportista';}
    if(tip === 'zaposleni') {return 'Zaposleni';}
    return 'Administrator';
  }

  opisSportova(zahtev: KorisnickiNalog): string {
    if(!zahtev.sportovi.length) {return 'Nema izabranih sportova';}
    return zahtev.sportovi.join(', ');
  }

  putanjaSlike(slika: string): string {
    if(!slika) {return '/default_avatar.jpg';}
    if(slika === 'default_avatar.jpg' || slika === '/default_avatar.jpg') {return '/default_avatar.jpg';}
    if(slika.startsWith('/') || slika.startsWith('http') || slika.startsWith('data:')) {return slika;}
    return `http://localhost:4000/images/${slika}`;
  }

  private ukloniZahtevIzPrikaza(korisnickoIme: string): void {
    this.zahtevi = this.zahtevi.filter(zahtev => zahtev.username !== korisnickoIme);
    this.filtrirajZahteve();
  }
}