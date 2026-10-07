import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AdminService,TrenerZaAdmin} from '../../services/admin.service';
import {AdminHeader} from '../../shared/admin/header';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';

@Component({
  selector: 'app-admin-treneri',
  standalone: true,
  imports: [CommonModule,FormsModule,AdminHeader,PublicFooter],
  templateUrl: './treneri.html',
  styleUrl: './treneri.css'
})
export class Treneri implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  treneri: TrenerZaAdmin[] = [];
  prikazaniTreneri: TrenerZaAdmin[] = [];
  dostupniSportovi: string[] = [];
  pretraga = '';
  izabraniSport = '';
  ucitavanje = true;
  obrada = false;
  poruka = '';
  uspesnaPoruka = false;

  ngOnInit(): void {
    const sacuvaniKorisnik = localStorage.getItem('currentUser');
    if(!sacuvaniKorisnik) {this.router.navigate(['/prijava']);return;}
    const korisnik = JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== 'administrator') {this.router.navigate(['/']);return;}
    this.ucitajTrenere();
  }

  ucitajTrenere(): void {
    this.ucitavanje = true;
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.adminService.dohvatiTrenere().subscribe({
      next: treneri => {
        this.treneri = treneri;
        this.popuniSportove();
        this.filtrirajTrenere();
        this.ucitavanje = false;
      },
      error: greska => {
        this.treneri = [];
        this.prikazaniTreneri = [];
        this.poruka = greska.error?.message || 'Trenere trenutno nije moguće učitati.';
        this.uspesnaPoruka = false;
        this.ucitavanje = false;
      }
    });
  }

  filtrirajTrenere(): void {
    const tekst = this.pretraga.trim().toLowerCase();
    this.prikazaniTreneri = this.treneri.filter(trener => {
      const odgovaraSport = !this.izabraniSport || trener.sport === this.izabraniSport;
      const odgovaraPretraga = !tekst || trener.ime.toLowerCase().includes(tekst) || trener.prezime.toLowerCase().includes(tekst) || `${trener.ime} ${trener.prezime}`.toLowerCase().includes(tekst) || trener.sport.toLowerCase().includes(tekst) || trener.specijalizacija.toLowerCase().includes(tekst) || trener.nazivObjekta.toLowerCase().includes(tekst);
      return odgovaraSport && odgovaraPretraga;
    });
  }

  ponistiFiltere(): void {
    this.pretraga = '';
    this.izabraniSport = '';
    this.filtrirajTrenere();
  }

  deaktivirajTrenera(trener: TrenerZaAdmin): void {
    const potvrda = window.confirm(`Da li sigurno želite da deaktivirate trenera "${trener.ime} ${trener.prezime}"? Svi njegovi zakazani treninzi biće obrisani.`);
    if(!potvrda) {return;}
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.obrada = true;
    this.adminService.deaktivirajTrenera(trener.id).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.obrada = false;
        this.ukloniTrenera(trener.id);
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Trenera trenutno nije moguće deaktivirati.';
        this.uspesnaPoruka = false;
        this.obrada = false;
      }
    });
  }

  prikaziOcenu(ocena: number): string {return ocena.toFixed(1);}
  prikaziCenu(cena: number): string {return `${cena} RSD/h`;}

  private popuniSportove(): void {
    const sportovi: string[] = [];
    for(const trener of this.treneri) {
      if(!sportovi.includes(trener.sport)) {sportovi.push(trener.sport);}
    }
    this.dostupniSportovi = sportovi.sort((prvi,drugi) => prvi.localeCompare(drugi));
  }

  private ukloniTrenera(trenerId: string): void {
    this.treneri = this.treneri.filter(trener => trener.id !== trenerId);
    this.popuniSportove();
    this.filtrirajTrenere();
  }
}