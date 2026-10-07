import {CommonModule} from '@angular/common';
import {Component,inject,OnDestroy,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {PoljeSortiranjaRezervacija,Profil as ProfilSportiste,Rezervacija,StatusRezervacije} from '../../models/sportista';
import {SportistaService} from '../../services/sportista.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {SportistaHeader} from '../../shared/sportista/header';
import {Porudzbina} from '../../models/prodavnica';
import {AvatarService} from '../../login_reg/register/avatar.service';

@Component({
  selector: 'app-profil',
  imports: [CommonModule,FormsModule,SportistaHeader,PublicFooter],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil implements OnInit,OnDestroy {
  private readonly sportistaService =inject(SportistaService);
  private readonly router =inject(Router);
  private readonly avatarService =inject(AvatarService);
  korisnickoIme = '';
  profil: ProfilSportiste | null = null;
  rezervacije: Rezervacija[] = [];
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
  izabranaSlika: File | null = null;
  pregledSlike = '';
  sacuvanaSlika = '';
  porukaSlike = '';
  informacijaAvatara = '';
  private imageUrl: string | null = null;
  loading = true;
  cuvanje = false;
  poruka = '';
  uspesnaPoruka = false;
  poljeSortiranja:PoljeSortiranjaRezervacija = 'pocetak';
  smerSortiranja: 'asc' | 'desc' = 'desc';
  porudzbine: Porudzbina[] = [];
  prikaziPorudzbine = false;
  ucitavanjePorudzbina = false;
  otkazivanjePorudzbineId = '';

  ngOnInit(): void {
    const kor = localStorage.getItem('currentUser');
    if(!kor) {
      this.router.navigate(['/prijava']);
      return;
    }
    const korisnik = JSON.parse(kor);
    if(korisnik.tip !== 'sportista') {
      this.router.navigate(['/']);
      return;
    }
    this.korisnickoIme = korisnik.username;
    if(!this.korisnickoIme) {
      this.poruka = 'Korisničko ime prijavljenog korisnika nije pronađeno.';
      this.loading = false;
      return;
    }
    this.ucitajProfil();
  }

  ngOnDestroy(): void {
    this.ocistiImageUrl();
  }

  ucitajProfil(): void {
    this.loading = true;
    this.sportistaService.dohvatiProfil(this.korisnickoIme).subscribe({
        next: podaci => {
          this.profil = podaci.korisnik;
          this.rezervacije = podaci.rezervacije;
          this.sacuvanaSlika = this.putanjaSlike(podaci.korisnik.slika);
          this.pregledSlike = this.sacuvanaSlika;
          this.sortirajRezervacije();
          this.loading = false;
        },
        error: () => {
          this.poruka ='Profil trenutno nije moguće učitati.';
          this.uspesnaPoruka = false;
          this.loading = false;
        }
      });
  }

  izaberiSliku(dogadjaj: Event): void {
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    const input = dogadjaj.target as HTMLInputElement;
    const fajl = input.files?.[0];
    if(!fajl) {
      return;
    }
    const dozvoljeniTipovi = ['image/png','image/jpeg'];
    if(!dozvoljeniTipovi.includes(fajl.type)) {
      this.porukaSlike ='Dozvoljene su samo PNG i JPG/JPEG slike.';
      input.value = '';
      return;
    }
    if(fajl.size > 3 * 1024 * 1024) {
      this.porukaSlike ='Slika ne sme biti veća od 3 MB.';
      input.value = '';
      return;
    }
    this.izabranaSlika = fajl;
    this.postaviPregledSlike(fajl);
  }

  async generisiAvatar(){
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    try {
      const avatar = await this.avatarService.generate();
      this.ocistiImageUrl();
      this.pregledSlike = avatar.dataUri;
      this.izabranaSlika = avatar.file;
    } catch {
      this.porukaSlike = 'Avatar trenutno nije moguće generisati.';
    }
  }

  async ukloniIzabranuSliku(inputSlike: HTMLInputElement) {
    this.ocistiImageUrl();
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    try {
      const odgovor = await fetch('/default_avatar.jpg');
      if(!odgovor.ok) {
        throw new Error();
      }
      const blob = await odgovor.blob();
      const defaultAvatar = new File([blob],'default_avatar.jpg',{type: blob.type || 'image/jpeg'} );
      this.izabranaSlika = defaultAvatar;
      this.pregledSlike = '/default_avatar.jpg';
      inputSlike.value = '';
    } catch {
      this.porukaSlike = 'Podrazumevani avatar nije moguće postaviti.';
    }
  }

  promeniSport(sport: string,dogadjaj: Event): void {
    if(!this.profil) {
      return;
    }
    const input = dogadjaj.target as HTMLInputElement;
    const oznaceno = input.checked;
    if(oznaceno) {
      if(this.profil.sportovi.length >= 5) {
        this.poruka ='Možete izabrati najviše pet sportova.';
        this.uspesnaPoruka = false;
        input.checked = false;
        return;
      }
      if(!this.profil.sportovi.includes(sport)) {
        this.profil.sportovi.push(sport);
      }
    } else {
      this.poruka = '';
      this.profil.sportovi = this.profil.sportovi.filter(izabraniSport =>izabraniSport !== sport);
    }
  }

  sacuvajIzmene(): void {
    if(!this.profil) {
      return;
    }
    this.poruka = '';
    this.uspesnaPoruka = false;
    if(
      !this.profil.ime.trim() ||
      !this.profil.prezime.trim() ||
      !this.profil.telefon.trim() ||
      !this.profil.imejl.trim()
    ) {
      this.poruka ='Sva lična polja su obavezna.';
      return;
    }

    if(!this.validnoIme()) {
      this.poruka = 'Ime može sadržati samo slova.';
      return;
    }
    if(!this.validnoPrezime()) {
      this.poruka = 'Prezime može sadržati samo slova.';
      return;
    }
    if(!this.validanTelefon()) {
      this.poruka = 'Telefon mora sadržati od 8 do 15 cifara i može početi znakom +.';
      return;
    }
    if(!this.validanImejl()) {
      this.poruka = 'Imejl adresa nije ispravna.';
      return;
    }
    if(!this.validniSportovi()) {
      this.poruka = 'Možete izabrati najviše pet sportova.';
      return;
    }
    this.profil.ime = this.profil.ime.trim();
    this.profil.prezime = this.profil.prezime.trim();
    this.profil.telefon = this.profil.telefon.trim();
    this.profil.imejl = this.profil.imejl.trim();
    this.cuvanje = true;
    this.sportistaService.izmeniProfil(this.profil,this.izabranaSlika).subscribe({
        next: profil => {
          this.profil = profil;
          this.ocistiImageUrl();
          this.sacuvanaSlika = this.putanjaSlike(profil.slika);
          this.pregledSlike = this.sacuvanaSlika;
          this.izabranaSlika = null;
          this.porukaSlike = '';
          this.informacijaAvatara = '';
          this.poruka = 'Podaci su uspešno ažurirani.';
          this.uspesnaPoruka = true;
          this.cuvanje = false;
        },
        error: greska => {
          this.poruka = greska.error?.message || 'Podatke nije moguće sačuvati.';
          this.uspesnaPoruka = false;
          this.cuvanje = false;
        }
      });
  }

  mozeDaOtkaze(rezervacija: Rezervacija): boolean {
    const dozvoljenStatus = rezervacija.status === 'zakazan';
    const dvanaestSati = 12 * 60 * 60 * 1000;
    const vremeDoPocetka = new Date(rezervacija.pocetak).getTime() - Date.now();
    return (dozvoljenStatus &&vremeDoPocetka >= dvanaestSati);
  }

  otkaziRezervaciju(rezervacija: Rezervacija): void {
    this.sportistaService.otkaziRezervaciju(rezervacija.id,this.korisnickoIme).subscribe({
        next: odgovor => {
          rezervacija.status = 'otkazan';
          this.poruka = odgovor.message;
          this.uspesnaPoruka = true;
        },
        error: greska => {
          this.poruka = greska.error?.message ||  'Rezervaciju nije moguće otkazati.';
          this.uspesnaPoruka = false;
        }
      });
  }

  sortirajPo(polje: PoljeSortiranjaRezervacija): void {
    if(this.poljeSortiranja === polje) {
      this.smerSortiranja = this.smerSortiranja === 'asc' ? 'desc' : 'asc';
    } else {
      this.poljeSortiranja = polje;
      this.smerSortiranja = 'asc';
    }
    this.sortirajRezervacije();
  }

  sortirajRezervacije(): void {
    const smer = this.smerSortiranja === 'asc' ? 1 : -1;
    this.rezervacije =[...this.rezervacije].sort(
        (prva,druga) => {
          let prvaVrednost = '';
          let drugaVrednost = '';
          if(this.poljeSortiranja === 'nazivObjekta') {
            prvaVrednost = prva.nazivObjekta;
            drugaVrednost = druga.nazivObjekta;
          } else if(
            this.poljeSortiranja === 'grad'
          ) {
            prvaVrednost = prva.grad;
            drugaVrednost = druga.grad;
          } else if(
            this.poljeSortiranja === 'teren'
          ) {
            prvaVrednost = prva.teren;
            drugaVrednost = druga.teren;
          } else if(
            this.poljeSortiranja === 'sport'
          ) {
            prvaVrednost = prva.sport;
            drugaVrednost = druga.sport;
          } else if(
            this.poljeSortiranja === 'status'
          ) {
            prvaVrednost = prva.status;
            drugaVrednost = druga.status;
          } else {
            prvaVrednost = prva.pocetak;
            drugaVrednost = druga.pocetak;
          }
          return prvaVrednost.localeCompare(drugaVrednost,'sr', {sensitivity: 'base'}) * smer;
        }
      );
  }

  ikonicaSortiranja(polje: PoljeSortiranjaRezervacija): string {
    if(this.poljeSortiranja !== polje) {return '↕';}
    return this.smerSortiranja === 'asc' ? '↑' : '↓';
  }

  nazivStatusa(status: StatusRezervacije): string {
    if(status === 'zakazan') {return 'Zakazan';}

    if(status === 'otkazan') {return 'Otkazan';}

    if(status === 'zavrsen') {return 'Završen';}

    return 'Neodržan';
  }

  putanjaSlike(slika: string): string {
  if(!slika || slika === 'default_avatar.jpg') {
    return '/default_avatar.jpg';
  }

  return `http://localhost:4000/images/${slika}`;
  }

  promeniPrikazPorudzbina(): void {
    this.prikaziPorudzbine = !this.prikaziPorudzbine;
    if(this.prikaziPorudzbine && this.porudzbine.length === 0) {
      this.ucitajPorudzbine();
    }
  }

  ucitajPorudzbine(): void {
    this.ucitavanjePorudzbina = true;
    this.sportistaService.dohvatiPorudzbine(this.korisnickoIme).subscribe({
        next: porudzbine => {
          this.porudzbine =porudzbine;
          this.sortirajPorudzbine();
          this.ucitavanjePorudzbina =false;
        },
        error: greska => {
          this.poruka = greska.error?.message || 'Porudžbine trenutno nije moguće učitati.';
          this.uspesnaPoruka = false;
          this.ucitavanjePorudzbina = false;
        }
      });
  }

  sortirajPorudzbine(): void {
    const statusi = ['naruceno','preuzeto','otkazano'];
    this.porudzbine =[...this.porudzbine].sort(
        (prva,druga) => {
          const razlikaStatusa =statusi.indexOf(prva.status) - statusi.indexOf(druga.status);
          if(razlikaStatusa !== 0) {return razlikaStatusa;}
          const datumPrve =new Date(prva.datumPorudzbine).getTime();
          const datumDruge =new Date(druga.datumPorudzbine).getTime();
          return datumDruge - datumPrve;
        }
      );
  }

  otkaziPorudzbinu(porudzbina: Porudzbina): void {
    if(porudzbina.status !== 'naruceno') {
      this.poruka ='Moguće je otkazati samo aktivnu porudžbinu.';
      this.uspesnaPoruka = false;
      return;
    }
    const potvrda = window.confirm('Da li sigurno želite da otkažete porudžbinu?');
    if(!potvrda) {
      return;
    }
    this.otkazivanjePorudzbineId = porudzbina.id;
    this.poruka = '';
    this.sportistaService.otkaziPorudzbinu(porudzbina.id,this.korisnickoIme).subscribe({
        next: odgovor => {
          porudzbina.status ='otkazano';
          this.sortirajPorudzbine();
          this.poruka =odgovor.message;
          this.uspesnaPoruka = true;
          this.otkazivanjePorudzbineId = '';
        },
        error: greska => {
          this.poruka = greska.error?.message || 'Porudžbinu nije moguće otkazati.';
          this.uspesnaPoruka = false;
          this.otkazivanjePorudzbineId = '';
        }
      });
  }

  nazivStatusaPorudzbine(status: string): string {
    if(status === 'naruceno') {return 'Naručeno';}
    if(status === 'preuzeto') {return 'Preuzeto';}
    return 'Otkazano';
  }

  opisStavkiPorudzbine(porudzbina: Porudzbina): string {
    return porudzbina.stavke.map(stavka =>`${stavka.naziv} × ${stavka.kolicina}`).join(', ');
  }

  ukupanBrojStavkiPorudzbine(porudzbina: Porudzbina): number {
    let ukupno = 0;
    for(const stavka of porudzbina.stavke) {
      ukupno += stavka.kolicina;
    }
    return ukupno;
  }

  private postaviPregledSlike(fajl: File): void {
    this.ocistiImageUrl();
    this.imageUrl =URL.createObjectURL(fajl);
    this.pregledSlike =this.imageUrl;
  }

  private ocistiImageUrl(): void {
    if(this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = null;
    }
  }
  
  validnoIme(): boolean {
    return /^[\p{L}\s'-]+$/u.test(this.profil?.ime.trim() || '');
  }
  validnoPrezime(): boolean {
    return /^[\p{L}\s'-]+$/u.test(this.profil?.prezime.trim() || '');
  }
  validanTelefon(): boolean {
    return /^\+?\d{8,15}$/.test(this.profil?.telefon.trim() || '');
  }
  validanImejl(): boolean {
    const regex =/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(this.profil?.imejl.trim() || '');
  }
  validniSportovi(): boolean {
    return Boolean(this.profil && this.profil.sportovi.length <= 5);
  }
}