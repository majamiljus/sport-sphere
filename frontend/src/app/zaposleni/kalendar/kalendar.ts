import {CommonModule} from '@angular/common';
import {Component,ElementRef,HostListener,ViewChild,inject,OnDestroy,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Objekat,Teren} from '../../models/objekti';
import {ZaposleniService} from '../../services/zaposleni.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {ZaposleniHeader} from '../../shared/zaposleni/header';
type TipTermina = 'rezervacija' | 'trening';
type StatusTermina = 'zakazan' | 'otkazan' | 'zavrsen' | 'neodrzan';
export interface TerminKalendarZaposlenog {
  id: string;
  tip: TipTermina;
  korisnikId: string;
  ime: string;
  prezime: string;
  imejl: string;
  telefon: string;
  trenerId?: string;
  objekatId: string;
  teren: string;
  sport: string;
  pocetak: string;
  kraj: string;
  status: StatusTermina;
}
interface SpojeniTermin {
  kljuc: string;
  ids: string[];
  tip: TipTermina;
  korisnikId: string;
  ime: string;
  prezime: string;
  imejl: string;
  telefon: string;
  trenerId?: string;
  objekatId: string;
  teren: string;
  sport: string;
  pocetak: string;
  kraj: string;
  status: StatusTermina;
}
@Component({
  selector: 'app-kalendar-zaposlenog',
  standalone: true,
  imports: [CommonModule,FormsModule,ZaposleniHeader,PublicFooter],
  templateUrl: './kalendar.html',
  styleUrl: './kalendar.css'
})
export class KalendarZaposlenog implements OnInit,OnDestroy {
  private readonly zaposleniService = inject(ZaposleniService);
  private readonly router = inject(Router);
  @ViewChild('calendarScroll')
  calendarScroll?: ElementRef<HTMLDivElement>;
  readonly visinaSata = 76;
  readonly naziviDana = ['NED','PON','UTO','SRE','ČET','PET','SUB'];
  username = '';
  objekti: Objekat[] = [];
  izabraniObjekatId = '';
  izabraniObjekat: Objekat | null = null;
  izabraniTerenNaziv = '';
  izabraniTeren: Teren | null = null;
  pocetakNedelje = this.nadjiPonedeljak(new Date());
  dani: Date[] = [];
  sati: number[] = [];
  termini: TerminKalendarZaposlenog[] = [];
  spojeniTermini: SpojeniTermin[] = [];
  izabraniTermin: SpojeniTermin | null = null;
  prevuceniTermin: SpojeniTermin | null = null;
  ucitavanjeObjekata = false;
  ucitavanjeTermina = false;
  pomeranjeTermina = false;
  poruka = '';
  uspesnaPoruka = false;
  smerPromeneNedeljePriPrevacenju = 0;
  private tajmerPromeneNedelje: ReturnType<typeof setTimeout> | null = null;
  private readonly sirinaZoneIvice = 90;
  private readonly vremeCekanjaNaIvici = 800;
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
    this.osveziDane();
    this.ucitajObjekte();
  }
  ngOnDestroy(): void {
    this.zaustaviPromenuNedeljePriIvici();
  }
  ucitajObjekte(): void {
    this.ucitavanjeObjekata = true;
    this.poruka = '';
    this.zaposleniService.dohvatiProfil(this.username).subscribe({
      next: podaci => {
        this.objekti = podaci.objekti.filter(objekat => objekat.status === 'aktivan');
        this.izabraniObjekat = this.objekti[0] || null;
        this.izabraniObjekatId = this.izabraniObjekat?.id || '';
        this.postaviPrviTeren();
        this.osveziSate();
        this.ucitavanjeObjekata = false;
        this.ucitajTermine();
      },
      error: greska => {
        this.postaviGresku(greska.error?.message ||
          'Objekte trenutno nije moguće učitati.');
        this.ucitavanjeObjekata = false;
      }
    });
  }
  promenjenObjekat(): void {
    this.izabraniObjekat = this.objekti.find(objekat => objekat.id === this.izabraniObjekatId) || null;
    this.postaviPrviTeren();
    this.osveziSate();
    this.termini = [];
    this.spojeniTermini = [];
    this.izabraniTermin = null;
    this.ucitajTermine();
  }
  promenjenTeren(): void {
    if(!this.izabraniObjekat) {
      this.izabraniTeren = null;
      this.izabraniTermin = null;
      return;
    }
    this.izabraniTeren = this.izabraniObjekat.tereni.find(teren => teren.naziv === this.izabraniTerenNaziv) || null;
    this.termini = [];
    this.spojeniTermini = [];
    this.izabraniTermin = null;
    this.ucitajTermine();
  }
  private postaviPrviTeren(): void {
    this.izabraniTeren = this.izabraniObjekat?.tereni[0] || null;
    this.izabraniTerenNaziv = this.izabraniTeren?.naziv || '';
  }
  promeniNedelju(pomeraj: number): void {
    const noviPocetak = new Date(this.pocetakNedelje);
    noviPocetak.setDate(noviPocetak.getDate() + pomeraj * 7);
    this.pocetakNedelje = noviPocetak;
    this.izabraniTermin = null;
    this.osveziDane();
    this.ucitajTermine();
  }
  idiNaDanas(): void {
    this.pocetakNedelje = this.nadjiPonedeljak(new Date());
    this.izabraniTermin = null;
    this.osveziDane();
    this.ucitajTermine();
  }
  osveziDane(): void {
    this.dani = [];
    for(let indeks = 0; indeks < 7; indeks++) {
      const dan = new Date(this.pocetakNedelje);
      dan.setDate(dan.getDate() + indeks);
      this.dani.push(dan);
    }
  }
  osveziSate(): void {
    this.sati = [];
    if(!this.izabraniObjekat) {
      return;
    }
    const pocetniSat = this.vremeUMinute(this.izabraniObjekat.radnoVremeOd) / 60;
    let krajnjiSat = this.vremeKrajaUMinute(this.izabraniObjekat.radnoVremeDo) / 60;
    if(krajnjiSat <= pocetniSat) {
      krajnjiSat += 24;
    }
    for(let sat = Math.floor(pocetniSat); sat < Math.ceil(krajnjiSat); sat++) {
      this.sati.push(sat);
    }
  }
  visinaKalendara(): number {
    return this.sati.length * this.visinaSata;
  }
  ucitajTermine(): void {
    if(!this.izabraniObjekat || !this.izabraniTeren) {
      this.termini = [];
      this.spojeniTermini = [];
      this.izabraniTermin = null;
      return;
    }
    this.ucitavanjeTermina = true;
    this.poruka = '';
    const od = new Date(this.pocetakNedelje);
    od.setHours(0,0,0,0);
    const doDatuma = new Date(od);
    doDatuma.setDate(doDatuma.getDate() + 7);
    this.zaposleniService.dohvatiKalendarZaposlenog(this.username,this.izabraniObjekat.id,this.izabraniTeren.naziv,od.toISOString(),doDatuma.toISOString()).subscribe({
      next: odgovor => {
        this.termini = odgovor.termini;
        this.spojeniTermini = this.spojiUzastopneTermine(this.termini);
        this.ucitavanjeTermina = false;
        if(this.prevuceniTermin) {
          const postojiPrevuceniTermin = this.spojeniTermini.some(termin => termin.kljuc === this.prevuceniTermin?.kljuc);
          if(!postojiPrevuceniTermin) {
            this.spojeniTermini.push(this.prevuceniTermin);
          }
        }
      },
      error: greska => {
        this.termini = [];
        this.spojeniTermini = [];
        this.izabraniTermin = null;
        this.postaviGresku(greska.error?.message ||
          'Kalendar trenutno nije moguće učitati.');
        this.ucitavanjeTermina = false;
      }
    });
  }
  private spojiUzastopneTermine(termini: TerminKalendarZaposlenog[]): SpojeniTermin[] {
    const sortirani = [...termini].sort((prvi,drugi) => new Date(prvi.pocetak).getTime() - new Date(drugi.pocetak).getTime());
    const rezultat: SpojeniTermin[] = [];
    for(const termin of sortirani) {
      const poslednji = rezultat[rezultat.length - 1];
      const istiTip = poslednji?.tip === termin.tip;
      const istiKorisnik = poslednji?.korisnikId === termin.korisnikId;
      const istiObjekatITeren = poslednji?.objekatId === termin.objekatId && poslednji?.teren === termin.teren;
      const istiStatus = poslednji?.status === termin.status;
      const uzastopni = poslednji && new Date(poslednji.kraj).getTime() === new Date(termin.pocetak).getTime();
      const istiTrenerZaTrening = termin.tip !== 'trening' || (!!termin.trenerId && poslednji?.trenerId === termin.trenerId);
      const mozeDaSeSpoji = !!poslednji && istiTip && istiKorisnik && istiObjekatITeren && istiStatus && uzastopni && istiTrenerZaTrening;
      if(mozeDaSeSpoji) {
        poslednji.ids.push(termin.id);
        poslednji.kraj = termin.kraj;
        poslednji.kljuc = `${poslednji.tip}-${poslednji.ids.join('-')}`;
        continue;
      }
      rezultat.push({
        kljuc: `${termin.tip}-${termin.id}`,
        ids: [termin.id],
        tip: termin.tip,
        korisnikId: termin.korisnikId,
        ime: termin.ime,
        prezime: termin.prezime,
        imejl: termin.imejl,
        telefon: termin.telefon,
        trenerId: termin.trenerId,
        objekatId: termin.objekatId,
        teren: termin.teren,
        sport: termin.sport,
        pocetak: termin.pocetak,
        kraj: termin.kraj,
        status: termin.status
      });
    }
    return rezultat;
  }
  terminiDana(dan: Date): SpojeniTermin[] {
    return this.spojeniTermini.filter(termin => this.istiDan(new Date(termin.pocetak),dan));
  }
  izaberiTermin(termin: SpojeniTermin): void {
    this.izabraniTermin = termin;
  }
  pozicijaTermina(termin: SpojeniTermin): number {
    if(!this.izabraniObjekat) {
      return 0;
    }
    const pocetakRadnogVremena = this.vremeUMinute(this.izabraniObjekat.radnoVremeOd);
    const pocetakTermina = this.minutiDatuma(new Date(termin.pocetak));
    return ((pocetakTermina - pocetakRadnogVremena) / 60) * this.visinaSata + 4;
  }
  visinaTermina(termin: SpojeniTermin): number {
    const brojSati = termin.ids.length;
    return brojSati * this.visinaSata - 8;
  }
  tekstTipa(termin: SpojeniTermin): string {
    return termin.tip === 'rezervacija' ? 'Rezervacija': 'Trening';
  }
  tekstVremena(termin: SpojeniTermin): string {
    return (this.vremeDatuma(new Date(termin.pocetak)) + ' – ' + this.vremeDatuma(new Date(termin.kraj)));
  }
  tekstDatumaIVremena(termin: SpojeniTermin): string {
    const pocetak = new Date(termin.pocetak);
    return (pocetak.toLocaleDateString('sr-RS') + ', ' + this.tekstVremena(termin));
  }
  tekstSpojenihTermina(termin: SpojeniTermin): string {
    if(termin.ids.length <= 1) {
      return '';
    }
    if(termin.tip === 'rezervacija') {
      return `${termin.ids.length} spojene rezervacije`;
    }
    return `${termin.ids.length} spojena treninga`;
  }
  jeDanas(dan: Date): boolean {
    return this.istiDan(dan,new Date());
  }
  @HostListener('document:dragover',['$event'])
  pratiIvicuTokomPrevacenja(dogadjaj: DragEvent): void {
    const kalendar = this.calendarScroll?.nativeElement;
    if(!this.prevuceniTermin || !kalendar) {
      this.zaustaviPromenuNedeljePriIvici();
      return;
    }
    const okvir = kalendar.getBoundingClientRect();
    const unutarVisineKalendara = dogadjaj.clientY >= okvir.top && dogadjaj.clientY <= okvir.bottom;
    if(!unutarVisineKalendara) {
      this.zaustaviPromenuNedeljePriIvici();
      return;
    }
    dogadjaj.preventDefault();
    if(dogadjaj.clientX <= okvir.left + this.sirinaZoneIvice) {
      this.pokreniPromenuNedeljePriIvici(-1);
      return;
    }
    if(dogadjaj.clientX >= okvir.right - this.sirinaZoneIvice) {
      this.pokreniPromenuNedeljePriIvici(1);
      return;
    }
    this.zaustaviPromenuNedeljePriIvici();
  }
  private pokreniPromenuNedeljePriIvici(smer: number): void {
    if(this.ucitavanjeTermina || (this.smerPromeneNedeljePriPrevacenju === smer && this.tajmerPromeneNedelje)) {
      return;
    }
    this.zaustaviPromenuNedeljePriIvici();
    this.smerPromeneNedeljePriPrevacenju = smer;
    this.tajmerPromeneNedelje =
      setTimeout(() => {
        this.tajmerPromeneNedelje = null;
        this.smerPromeneNedeljePriPrevacenju = 0;
        if(!this.prevuceniTermin) {
          return;
        }
        this.promeniNedelju(smer);
      },this.vremeCekanjaNaIvici);
  }
  private zaustaviPromenuNedeljePriIvici(): void {
    if(this.tajmerPromeneNedelje) {
      clearTimeout(this.tajmerPromeneNedelje);
      this.tajmerPromeneNedelje = null;
    }
    this.smerPromeneNedeljePriPrevacenju = 0;
  }
  mozeDaSePomera(termin: SpojeniTermin): boolean {
    return (this.izabraniTeren?.tip === 'zatvoreni' && termin.status === 'zakazan' && new Date(termin.pocetak) > new Date() && !this.pomeranjeTermina);
  }
  zapocniPrevacenje(dogadjaj: DragEvent,termin: SpojeniTermin): void {
    if(!this.mozeDaSePomera(termin)) {
      dogadjaj.preventDefault();
      return;
    }
    this.prevuceniTermin = termin;
    this.izabraniTermin = termin;
    if(dogadjaj.dataTransfer) {
      dogadjaj.dataTransfer.effectAllowed = 'move';
      dogadjaj.dataTransfer.setData('text/plain',termin.kljuc);
    }
  }
  dozvoliSpustanje(dogadjaj: DragEvent): void {
    if(!this.prevuceniTermin) {
      return;
    }
    dogadjaj.preventDefault();
    if(dogadjaj.dataTransfer) {
      dogadjaj.dataTransfer.dropEffect = 'move';
    }
  }
  spustiTermin(dogadjaj: DragEvent,dan: Date,sat: number): void {
    dogadjaj.preventDefault();
    this.zaustaviPromenuNedeljePriIvici();
    const termin = this.prevuceniTermin;
    if(!termin || !this.izabraniObjekat || !this.izabraniTeren || !this.mozeDaSePomera(termin)) {
      this.prevuceniTermin = null;
      return;
    }
    const noviPocetak = new Date(dan);
    noviPocetak.setHours(sat,0,0,0);
    const trajanje = new Date(termin.kraj).getTime() - new Date(termin.pocetak).getTime();
    const noviKraj = new Date(noviPocetak.getTime() + trajanje);
    const greska = this.validirajPomeranje(termin,noviPocetak,noviKraj);
    if(greska) {
      this.postaviGresku(greska);
      this.prevuceniTermin = null;
      return;
    }
    const stariPocetak = termin.pocetak;
    const stariKraj = termin.kraj;
    const terminJeBioUPrikazu = this.spojeniTermini.some(trenutniTermin => trenutniTermin.kljuc === termin.kljuc);
    termin.pocetak = noviPocetak.toISOString();
    termin.kraj = noviKraj.toISOString();
    this.izabraniTermin = termin;
    if(!terminJeBioUPrikazu) {
      this.spojeniTermini.push(termin);
    }
    this.spojeniTermini = [...this.spojeniTermini].sort((prvi,drugi) => new Date(prvi.pocetak).getTime() - new Date(drugi.pocetak).getTime());
    this.pomeranjeTermina = true;
    this.prevuceniTermin = null;
    this.poruka = '';
    this.zaposleniService.pomeriTerminKalendara(this.username,{
      tip: termin.tip,
      ids: termin.ids,
      objekatId: this.izabraniObjekat.id,
      teren: this.izabraniTeren.naziv,
      noviPocetak: noviPocetak.toISOString(),
      noviKraj: noviKraj.toISOString()
    }).subscribe({
      next: odgovor => {
        this.pomeranjeTermina = false;
        this.uspesnaPoruka = true;
        this.poruka = odgovor.message;
      },
      error: greskaOdgovora => {
        termin.pocetak = stariPocetak;
        termin.kraj = stariKraj;
        if(!terminJeBioUPrikazu) {
          this.spojeniTermini = this.spojeniTermini.filter(trenutniTermin => trenutniTermin.kljuc !== termin.kljuc);
        }
        this.pomeranjeTermina = false;
        this.postaviGresku(greskaOdgovora.error?.message ||
          'Termin nije moguće pomeriti.');
      }
    });
  }
  zavrsiPrevacenje(): void {
    this.prevuceniTermin = null;
    this.zaustaviPromenuNedeljePriIvici();
  }
  private validirajPomeranje(termin: SpojeniTermin,noviPocetak: Date,noviKraj: Date): string | null {
    if(!this.izabraniObjekat || !this.izabraniTeren) {
      return 'Objekat ili teren nije izabran.';
    }
    if(this.izabraniTeren.tip !== 'zatvoreni') {
      return 'Termini se mogu pomerati samo u zatvorenim halama i dvoranama.';
    }
    if(noviPocetak <= new Date()) {
      return 'Termin nije moguće pomeriti u prošlost.';
    }
    const postojiPreklapanje = this.spojeniTermini.some(drugiTermin => {
      if(drugiTermin.kljuc === termin.kljuc) {
        return false;
      }
      const drugiPocetak = new Date(drugiTermin.pocetak);
      const drugiKraj = new Date(drugiTermin.kraj);
      return (noviPocetak < drugiKraj && noviKraj > drugiPocetak);
    });
    if(postojiPreklapanje) {
      return 'Izabrani period se preklapa sa postojećim terminom.';
    }
    return null;
  }
  nazivDana(dan: Date): string {
    const nazivi = ['NED','PON','UTO','SRE','ČET','PET','SUB'];
    return nazivi[dan.getDay()];
  }
  datumDana(dan: Date): string {
    return dan.toLocaleDateString('sr-RS',{ day: '2-digit',month: '2-digit' });
  }
  rasponNedelje(): string {
    const poslednjiDan = this.dani[this.dani.length - 1];
    if(!poslednjiDan) {
      return '';
    }
    return (this.pocetakNedelje.toLocaleDateString('sr-RS') + ' – ' + poslednjiDan.toLocaleDateString('sr-RS'));
  }
  formatirajSat(sat: number): string {
    return `${String(sat % 24).padStart(2, '0')}:00`;
  }
  private postaviGresku(poruka: string): void {
    this.uspesnaPoruka = false;
    this.poruka = poruka;
  }
  private nadjiPonedeljak(datum: Date): Date {
    const ponedeljak = new Date(datum);
    const dan = ponedeljak.getDay();
    const pomeraj = dan === 0 ? -6: 1 - dan;
    ponedeljak.setDate(ponedeljak.getDate() + pomeraj);
    ponedeljak.setHours(0,0,0,0);
    return ponedeljak;
  }
  private vremeUMinute(vreme: string): number {
    const [sat,minut] = vreme.split(':').map(Number);
    return sat * 60 + minut;
  }
  private vremeKrajaUMinute(vreme: string): number {
    if(vreme === '00:00' || vreme === '24:00') {
      return 24 * 60;
    }
    return this.vremeUMinute(vreme);
  }
  private minutiDatuma(datum: Date): number {
    return datum.getHours() * 60 + datum.getMinutes();
  }
  private vremeDatuma(datum: Date): string {
    return datum.toLocaleTimeString('sr-RS',{ hour: '2-digit',minute: '2-digit' });
  }
  private istiDan(prvi: Date,drugi: Date): boolean {
    return (prvi.getFullYear() === drugi.getFullYear() && prvi.getMonth() === drugi.getMonth() && prvi.getDate() === drugi.getDate());
  }

}