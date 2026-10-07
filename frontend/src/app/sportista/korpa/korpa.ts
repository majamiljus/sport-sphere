import {Component,inject,OnInit} from '@angular/core';
import {Router,RouterLink} from '@angular/router';
import {StavkaKorpe} from '../../models/prodavnica';
import {SportistaService} from '../../services/sportista.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {SportistaHeader} from '../../shared/sportista/header';

@Component({
  selector: 'app-korpa',
  imports: [RouterLink,SportistaHeader,PublicFooter],
  templateUrl: './korpa.html',
  styleUrl: './korpa.css'
})
export class KorpaComponent implements OnInit {
  private readonly sportistaService = inject(SportistaService);
  private readonly router = inject(Router);
  korpa: StavkaKorpe[] = [];
  username = '';
  narucivanje = false;
  poruka = '';
  greska = '';
  ngOnInit(): void {
    const sacuvaniKorisnik = localStorage.getItem('currentUser');
    if(!sacuvaniKorisnik) {
      this.router.navigate(['/prijava']);
      return;
    }
    const korisnik = JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== 'sportista') {
      this.router.navigate(['/']);
      return;
    }
    this.username = korisnik.username;
    this.ucitajKorpu();
  }

  ucitajKorpu(): void {
    const sacuvanaKorpa = localStorage.getItem('korpa');
    if(!sacuvanaKorpa) {
      this.korpa = [];
      return;
    }
    this.korpa = JSON.parse(sacuvanaKorpa);
  }

  povecajKolicinu(stavka: StavkaKorpe): void {
    this.poruka = '';
    this.greska = '';
    if(stavka.kolicina >= stavka.stanje) {
      this.greska = 'Nije moguće izabrati veću količinu od dostupnog stanja.';
      return;
    }
    stavka.kolicina++;
    localStorage.setItem('korpa',JSON.stringify(this.korpa));
  }

  smanjiKolicinu(stavka: StavkaKorpe): void {
    this.poruka = '';
    this.greska = '';
    if(stavka.kolicina === 1) {
      this.ukloniIzKorpe(stavka);
      return;
    }
    stavka.kolicina--;
    localStorage.setItem('korpa',JSON.stringify(this.korpa));
  }

  ukloniIzKorpe(stavka: StavkaKorpe): void {
    this.poruka = '';
    this.greska = '';
    this.korpa = this.korpa.filter(st => st.opremaId !== stavka.opremaId);
    localStorage.setItem('korpa',JSON.stringify(this.korpa));
  }

  isprazniKorpu(): void {
    const potvrda = window.confirm('Da li sigurno želite da ispraznite korpu?');
    if(!potvrda) {
      return;
    }
    this.korpa = [];
    localStorage.removeItem('korpa');
    this.poruka = 'Korpa je ispražnjena.';
    this.greska = '';
  }

  ukupanBrojProizvoda(): number {
    let ukupno = 0;
    for(const stavka of this.korpa) {
      ukupno += stavka.kolicina;
    }
    return ukupno;
  }

  ukupnaCena(): number {
    let ukupno = 0;
    for(const stavka of this.korpa) {
      ukupno += stavka.cena * stavka.kolicina;
    }
    return ukupno;
  }

  naruci(): void {
    this.poruka = '';
    this.greska = '';
    if(this.korpa.length === 0) {
      this.greska = 'Korpa je prazna.';
      return;
    }
    if(!this.username) {
      this.greska = 'Korisničko ime nije pronađeno.';
      return;
    }
    this.narucivanje = true;
    this.sportistaService.kreirajPorudzbinu(this.username,this.korpa).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.narucivanje = false;
        this.korpa = [];
        localStorage.removeItem('korpa');
      },
      error: greska => {
        this.greska = greska.error?.message || 'Porudžbinu nije moguće kreirati.';
        this.narucivanje = false;
      }
    });
  }

  putanjaSlike(slika: string): string {
    if(!slika) {return '/default_product.jpg';}
    if(slika.startsWith('/') || slika.startsWith('http')) {return slika;}
    return `/oprema/${slika}`;
  }

  formatirajCenu(cena: number): string {
    return cena.toLocaleString("en-US").replaceAll(","," ");
  }
  
  ukupanBrojKomada(): number {
    let ukupno = 0;

    for(const stavka of this.korpa) {
      ukupno += stavka.kolicina;
    }

    return ukupno;
  }
}