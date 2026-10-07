import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Objekat,Teren} from '../../models/objekti';
import {ZaposleniService} from '../../services/zaposleni.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {ZaposleniHeader} from '../../shared/zaposleni/header';
@Component({
  selector: 'app-objekti-zaposlenog',
  imports: [CommonModule,FormsModule,ZaposleniHeader,PublicFooter],
  templateUrl: './objekti.html',
  styleUrl: './objekti.css'
})
export class ObjektiZaposlenog implements OnInit {
  private readonly zaposleniService = inject(ZaposleniService);
  private readonly router = inject(Router);
  username = '';
  objekti: Objekat[] = [];
  objekat: Objekat = this.prazanObjekat();
  jsonFajl: File | null = null;
  loading = true;
  cuvanje = false;
  poruka = '';
  uspesnaPoruka = false;
  radniSati = ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];
  zavrsniRadniSati = ['01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00'];
  sportovi = ['Atletika','Badminton','Biciklizam','Borilački sportovi','Fudbal','Gimnastika','Košarka','Odbojka','Padel','Plivanje','Rukomet','Skijanje','Stoni tenis','Tenis','Vaterpolo','Fitnes'];
  ngOnInit(): void {
    const sacuvaniKorisnik = localStorage.getItem('currentUser');
    if(!sacuvaniKorisnik) {
      this.router.navigate(['/prijava']);
      return;
    }
    const korisnik = JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== 'zaposleni') {
      this.router.navigate(['/']);
      return;
    }
    this.username = korisnik.username;
    this.ucitajObjekte();
  }
  ucitajObjekte(): void {
    this.loading = true;
    this.zaposleniService.dohvatiProfil(this.username).subscribe({
      next: podaci => {
        this.objekti = podaci.objekti;
        this.loading = false;
      },
      error: greska => {
        this.postaviGresku(greska.error?.message ||
          'Objekte trenutno nije moguće učitati.');
        this.loading = false;
      }
    });
  }
  dodajTeren(): void {
    const teren: Teren = { naziv: '',tip: 'otvoreni',sport: '',kapacitet: 4,cenaPoSatu: 0,opisOpreme: '' };
    this.objekat.tereni.push(teren);
  }
  ukloniTeren(indeks: number): void {
    this.objekat.tereni.splice(indeks,1);
  }
  promeniPocetakRadnogVremena(): void {
    const pocetak = this.vremeUMinute(this.objekat.radnoVremeOd);
    const kraj = this.vremeKrajaUMinute(this.objekat.radnoVremeDo);
    if(kraj <= pocetak) {
      const pocetniSat = Number(this.objekat.radnoVremeOd.split(':')[0]);
      const sledeciSat = pocetniSat + 1;
      this.objekat.radnoVremeDo = sledeciSat >= 24 ? '00:00': `${String(sledeciSat).padStart(2, '0')}:00`;
    }
  }
  izaberiZaAzuriranje(objekat: Objekat): void {
    this.objekat = structuredClone(objekat);
    this.poruka = '';
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  ponistiAzuriranje(): void {
    this.objekat = this.prazanObjekat();
    this.poruka = '';
    this.uspesnaPoruka = false;
  }
  sacuvajObjekat(): void {
    const greska = this.validirajObjekat();
    if(greska) {
      this.postaviGresku(greska);
      return;
    }
    const azuriranje = Boolean(this.objekat.id);
    this.cuvanje = true;
    this.poruka = '';
    const zahtev = azuriranje ? this.zaposleniService.azurirajObjekat(this.username,this.objekat): this.zaposleniService.dodajObjekat(this.username,this.objekat);
    zahtev.subscribe({
      next: sacuvaniObjekat => {
        if(azuriranje) {
          const indeks = this.objekti.findIndex(objekat => objekat.id === sacuvaniObjekat.id);
          if(indeks !== -1) {
            this.objekti[indeks] = sacuvaniObjekat;
          }
        }
        else {
          this.objekti.push(sacuvaniObjekat);
        }
        this.objekat = this.prazanObjekat();
        this.uspesnaPoruka = true;
        this.poruka = azuriranje ? 'Objekat je uspešno ažuriran.': 'Objekat je uspešno dodat.';
        this.cuvanje = false;
      },
      error: greskaOdgovora => {
        this.postaviGresku(greskaOdgovora.error?.message ||
          'Objekat nije moguće sačuvati.');
        this.cuvanje = false;
      }
    });
  }
  izaberiJson(dogadjaj: Event): void {
    this.poruka = '';
    this.uspesnaPoruka = false;
    const input = dogadjaj.target as HTMLInputElement;
    const fajl = input.files?.[0];
    if(!fajl) {
      return;
    }
    if(fajl.type !== 'application/json' && !fajl.name.toLowerCase().endsWith('.json')) {
      this.postaviGresku('Potrebno je izabrati JSON fajl.');
      input.value = '';
      return;
    }
    if(fajl.size > 2 * 1024 * 1024) {
      this.postaviGresku('JSON fajl ne sme biti veći od 2 MB.');
      input.value = '';
      return;
    }
    this.jsonFajl = fajl;
  }
  dodajIzJson(input: HTMLInputElement): void {
    if(!this.jsonFajl) {
      this.postaviGresku('Prvo izaberite JSON fajl.');
      return;
    }
    this.cuvanje = true;
    this.poruka = '';
    this.zaposleniService.dodajObjekatIzJson(this.username,this.jsonFajl).subscribe({
      next: objekat => {
        this.objekti.push(objekat);
        this.jsonFajl = null;
        input.value = '';
        this.uspesnaPoruka = true;
        this.poruka = 'Objekat je uspešno dodat iz JSON fajla.';
        this.cuvanje = false;
      },
      error: greska => {
        this.postaviGresku(greska.error?.message ||
          'Objekat nije moguće dodati iz JSON fajla.');
        this.cuvanje = false;
      }
    });
  }
  tekstStatusaObjekta(status: Objekat['status']): string {
    if(status === 'aktivan') {
      return 'Aktivan';
    }
    if(status === 'odbijen') {
      return 'Odbijen';
    }
    return 'Na čekanju';
  }
  
  private validirajObjekat(): string | null {
    if(!this.objekat.naziv.trim() || !this.objekat.grad.trim() || !this.objekat.adresa.trim()) {
      return ('Naziv, grad i adresa su obavezni.');
    }
    if(!this.objekat.radnoVremeOd || !this.objekat.radnoVremeDo) {
      return ('Radno vreme je obavezno.');
    }
    if(!this.radniSati.includes(this.objekat.radnoVremeOd) || !this.zavrsniRadniSati.includes(this.objekat.radnoVremeDo)) {
      return ('Radno vreme mora biti uneto u punim satima.');
    }
    const pocetakRadnogVremena = this.vremeUMinute(this.objekat.radnoVremeOd);
    const krajRadnogVremena = this.vremeKrajaUMinute(this.objekat.radnoVremeDo);
    if(krajRadnogVremena <= pocetakRadnogVremena) {
      return ('Kraj radnog vremena mora biti posle početka.');
    }
    if(!Number.isInteger(this.objekat.dozvoljenaNePojavljivanja) || this.objekat.dozvoljenaNePojavljivanja < 1) {
      return ('Broj dozvoljenih nedolazaka mora biti ceo broj i najmanje 1.');
    }
    if(this.objekat.tereni.length === 0) {
      return ('Dodajte najmanje jedan teren, halu ili dvoranu.');
    }
    const nazivi: string[] = [];
    let postojiOtvoreniTeren = false;
    for(const teren of this.objekat.tereni) {
      const naziv = teren.naziv.trim().toLowerCase();
      if(!naziv) {
        return ('Naziv svakog terena je obavezan.');
      }
      if(!teren.sport || !this.sportovi.includes(teren.sport)) {
        return ('Izaberite ispravan sport za svaki teren.');
      }
      if(nazivi.includes(naziv)) {
        return ('Nazivi terena, hala i dvorana moraju biti jedinstveni.');
      }
      nazivi.push(naziv);
      if(!Number.isInteger(teren.kapacitet) || teren.kapacitet < 1) {
        return ('Kapacitet mora biti ceo broj i najmanje 1.');
      }
      if(!Number.isFinite(teren.cenaPoSatu) || teren.cenaPoSatu < 0) {
        return ('Cena terena ne može biti negativna.');
      }
      if(teren.opisOpreme.length > 300) {
        return ('Opis opreme može imati najviše 300 karaktera.');
      }
      if(teren.tip === 'otvoreni' && teren.kapacitet >= 4) {
        postojiOtvoreniTeren = true;
      }
    }
    if(!postojiOtvoreniTeren) {
      return ('Potreban je najmanje jedan otvoreni teren kapaciteta najmanje 4.');
    }
    return null;
  }
  vremeUMinute(vreme: string): number {
    const [sat,minut] = vreme.split(':').map(Number);
    return sat * 60 + minut;
  }
  vremeKrajaUMinute(vreme: string): number {
    if(vreme === '00:00') {
      return 24 * 60;
    }
    return this.vremeUMinute(vreme);
  }
  private postaviGresku(poruka: string): void {
    this.poruka = poruka;
    this.uspesnaPoruka = false;
  }
  private prazanObjekat(): Objekat {
    return { id: '',naziv: '',grad: '',adresa: '',sportovi: [],tipoviTerena: [],status: 'na_cekanju',svidjanja: 0,nesvidjanja: 0,kratakOpis: '',naslovnaSlika: '/facilities/default-facility.jpg',radnoVremeOd: '08:00',radnoVremeDo: '22:00',dozvoljenaNePojavljivanja: 3,galerija: [],tereni: [] };
  }
  tekstBrojaObjekata(): string {
    const broj = this.objekti.length;
    const poslednjeDveCifre = broj % 100;
    const poslednjaCifra = broj % 10;
    if(poslednjeDveCifre >= 11 && poslednjeDveCifre <= 14) {
      return 'objekata';
    }
    if(poslednjaCifra === 1) {
      return 'objekat';
    }
    if(poslednjaCifra >= 2 && poslednjaCifra <= 4) {
      return 'objekta';
    }
    return 'objekata';
  }
}