import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {PodaciPocetneStranice,PoljeSortiranja,Promocija,SmerSortiranja,TipTerena} from '../models/neregistrovan';
import {Objekat} from '../models/objekti';
import {NeregistrovanService} from '../services/index.service';
import {PublicFooter} from '../shared/neregistrovan/footer/footer';
import {PublicHeader} from '../shared/neregistrovan/header/header';

@Component({
  selector: 'app-public-home',
  imports: [CommonModule,FormsModule,RouterLink,PublicHeader,PublicFooter],
  templateUrl: './index.html',
  styleUrl: './index.css'
})
export class PublicHome implements OnInit {
  private readonly neregistrovanService = inject(NeregistrovanService);

  podaciPocetneStranice: PodaciPocetneStranice | null = null;
  sviObjekti: Objekat[] = [];
  objekti: Objekat[] = [];
  ucitavanjePocetneStranice = true;
  ucitavanjePretrage = true;
  porukaGreske = '';
  pretraga = {
    naziv: '',
    gradovi: [] as string[],
    sport: '',
    tipTerena: '' as '' | TipTerena,
    poljeSortiranja: 'naziv' as PoljeSortiranja,
    smerSortiranja: 'rastuce' as SmerSortiranja
  };

  ngOnInit(): void {
    localStorage.removeItem('currentUser');
    this.ucitajPocetnuStranicu();
    this.ucitajObjekte();
  }

  promeniGrad(grad: string,dogadjaj: Event): void {
    const oznaceno = (dogadjaj.target as HTMLInputElement).checked;
    if(oznaceno) {
      if(!this.pretraga.gradovi.includes(grad)) {this.pretraga.gradovi.push(grad);}
    } else {
      this.pretraga.gradovi = this.pretraga.gradovi.filter(izabraniGrad => izabraniGrad !== grad);
    }
    this.primeniPretragu();
  }

  ucitajPocetnuStranicu(): void {
    this.neregistrovanService.dohvatiPodatkePocetneStranice().subscribe({
      next: podaci => {
        this.podaciPocetneStranice = podaci;
        this.ucitavanjePocetneStranice = false;
      },
      error: () => {
        this.porukaGreske = 'Podatke početne stranice trenutno nije moguće učitati.';
        this.ucitavanjePocetneStranice = false;
      }
    });
  }

  ucitajObjekte(): void {
    this.ucitavanjePretrage = true;
    this.porukaGreske = '';
    this.neregistrovanService.dohvatiObjekte().subscribe({
      next: objekti => {
        this.sviObjekti = objekti;
        this.primeniPretragu();
        this.ucitavanjePretrage = false;
      },
      error: () => {
        this.porukaGreske = 'Objekte trenutno nije moguće učitati.';
        this.ucitavanjePretrage = false;
      }
    });
  }

  primeniPretragu(): void {
    const naziv = this.pretraga.naziv.trim().toLowerCase();
    this.objekti = this.sviObjekti.filter(objekat => {
      const nazivFilter = !naziv || objekat.naziv.toLowerCase().includes(naziv);
      const gradFilter = !this.pretraga.gradovi.length || this.pretraga.gradovi.includes(objekat.grad);
      const sportFilter = !this.pretraga.sport || objekat.sportovi.includes(this.pretraga.sport);
      const terenFilter = !this.pretraga.tipTerena || objekat.tipoviTerena.includes(this.pretraga.tipTerena);
      return nazivFilter && gradFilter && sportFilter && terenFilter;
    });
    this.sortirajObjekte();
  }

  ponistiPretragu(): void {
    this.pretraga = {
      naziv: '',
      gradovi: [],
      sport: '',
      tipTerena: '',
      poljeSortiranja: 'naziv',
      smerSortiranja: 'rastuce'
    };
    this.primeniPretragu();
  }

  sortirajPo(polje: PoljeSortiranja): void {
    if(this.pretraga.poljeSortiranja === polje) {
      this.pretraga.smerSortiranja = this.pretraga.smerSortiranja === 'rastuce' ? 'opadajuce' : 'rastuce';
    } else {
      this.pretraga.poljeSortiranja = polje;
      this.pretraga.smerSortiranja = 'rastuce';
    }
    this.sortirajObjekte();
  }

  sortirajObjekte(): void {
    const smer = this.pretraga.smerSortiranja === 'rastuce' ? 1 : -1;
    const polje = this.pretraga.poljeSortiranja;
    this.objekti = [...this.objekti].sort((prvi,drugi) => {
      let prvaVrednost: string;
      let drugaVrednost: string;
      if(polje === 'grad') {
        prvaVrednost = prvi.grad;
        drugaVrednost = drugi.grad;
      } else if(polje === 'sport') {
        prvaVrednost = prvi.sportovi[0] ?? '';
        drugaVrednost = drugi.sportovi[0] ?? '';
      } else {
        prvaVrednost = prvi.naziv;
        drugaVrednost = drugi.naziv;
      }
      return prvaVrednost.localeCompare(drugaVrednost,'sr',{sensitivity: 'base'}) * smer;
    });
  }

  ikonicaSortiranja(polje: PoljeSortiranja): string {
    if(this.pretraga.poljeSortiranja !== polje) {return '↕';}
    return this.pretraga.smerSortiranja === 'rastuce' ? '↑' : '↓';
  }

  tekstPopusta(promocija: Promocija): string {
    if(promocija.tipPopusta === 'procenat') {return `${promocija.vrednostPopusta}%`;}
    return `${promocija.vrednostPopusta.toLocaleString('sr-RS')} RSD`;
  }

  formatirajDatum(vrednost: string): string {
    return new Date(vrednost).toLocaleDateString('sr-RS');
  }
}