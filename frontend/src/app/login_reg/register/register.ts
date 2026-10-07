import {Component,inject,OnDestroy,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AuthService,DostupanObjekat} from '../../services/auth.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {PublicHeader} from '../../shared/neregistrovan/header/header';
import {LoginReg} from '../../shared/login_reg/login_reg';
import {AvatarService} from './avatar.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule,RouterLink,LoginReg,PublicHeader,PublicFooter],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit,OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly avatarService = inject(AvatarService);
  readonly sportovi = ['Atletika','Badminton','Biciklizam','Borilački sportovi','Fudbal','Gimnastika','Košarka','Odbojka','Plivanje','Rukomet','Skijanje','Stoni tenis','Tenis','Vaterpolo','Fitnes'];
  tip: 'sportista' | 'zaposleni' = 'sportista';
  izborObjekta: 'postojeci' | 'novi_kasnije' = 'postojeci';
  username = '';
  password = '';
  potvrdaLozinke = '';
  ime = '';
  prezime = '';
  telefon = '';
  imejl = '';
  izabraniSportovi: string[] = [];
  adresaSedista = '';
  maticniBroj = '';
  pib = '';
  objekatId = '';
  dostupniObjekti: DostupanObjekat[] = [];
  ucitavanjeObjekata = false;
  porukaObjekata = '';
  prikaziLozinku = false;
  ucitavanje = false;
  poruka = '';
  tipPoruke: 'success' | 'error' = 'error';
  porukaSlike = '';
  informacijaAvatara = '';
  pregledSlike = '/default_avatar.jpg';
  slika: File | null = null;
  private urlSlike: string | null = null;

  ngOnInit(): void {this.ucitajDostupneObjekte();}

  ucitajDostupneObjekte(): void {
    this.ucitavanjeObjekata = true;
    this.porukaObjekata = '';
    this.authService.dohvatiDostupneObjekte().subscribe({
      next: objekti => {
        this.dostupniObjekti = objekti;
        this.ucitavanjeObjekata = false;
        const izabraniPostoji = objekti.some(objekat => objekat.id === this.objekatId);
        if(!izabraniPostoji) {this.objekatId = '';}
        if(objekti.length === 0) {this.porukaObjekata = 'Trenutno nema postojećih objekata sa slobodnim radnim mestom.';}
      },
      error: () => {
        this.dostupniObjekti = [];
        this.ucitavanjeObjekata = false;
        this.porukaObjekata = 'Objekte trenutno nije moguće učitati.';
      }
    });
  }

  promeniIzborObjekta(): void {
    this.poruka = '';
    if(this.izborObjekta === 'novi_kasnije') {this.objekatId = '';}
  }

  izaberiSliku(dogadjaj: Event): void {
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    const input = dogadjaj.target as HTMLInputElement;
    const fajl = input.files?.[0];
    if(!fajl) {return;}
    const dozvoljeniTipovi = ['image/jpeg','image/png'];
    if(!dozvoljeniTipovi.includes(fajl.type)) {
      this.porukaSlike = 'Dozvoljene su samo PNG i JPG/JPEG slike.';
      input.value = '';
      return;
    }
    if(fajl.size > 3 * 1024 * 1024) {
      this.porukaSlike = 'Slika ne sme biti veća od 3 MB.';
      input.value = '';
      return;
    }
    this.slika = fajl;
    this.postaviPregledSlike(fajl);
  }

  async generisiAvatar(){
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    try {
      const avatar = await this.avatarService.generate();
      this.ocistiUrlSlike();
      this.pregledSlike = avatar.dataUri;
      this.slika = avatar.file;
    } catch {
      this.porukaSlike = 'Avatar nije moguće generisati.';
    }
  }

  ukloniSliku(inputSlike: HTMLInputElement): void {
    this.ocistiUrlSlike();
    this.slika = null;
    this.pregledSlike = '/default_avatar.jpg';
    this.porukaSlike = '';
    this.informacijaAvatara = '';
    inputSlike.value = '';
  }
  
  private postaviPregledSlike(fajl: File): void {
    this.ocistiUrlSlike();
    this.urlSlike = URL.createObjectURL(fajl);
    this.pregledSlike = this.urlSlike;
  }

  private ocistiUrlSlike(): void {
    if(this.urlSlike) {
      URL.revokeObjectURL(this.urlSlike);
      this.urlSlike = null;
    }
  }

  validnaLozinka(): boolean {return /^(?=\p{L})(?=\S{8,12}$)(?=.*\p{Lu})(?=.*\d)(?=.*[^\p{L}\d]).*$/u.test(this.password);}
  validanImejl(): boolean {return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.imejl.trim());}
  validanMaticniBroj(): boolean {return /^\d{8}$/.test(this.maticniBroj.trim());}
  validanTelefon(): boolean {return /^\+?\d{8,15}$/.test(this.telefon.trim());}
  validanPib(): boolean {return /^[1-9]\d{8}$/.test(this.pib.trim());}
  validanUsername(): boolean {return /^[\p{L}\d]+$/u.test(this.username.trim());}
  private popunjenaPolja(): boolean {return Boolean(this.username.trim() && this.password && this.potvrdaLozinke && this.ime.trim() && this.prezime.trim() && this.telefon.trim() && this.imejl.trim());}
  private validniPodaciZaposlenog(): boolean {
    if(!this.adresaSedista.trim() || !this.validanMaticniBroj() || !this.validanPib()) {return false;}
    if(this.izborObjekta === 'postojeci') {return Boolean(this.objekatId);}
    return true;
  }

  posaljiZahtev(): void {
    this.poruka = '';
    this.porukaSlike = '';
    if(!this.popunjenaPolja()) {
      this.tipPoruke = 'error';
      this.poruka = 'Popunite sva obavezna polja.';
      return;
    }
    if(!this.validanUsername()) {
      this.tipPoruke = 'error';
      this.poruka = 'Korisničko ime mora sadržati samo slova i brojeve.';
      return;
    }
    if(!this.validnaLozinka()) {
      this.tipPoruke = 'error';
      this.poruka = 'Lozinka mora imati 8–12 karaktera, početi slovom i sadržati veliko slovo, broj i specijalni karakter.';
      return;
    }
    if(this.password !== this.potvrdaLozinke) {
      this.tipPoruke = 'error';
      this.poruka = 'Lozinke se ne podudaraju.';
      return;
    }
    if(!this.validanImejl()) {
      this.tipPoruke = 'error';
      this.poruka = 'Imejl adresa nije ispravna.';
      return;
    }
    if(!this.validanTelefon()) {
      this.tipPoruke = 'error';
      this.poruka = 'Telefon mora sadržati od 8 do 15 cifara i može početi znakom +.';
      return;
    }
    if(this.izabraniSportovi.length > 5) {
      this.tipPoruke = 'error';
      this.poruka = 'Možete izabrati najviše pet sportova.';
      return;
    }
    if(this.tip === 'zaposleni' && !this.validniPodaciZaposlenog()) {
      this.tipPoruke = 'error';
      this.poruka = 'Podaci zaposlenog ili izbor objekta nisu ispravni.';
      return;
    }
    this.ucitavanje = true;
    const podaci = new FormData();
    podaci.append('tip',this.tip);
    podaci.append('username',this.username.trim());
    podaci.append('password',this.password);
    podaci.append('ime',this.ime.trim());
    podaci.append('prezime',this.prezime.trim());
    podaci.append('telefon',this.telefon.trim());
    podaci.append('imejl',this.imejl.trim().toLowerCase());
    podaci.append('sportovi',JSON.stringify(this.izabraniSportovi));
    if(this.tip === 'zaposleni') {
      podaci.append('adresaSedista',this.adresaSedista.trim());
      podaci.append('maticniBroj',this.maticniBroj.trim());
      podaci.append('pib',this.pib.trim());
      podaci.append('facilityChoice',this.izborObjekta);
      if(this.izborObjekta === 'postojeci') {podaci.append('facilityId',this.objekatId);}
    }
    if(this.slika) {podaci.append('slika',this.slika,this.slika.name);}
    this.authService.registracija(podaci).subscribe({
      next: odgovor => {
        this.tipPoruke = 'success';
        this.poruka = odgovor.message;
        this.ucitavanje = false;
      },
      error: greska => {
        this.tipPoruke = 'error';
        if(greska.error && typeof greska.error === 'object' && greska.error.message) {
          this.poruka = greska.error.message;
        } else if(greska.status === 409) {
          this.poruka = 'Korisničko ime ili imejl već postoje.';
        } else {
          this.poruka = 'Zahtev za registraciju nije moguće poslati.';
        }
        this.ucitavanje = false;
      }
    });
  }

  ngOnDestroy(): void {this.ocistiUrlSlike();}


}