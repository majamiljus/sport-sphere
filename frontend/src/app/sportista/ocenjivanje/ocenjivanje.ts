import {CommonModule} from '@angular/common';
import {Component,ElementRef,inject,OnInit,ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router,RouterLink} from '@angular/router';
import {ObjekatZaOcenjivanje,PodaciOcenaObjekta,ReakcijaObjekta} from '../../models/ocena';
import {SportistaService} from '../../services/sportista.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {SportistaHeader} from '../../shared/sportista/header';

@Component({
  selector: 'app-ocenjivanje',
  imports: [CommonModule,FormsModule,RouterLink,SportistaHeader,PublicFooter],
  templateUrl: './ocenjivanje.html',
  styleUrl: './ocenjivanje.css'
})
export class OcenjivanjeComponent implements OnInit {
  private readonly sportistaService =inject(SportistaService);
  private readonly router = inject(Router);

  @ViewChild('formaOcene')
  formaOcene?: ElementRef<HTMLElement>;

  username = '';
  objekti: ObjekatZaOcenjivanje[] = [];
  izabraniObjekat: ObjekatZaOcenjivanje | null =null;
  podaciOcena: PodaciOcenaObjekta | null = null;
  reakcija: ReakcijaObjekta | '' = '';
  komentar = '';
  ucitavanje = true;
  ucitavanjeOcena = false;
  slanje = false;
  poruka = '';
  uspesnaPoruka = false;

  ngOnInit(): void {
    const sacuvaniKorisnik =localStorage.getItem('currentUser');
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
    this.ucitajObjekte();
  }

  ucitajObjekte(): void {
    this.ucitavanje = true;
    this.sportistaService.dohvatiObjekteZaOcenjivanje(this.username).subscribe({
        next: objekti => {
          this.objekti = objekti;
          this.ucitavanje = false;
        },
        error: greska => {
          this.poruka = greska.error?.message || 'Objekte za ocenjivanje nije moguće učitati.';
          this.uspesnaPoruka = false;
          this.ucitavanje = false;
        }
      });
  }

  izaberiObjekat(objekat: ObjekatZaOcenjivanje): void {
    this.izabraniObjekat = objekat;
    this.podaciOcena = null;
    this.reakcija = '';
    this.komentar = '';
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.ucitajOceneObjekta();
    setTimeout(() => {
      this.formaOcene?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    },100);
  }

  ucitajOceneObjekta(): void {
    if(!this.izabraniObjekat) {
      return;
    }
    this.ucitavanjeOcena = true;
    this.sportistaService.dohvatiOceneObjekta(this.izabraniObjekat.id,this.username).subscribe({
      next: podaci => {
        this.podaciOcena = podaci;
        this.ucitavanjeOcena = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Ocene i komentare nije moguće učitati.';
        this.uspesnaPoruka = false;
        this.ucitavanjeOcena = false;
      }
    });
  }

  zatvoriFormu(): void {
    this.izabraniObjekat = null;
    this.podaciOcena = null;
    this.reakcija = '';
    this.komentar = '';
  }

  izaberiReakciju(reakcija: ReakcijaObjekta): void {
    this.reakcija = reakcija;
    this.poruka = '';
  }

  posaljiOcenu(): void {
    this.poruka = '';
    this.uspesnaPoruka = false;
    if(!this.izabraniObjekat) {
      this.poruka = 'Izaberite objekat.';
      return;
    }
    if(!this.reakcija) {
      this.poruka = 'Izaberite sviđanje ili nesviđanje.';
      return;
    }
    const tekstKomentara = this.komentar.trim();

    if(tekstKomentara.length > 500) {
      this.poruka ='Komentar može imati najviše 500 karaktera.';
      return;
    }
    this.slanje = true;
    this.sportistaService.ostaviOcenuObjekta(this.izabraniObjekat.id,this.username,this.reakcija,tekstKomentara).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.uspesnaPoruka = true;
        this.slanje = false;
        this.reakcija = '';
        this.komentar = '';
        this.ucitajOceneObjekta();
        this.ucitajObjekte();
      },
      error: greska => {
        this.poruka = greska.error?.message ||'Ocenu nije moguće sačuvati.';
        this.uspesnaPoruka = false;
        this.slanje = false;
      }
    });
  }

  nazivReakcije(reakcija: ReakcijaObjekta): string {
    if(reakcija === 'svidjanje') {return '♥ Sviđa mi se';}
    return '♡ Ne sviđa mi se';
  }

  putanjaSlike(slika: string): string {
    if(!slika) {return '/facilities/default-facility.jpg';}
    if(slika.startsWith('/') || slika.startsWith('http')) {return slika;}
    return `/facilities/${slika}`;
  }
}