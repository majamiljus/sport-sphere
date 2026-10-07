import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Oprema,StavkaKorpe} from '../../models/prodavnica';
import {SportistaService} from '../../services/sportista.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {SportistaHeader} from '../../shared/sportista/header';

@Component({
  selector: 'app-prodavnica',
  imports: [FormsModule,SportistaHeader,PublicFooter],
  templateUrl: './prodavnica.html',
  styleUrl: './prodavnica.css'
})
export class ProdavnicaComponent implements OnInit {
  private readonly sportistaService = inject(SportistaService);
  private readonly router = inject(Router);

  oprema: Oprema[] = [];
  izabraniSport = '';
  ucitavanje = false;
  poruka = '';
  greska = '';
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
    this.ucitajOpremu();
  }

  ucitajOpremu(): void {
    this.ucitavanje = true;
    this.poruka = '';
    this.greska = '';
    this.sportistaService.dohvatiOpremu(this.izabraniSport).subscribe({
      next: oprema => {
        this.oprema = oprema;
        this.ucitavanje = false;
      },
      error: greska => {
        this.greska = greska.error?.message || 'Nije moguće učitati opremu.';
        this.ucitavanje = false;
      }
    });
  }

  dodajUKorpu(proizvod: Oprema): void {
    this.poruka = '';
    this.greska = '';

    let korpa: StavkaKorpe[] = [];
    const sacuvanaKorpa = localStorage.getItem('korpa');

    if(sacuvanaKorpa) {
      korpa = JSON.parse(sacuvanaKorpa);
    }

    const postojecaStavka = korpa.find(
      stavka => stavka.opremaId === proizvod.id
    );

    if(postojecaStavka) {
      if(postojecaStavka.kolicina >= proizvod.stanje) {
        this.greska =
          'Nije moguće dodati veću količinu od dostupnog stanja.';
        return;
      }

      postojecaStavka.kolicina++;
      postojecaStavka.stanje = proizvod.stanje;
      postojecaStavka.cena = proizvod.cena;
    } else {
      if(proizvod.stanje <= 0) {
        this.greska = 'Proizvod trenutno nije na stanju.';
        return;
      }

      korpa.push({
        opremaId: proizvod.id,
        naziv: proizvod.naziv,
        sport: proizvod.sport,
        slika: proizvod.slika,
        cena: proizvod.cena,
        kolicina: 1,
        stanje: proizvod.stanje
      });
    }

    localStorage.setItem(
      'korpa',
      JSON.stringify(korpa)
    );

    this.poruka = 'Proizvod je dodat u korpu.';
  }

  putanjaSlike(slika: string): string {
    if(!slika) {return '/default_product.jpg';}
    if(slika.startsWith('/') || slika.startsWith('http')) {return slika;}
    return `/oprema/${slika}`;
  }
  formatirajCenu(cena: number): string {
    return cena.toLocaleString("en-US").replaceAll(","," ");
  }
}