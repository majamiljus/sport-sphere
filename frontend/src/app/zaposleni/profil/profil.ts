import {CommonModule} from '@angular/common';
import {Component,ElementRef,inject,OnDestroy,OnInit,ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AvatarService} from '../../login_reg/register/avatar.service';
import {Objekat} from '../../models/objekti';
import {Zaposleni} from '../../models/zaposleni';
import {ZaposleniService} from '../../services/zaposleni.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {ZaposleniHeader} from '../../shared/zaposleni/header';
@Component({
  selector: 'app-profil-zaposlenog',
  imports: [CommonModule,FormsModule,ZaposleniHeader,PublicFooter],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil implements OnInit,OnDestroy {
  private readonly zaposleniService = inject(ZaposleniService);
  private readonly avatarService = inject(AvatarService);
  private readonly router = inject(Router);
  @ViewChild('izvestajiSekcija')
  izvestajiSekcija?: ElementRef<HTMLElement>;
  username = '';
  profil: Zaposleni | null = null;
  objekti: Objekat[] = [];
  izabraniMesec = this.trenutniMesec();
  maksimalniMesec = this.trenutniMesec();
  generisanjePopunjenosti = false;
  generisanjePrometaOpreme = false;
  porukaIzvestaja = '';
  greskaIzvestaja = '';
  sportovi = ['Atletika','Badminton','Biciklizam','Borilački sportovi','Fudbal','Gimnastika','Košarka','Odbojka','Plivanje','Rukomet','Skijanje','Stoni tenis','Tenis','Vaterpolo','Fitnes'];
  izabranaSlika: File | null = null;
  pregledSlike = '';
  sacuvanaSlika = '';
  loading = true;
  cuvanje = false;
  poruka = '';
  uspesnaPoruka = false;
  porukaSlike = '';
  informacijaAvatara = '';
  imageUrl: string | null = null;
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
    this.ucitajProfil();
  }
  ngOnDestroy(): void {
    this.ocistiImageUrl();
  }
  ucitajProfil(): void {
    this.loading = true;
    this.poruka = '';
    this.uspesnaPoruka = false;
    this.zaposleniService.dohvatiProfil(this.username).subscribe({
      next: podaci => {
        this.profil = {...podaci.korisnik,sportovi: [...(podaci.korisnik.sportovi || [])] };
        this.objekti = podaci.objekti;
        this.sacuvanaSlika = this.putanjaSlike(podaci.korisnik.slika);
        this.pregledSlike = this.sacuvanaSlika;
        this.loading = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Profil trenutno nije moguće učitati.';
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
      this.porukaSlike = 'Dozvoljene su samo PNG i JPG/JPEG slike.';
      input.value = '';
      return;
    }
    if(fajl.size > 5 * 1024 * 1024) {
      this.porukaSlike = 'Slika ne sme biti veća od 5 MB.';
      input.value = '';
      return;
    }
    this.izabranaSlika = fajl;
    this.postaviPregledSlike(fajl);
  }
  async generisiAvatar(): Promise<void> {
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    try {
      const avatar = await this.avatarService.generate();
      this.ocistiImageUrl();
      this.pregledSlike = avatar.dataUri;
      this.izabranaSlika = avatar.file;
      this.informacijaAvatara = 'Avatar je generisan.';
    }
    catch {
      this.porukaSlike = 'Avatar trenutno nije moguće generisati.';
    }
  }
  async ukloniIzabranuSliku(inputSlike: HTMLInputElement): Promise<void> {
    this.ocistiImageUrl();
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    try {
      const odgovor = await fetch('/default_avatar.jpg');
      if(!odgovor.ok) {
        throw new Error();
      }
      const blob = await odgovor.blob();
      const defaultAvatar = new File([blob],'default_avatar.jpg',{ type: blob.type || 'image/jpeg' });
      this.izabranaSlika = defaultAvatar;
      this.pregledSlike = '/default_avatar.jpg';
      inputSlike.value = '';
    }
    catch {
      this.porukaSlike = 'Podrazumevani avatar nije moguće postaviti.';
    }
  }
  promeniSport(sport: string,dogadjaj: Event): void {
    if(!this.profil) {
      return;
    }
    const input = dogadjaj.target as HTMLInputElement;
    if(input.checked) {
      if(this.profil.sportovi.length >= 5) {
        this.poruka = 'Možete izabrati najviše pet sportova.';
        this.uspesnaPoruka = false;
        input.checked = false;
        return;
      }
      if(!this.profil.sportovi.includes(sport)) {
        this.profil.sportovi.push(sport);
      }
    }
    else {
      this.profil.sportovi = this.profil.sportovi.filter(izabraniSport => izabraniSport !== sport);
      if(this.poruka === 'Možete izabrati najviše pet sportova.') {
        this.poruka = '';
      }
    }
  }
  sacuvajIzmene(): void {
    if(!this.profil) {
      return;
    }
    this.poruka = '';
    this.uspesnaPoruka = false;
    if(!this.profil.ime.trim() || !this.profil.prezime.trim() || !this.profil.telefon.trim() || !this.profil.imejl.trim()) {
      this.poruka = 'Sva lična polja su obavezna.';
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
    this.profil.imejl = this.profil.imejl.trim().toLowerCase();
    this.cuvanje = true;
    this.zaposleniService.izmeniProfil(this.profil,this.izabranaSlika).subscribe({
      next: profil => {
        this.profil = profil;
        if(!this.profil.sportovi) {
          this.profil.sportovi = [];
        }
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
  opisSportova(objekat: Objekat): string {
    return objekat.sportovi.join(', ');
  }
  opisElemenata(objekat: Objekat): string {
    const elementi: string[] = [];
    for(const teren of objekat.tereni) {
      elementi.push(`${teren.naziv} – ${teren.tip}, ` +
        `${teren.sport}, kapacitet ${teren.kapacitet}`);
    }
    return elementi.join('; ');
  }
  putanjaSlike(slika: string): string {
    if(!slika) {
      return '/default_avatar.jpg';
    }
    if(slika === 'default_avatar.jpg' || slika === '/default_avatar.jpg') {
      return '/default_avatar.jpg';
    }
    if(slika.startsWith('/') || slika.startsWith('http') || slika.startsWith('data:')) {
      return slika;
    }
    return `http://localhost:4000/images/${slika}`;
  }

  idiNaIzvestaje(): void {
    this.izvestajiSekcija
      ?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
  generisiIzvestajPopunjenosti(): void {
    this.porukaIzvestaja = '';
    this.greskaIzvestaja = '';
    if(!this.validanMesecIzvestaja()) {
      return;
    }
    this.generisanjePopunjenosti = true;
    this.zaposleniService.generisiIzvestajPopunjenosti(this.username,this.izabraniMesec).subscribe({
      next: pdf => {
        this.preuzmiPdf(pdf,`popunjenost-terena-${this.izabraniMesec}.pdf`);
        this.porukaIzvestaja = 'Izveštaj o popunjenosti terena je uspešno generisan.';
        this.generisanjePopunjenosti = false;
      },
      error: greska => {
        console.log(greska);
        this.greskaIzvestaja = 'Izveštaj o popunjenosti terena trenutno nije moguće generisati.';
        this.generisanjePopunjenosti = false;
      }
    });
  }
  generisiIzvestajPrometaOpreme(): void {
    this.porukaIzvestaja = '';
    this.greskaIzvestaja = '';
    if(!this.validanMesecIzvestaja()) {
      return;
    }
    this.generisanjePrometaOpreme = true;
    this.zaposleniService.generisiIzvestajPrometaOpreme(this.username,this.izabraniMesec).subscribe({
      next: pdf => {
        this.preuzmiPdf(pdf,`promet-opreme-${this.izabraniMesec}.pdf`);
        this.porukaIzvestaja = 'Izveštaj o prometu opreme je uspešno generisan.';
        this.generisanjePrometaOpreme = false;
      },
      error: greska => {
        console.log(greska);
        this.greskaIzvestaja = 'Izveštaj o prometu opreme trenutno nije moguće generisati.';
        this.generisanjePrometaOpreme = false;
      }
    });
  }
  private validanMesecIzvestaja(): boolean {
    if(!/^\d{4}-\d{2}$/.test(this.izabraniMesec)) {
      this.greskaIzvestaja = 'Izaberite mesec za koji želite izveštaj.';
      return false;
    }
    if(this.izabraniMesec > this.maksimalniMesec) {
      this.greskaIzvestaja = 'Nije moguće generisati izveštaj za budući mesec.';
      return false;
    }
    return true;
  }
  private preuzmiPdf(pdf: Blob,nazivFajla: string): void {
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = nazivFajla;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  private trenutniMesec(): string {
    const datum = new Date();
    const godina = datum.getFullYear();
    const mesec = String(datum.getMonth() + 1).padStart(2,'0');
    return `${godina}-${mesec}`;
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
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(this.profil?.imejl.trim() || '');
  }
  validniSportovi(): boolean {
    return Boolean(this.profil && this.profil.sportovi.length <= 5);
  }
  private postaviPregledSlike(fajl: File): void {
    this.ocistiImageUrl();
    this.imageUrl = URL.createObjectURL(fajl);
    this.pregledSlike = this.imageUrl;
  }
  private ocistiImageUrl(): void {
    if(this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = null;
    }
  }
}