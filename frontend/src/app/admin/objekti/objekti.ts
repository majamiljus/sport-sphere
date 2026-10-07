import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AdminService,ZahtevZaObjekat} from '../../services/admin.service';
import {AdminHeader} from '../../shared/admin/header';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';

@Component({
  selector: 'app-admin-objekti',
  standalone: true,
  imports: [CommonModule,FormsModule,AdminHeader,PublicFooter],
  templateUrl: './objekti.html',
  styleUrl: './objekti.css'
})
export class Objekti implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  objekti: ZahtevZaObjekat[] = [];
  prikazaniObjekti: ZahtevZaObjekat[] = [];
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
    this.ucitajObjekte();
  }

  ucitajObjekte(): void {
    this.ucitavanje = true;
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.adminService.dohvatiZahteveZaObjekte().subscribe({
      next: objekti => {
        this.objekti = objekti.map(objekat => ({...objekat,sportovi: [...(objekat.sportovi || [])],tipoviTerena: [...(objekat.tipoviTerena || [])],galerija: [...(objekat.galerija || [])],tereni: (objekat.tereni || []).map(teren => ({...teren}))}));
        this.popuniSportove();
        this.filtrirajObjekte();
        this.ucitavanje = false;
      },
      error: greska => {
        this.objekti = [];
        this.prikazaniObjekti = [];
        this.poruka = greska.error?.message || 'Zahteve za sportske objekte trenutno nije moguće učitati.';
        this.uspesnaPoruka = false;
        this.ucitavanje = false;
      }
    });
  }

  filtrirajObjekte(): void {
    const tekst = this.pretraga.trim().toLowerCase();
    this.prikazaniObjekti = this.objekti.filter(objekat => {
      const odgovaraSport = !this.izabraniSport || objekat.sportovi.includes(this.izabraniSport);
      const odgovaraPretraga = !tekst || objekat.naziv.toLowerCase().includes(tekst) || objekat.grad.toLowerCase().includes(tekst) || objekat.adresa.toLowerCase().includes(tekst) || objekat.sportovi.some(sport => sport.toLowerCase().includes(tekst)) || objekat.tereni.some(teren => teren.naziv.toLowerCase().includes(tekst) || teren.sport.toLowerCase().includes(tekst)) || this.odgovaraZaposleni(objekat,tekst);
      return odgovaraSport && odgovaraPretraga;
    });
  }

  ponistiFiltere(): void {
    this.pretraga = '';
    this.izabraniSport = '';
    this.filtrirajObjekte();
  }

  odobriObjekat(objekat: ZahtevZaObjekat): void {
    const potvrda = window.confirm(`Da li želite da odobrite objekat "${objekat.naziv}"?`);
    if(!potvrda) {return;}
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.obrada = true;
    this.adminService.odobriObjekat(objekat.id).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.obrada = false;
        this.ukloniObjekat(objekat.id);
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Objekat trenutno nije moguće odobriti.';
        this.uspesnaPoruka = false;
        this.obrada = false;
      }
    });
  }

  odbijObjekat(objekat: ZahtevZaObjekat): void {
    const potvrda = window.confirm(`Da li sigurno želite da odbijete i obrišete objekat "${objekat.naziv}"?`);
    if(!potvrda) {return;}
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.obrada = true;
    this.adminService.odbijObjekat(objekat.id).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.obrada = false;
        this.ukloniObjekat(objekat.id);
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Objekat trenutno nije moguće odbiti.';
        this.uspesnaPoruka = false;
        this.obrada = false;
      }
    });
  }

  opisSportova(objekat: ZahtevZaObjekat): string {
    if(!objekat.sportovi.length) {return 'Nema navedenih sportova';}
    return objekat.sportovi.join(', ');
  }

  opisTipovaTerena(objekat: ZahtevZaObjekat): string {
    if(!objekat.tipoviTerena.length) {return 'Nema unetih tipova terena';}
    return objekat.tipoviTerena.map(tip => tip === 'otvoreni' ? 'Otvoreni' : 'Zatvoreni').join(', ');
  }

  putanjaSlike(slika: string): string {
    if(!slika) {return '/facilities/default-facility.jpg';}
    if(slika.startsWith('http') || slika.startsWith('data:') || slika.startsWith('/')) {return slika;}
    return `http://localhost:4000/images/${slika}`;
  }

  private odgovaraZaposleni(objekat: ZahtevZaObjekat,tekst: string): boolean {
    if(!objekat.zaposleni) {return false;}
    return objekat.zaposleni.username.toLowerCase().includes(tekst) || objekat.zaposleni.ime.toLowerCase().includes(tekst) || objekat.zaposleni.prezime.toLowerCase().includes(tekst) || objekat.zaposleni.imejl.toLowerCase().includes(tekst);
  }

  private popuniSportove(): void {
    const sportovi: string[] = [];
    for(const objekat of this.objekti) {
      for(const sport of objekat.sportovi) {
        if(!sportovi.includes(sport)) {sportovi.push(sport);}
      }
    }
    this.dostupniSportovi = sportovi.sort((prvi,drugi) => prvi.localeCompare(drugi));
  }

  private ukloniObjekat(objekatId: string): void {
    this.objekti = this.objekti.filter(objekat => objekat.id !== objekatId);
    this.popuniSportove();
    this.filtrirajObjekte();
  }
}