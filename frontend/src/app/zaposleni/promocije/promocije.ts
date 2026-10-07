import {CommonModule} from "@angular/common";
import {Component,inject,OnInit} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {Objekat} from "../../models/objekti";
import {Promocija,TipPopusta} from "../../models/neregistrovan";
import {Oprema,Porudzbina} from "../../models/prodavnica";
import {ZaposleniService} from "../../services/zaposleni.service";
import {PublicFooter} from "../../shared/neregistrovan/footer/footer";
import {ZaposleniHeader} from "../../shared/zaposleni/header";
interface FormaPromocije {
  naziv: string;
  objekatId: string;
  datumPocetka: string;
  datumKraja: string;
  tipPopusta: TipPopusta;
  vrednostPopusta: number | null;
  sport: string;
}
interface FormaOpreme {
  naziv: string;
  sport: string;
  cena: number | null;
  stanje: number | null;
}
type StatusFilterPorudzbine = "" | "naruceno" | "preuzeto" | "otkazano";
@Component({
  selector: "app-promocije",
  standalone: true,
  imports: [CommonModule,FormsModule,ZaposleniHeader,PublicFooter],
  templateUrl: "./promocije.html",
  styleUrl: "./promocije.css"
})
export class PromocijeComponent implements OnInit {
  private zaposleniService = inject(ZaposleniService);
  private router = inject(Router);
  username = "";
  objekti: Objekat[] = [];
  promocije: Promocija[] = [];
  oprema: Oprema[] = [];
  porudzbine: Porudzbina[] = [];
  sportovi = ['Atletika','Badminton','Biciklizam','Borilački sportovi','Fudbal','Gimnastika','Košarka','Odbojka','Plivanje','Rukomet','Skijanje','Stoni tenis','Tenis','Vaterpolo','Fitnes'];
  formaPromocije: FormaPromocije = this.praznaFormaPromocije();
  formaOpreme: FormaOpreme = this.praznaFormaOpreme();
  promocijaZaIzmenuId = "";
  opremaZaIzmenuId = "";
  izabraniObjekatFilter = "";
  nazivOpremeFilter = "";
  sportOpremeFilter = "";
  statusPorudzbineFilter: StatusFilterPorudzbine = "";
  ucitavanjeObjekata = false;
  ucitavanjePromocija = false;
  ucitavanjeOpreme = false;
  ucitavanjePorudzbina = false;
  cuvanjePromocije = false;
  cuvanjeOpreme = false;
  brisanjeIsteklihPromocija = false;
  brisanjeOtkazanihPorudzbina = false;
  obradaPorudzbineId = "";
  porukaPromocije = "";
  greskaPromocije = "";
  porukaOpreme = "";
  greskaOpreme = "";
  poruka = "";
  greska = "";
  slikaOpreme: File | null = null;
  pregledSlikeOpreme = "/logo.png";
  postojecaSlikaOpreme = "logo.png";
  ngOnInit(): void {
    const sacuvaniKorisnik = localStorage.getItem("currentUser");
    if(!sacuvaniKorisnik) {
      this.router.navigate(["/prijava"]);
      return;
    }
    const korisnik = JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== "zaposleni") {
      this.router.navigate(["/"]);
      return;
    }
    this.username = korisnik.username;
    this.ucitajObjekte();
    this.ucitajPromocije();
    this.ucitajOpremu();
    this.ucitajPorudzbine();
  }

  ucitajObjekte(): void {
    this.ucitavanjeObjekata = true;
    this.greska = "";
    this.zaposleniService.dohvatiObjekteZaposlenog(this.username).subscribe({
      next: objekti => {
        this.objekti = objekti;
        this.ucitavanjeObjekata = false;
      },
      error: error => {
        this.greska = error.error?.message || "Nije moguće učitati sportske objekte.";
        this.ucitavanjeObjekata = false;
      }
    });
  }

  ucitajPromocije(): void {
    this.ucitavanjePromocija = true;
    this.greska = "";
    this.zaposleniService.dohvatiPromocijeZaposlenog(this.username).subscribe({
      next: promocije => {
        this.promocije = promocije;
        this.ucitavanjePromocija = false;
      },
      error: error => {
        this.greska = error.error?.message || "Nije moguće učitati promocije.";
        this.ucitavanjePromocija = false;
      }
    });
  }

  obrisiIsteklePromocije(): void {
    const brojIsteklih = this.promocije.filter(promocija => promocija.datumKraja < this.danasnjiDatum()).length;
    if(brojIsteklih === 0) {
      this.greskaPromocije = "Nema isteklih promocija za brisanje.";
      return;
    }
    const potvrda = window.confirm(`Da li želite da obrišete ${brojIsteklih} isteklih promocija?`);
    if(!potvrda) {
      return;
    }
    this.porukaPromocije = "";
    this.greskaPromocije = "";
    this.brisanjeIsteklihPromocija = true;
    this.zaposleniService.obrisiIsteklePromocije(this.username).subscribe({
      next: odgovor => {
        this.porukaPromocije = odgovor.message;
        this.brisanjeIsteklihPromocija = false;
        this.ucitajPromocije();
      },
      error: error => {
        this.greskaPromocije = error.error?.message || "Istekle promocije trenutno nije moguće obrisati.";
        this.brisanjeIsteklihPromocija = false;
      }
    });
  }

  promenjenObjekatForme(): void {
    const sportovi = this.sportoviIzabranogObjekta();
    if(this.formaPromocije.sport && !sportovi.includes(this.formaPromocije.sport)) {
      this.formaPromocije.sport = "";
    }
  }

  sportoviIzabranogObjekta(): string[] {
    const objekat = this.objekti.find(objekat => objekat.id === this.formaPromocije.objekatId);
    return objekat ? objekat.sportovi: [];
  }

  filtriranePromocije(): Promocija[] {
    if(!this.izabraniObjekatFilter) {
      return this.promocije;
    }
    return this.promocije.filter(promocija => promocija.objekatId === this.izabraniObjekatFilter);
  }

  sacuvajPromociju(): void {
    this.porukaPromocije = "";
    this.greskaPromocije = "";
    const forma = this.formaPromocije;
    if(!forma.naziv.trim() || !forma.objekatId || !forma.datumPocetka || !forma.datumKraja || forma.vrednostPopusta === null) {
      this.greskaPromocije = "Naziv, objekat, period i popust su obavezni.";
      return;
    }
    const danas = this.danasnjiDatum();
    if(forma.datumPocetka <= danas) {
      this.greskaPromocije = "Datum početka promocije mora biti posle današnjeg datuma.";
      return;
    }
    if(forma.datumPocetka >= forma.datumKraja) {
      this.greskaPromocije = "Datum početka promocije mora biti pre datuma završetka.";
      return;
    }
    if(forma.vrednostPopusta <= 0) {
      this.greskaPromocije = "Vrednost popusta mora biti veća od nule.";
      return;
    }
    if(forma.tipPopusta === "procenat" && forma.vrednostPopusta > 100) {
      this.greskaPromocije = "Procentualni popust ne može biti veći od 100%.";
      return;
    }
    const podaci = { naziv: forma.naziv.trim(),objekatId: forma.objekatId,datumPocetka: forma.datumPocetka,datumKraja: forma.datumKraja,tipPopusta: forma.tipPopusta,vrednostPopusta: forma.vrednostPopusta,sport: forma.sport || null };
    this.cuvanjePromocije = true;
    if(this.promocijaZaIzmenuId) {
      this.zaposleniService.azurirajPromociju(this.username,this.promocijaZaIzmenuId,podaci).subscribe({
        next: odgovor => {
          this.porukaPromocije = odgovor.message;
          this.cuvanjePromocije = false;
          this.ponistiFormuPromocije();
          this.ucitajPromocije();
        },
        error: error => {
          this.greskaPromocije = error.error?.message || "Promociju nije moguće ažurirati.";
          this.cuvanjePromocije = false;
        }
      });
      return;
    }
    this.zaposleniService.kreirajPromociju(this.username,podaci).subscribe({
      next: odgovor => {
        this.porukaPromocije = odgovor.message;
        this.cuvanjePromocije = false;
        this.ponistiFormuPromocije();
        this.ucitajPromocije();
      },
      error: error => {
        this.greskaPromocije = error.error?.message || "Promociju nije moguće kreirati.";
        this.cuvanjePromocije = false;
      }
    });
  }

  izmeniPromociju(promocija: Promocija): void {
    this.promocijaZaIzmenuId = promocija.id;
    this.formaPromocije = { naziv: promocija.naziv,objekatId: promocija.objekatId,datumPocetka: promocija.datumPocetka,datumKraja: promocija.datumKraja,tipPopusta: promocija.tipPopusta,vrednostPopusta: promocija.vrednostPopusta,sport: promocija.sport || "" };
    this.porukaPromocije = "";
    this.greskaPromocije = "";
    document.getElementById("forma-promocije")
      ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  ponistiFormuPromocije(): void {
    this.promocijaZaIzmenuId = "";
    this.formaPromocije = this.praznaFormaPromocije();
  }

  tekstPopusta(promocija: Promocija): string {
    if(promocija.tipPopusta === "procenat") {
      return `${promocija.vrednostPopusta}%`;
    }
    return `${promocija.vrednostPopusta} RSD`;
  }

  promocijaAktivna(promocija: Promocija): boolean {
    const danas = this.danasnjiDatum();
    return (promocija.datumPocetka <= danas && promocija.datumKraja >= danas);
  }

  ucitajOpremu(): void {
    this.ucitavanjeOpreme = true;
    this.greska = "";
    this.zaposleniService.dohvatiOpremu().subscribe({
      next: oprema => {
        this.oprema = oprema;
        this.ucitavanjeOpreme = false;
      },
      error: error => {
        this.greska = error.error?.message || "Nije moguće učitati katalog opreme.";
        this.ucitavanjeOpreme = false;
      }
    });
  }

  sportoviOpreme(): string[] {
    const sportovi: string[] = [];
    for(const proizvod of this.oprema) {
      if(!sportovi.includes(proizvod.sport)) {
        sportovi.push(proizvod.sport);
      }
    }
    sportovi.sort();
    return sportovi;
  }

  filtriranaOprema(): Oprema[] {
    const naziv = this.nazivOpremeFilter.trim().toLowerCase();
    return this.oprema.filter(proizvod => {
      const odgovaraNaziv = !naziv || proizvod.naziv.toLowerCase().includes(naziv);
      const odgovaraSport = !this.sportOpremeFilter || proizvod.sport === this.sportOpremeFilter;
      return odgovaraNaziv && odgovaraSport;
    });
  }

  izabranaSlikaOpreme(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fajl = input.files?.[0];
    if(!fajl) {
      this.slikaOpreme = null;
      return;
    }
    if(!fajl.type.startsWith("image/")) {
      this.greskaOpreme = "Možete izabrati samo fajl slike.";
      input.value = "";
      this.slikaOpreme = null;
      return;
    }
    if(fajl.size > 5 * 1024 * 1024) {
      this.greskaOpreme = "Slika ne može biti veća od 5 MB.";
      input.value = "";
      this.slikaOpreme = null;
      return;
    }
    this.slikaOpreme = fajl;
    this.pregledSlikeOpreme = URL.createObjectURL(fajl);
    this.greskaOpreme = "";
  }

  ukloniIzabranuSliku(input: HTMLInputElement): void {
    this.slikaOpreme = null;
    input.value = "";
    if(this.opremaZaIzmenuId) {
      this.pregledSlikeOpreme = this.putanjaSlike(this.postojecaSlikaOpreme);
      return;
    }
    this.pregledSlikeOpreme = "/logo.png";
  }

  sacuvajOpremu(): void {
    this.porukaOpreme = "";
    this.greskaOpreme = "";
    const forma = this.formaOpreme;
    if(!forma.naziv.trim() || !forma.sport.trim() || forma.cena === null || forma.stanje === null) {
      this.greskaOpreme = "Naziv, sport, cena i stanje su obavezni.";
      return;
    }
    if(forma.cena <= 0) {
      this.greskaOpreme = "Cena mora biti veća od nule.";
      return;
    }
    if(forma.stanje < 0 || !Number.isInteger(forma.stanje)) {
      this.greskaOpreme = "Stanje mora biti ceo broj veći ili jednak nuli.";
      return;
    }
    const oprema = { id: this.opremaZaIzmenuId,naziv: forma.naziv.trim(),sport: forma.sport.trim(),cena: forma.cena,stanje: forma.stanje };
    this.cuvanjeOpreme = true;
    if(this.opremaZaIzmenuId) {
      this.zaposleniService.azurirajOpremu(oprema,this.slikaOpreme).subscribe({
        next: odgovor => {
          this.porukaOpreme = odgovor.message;
          this.cuvanjeOpreme = false;
          this.ponistiFormuOpreme();
          this.ucitajOpremu();
        },
        error: error => {
          this.greskaOpreme = error.error?.message || "Opremu nije moguće ažurirati.";
          this.cuvanjeOpreme = false;
        }
      });
      return;
    }
    this.zaposleniService.dodajOpremu(oprema,this.slikaOpreme).subscribe({
      next: odgovor => {
        this.porukaOpreme = odgovor.message;
        this.cuvanjeOpreme = false;
        this.ponistiFormuOpreme();
        this.ucitajOpremu();
      },
      error: error => {
        this.greskaOpreme = error.error?.message || "Opremu nije moguće dodati.";
        this.cuvanjeOpreme = false;
      }
    });
  }

  izmeniOpremu(proizvod: Oprema): void {
    this.opremaZaIzmenuId = proizvod.id;
    this.formaOpreme = { naziv: proizvod.naziv,sport: proizvod.sport,cena: proizvod.cena,stanje: proizvod.stanje };
    this.slikaOpreme = null;
    this.postojecaSlikaOpreme = proizvod.slika || "logo.png";
    this.pregledSlikeOpreme = this.putanjaSlike(this.postojecaSlikaOpreme);
    this.porukaOpreme = "";
    this.greskaOpreme = "";
    document.getElementById("forma-opreme")
      ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  ponistiFormuOpreme(): void {
    this.opremaZaIzmenuId = "";
    this.formaOpreme = this.praznaFormaOpreme();
    this.slikaOpreme = null;
    this.postojecaSlikaOpreme = "logo.png";
    this.pregledSlikeOpreme = "/logo.png";
  }

  putanjaSlike(slika: string): string {
    if(!slika || slika === "logo.png") {
      return "/logo.png";
    }
    const delovi = slika.split("/");
    const nazivSlike = delovi[delovi.length - 1];
    return `/oprema/${nazivSlike}`;
  }

  greskaSlike(event: Event): void {
    const slika = event.target as HTMLImageElement;
    if(slika.src.endsWith("/logo.png"))
      return;
    slika.src = "/logo.png";
  }

  ucitajPorudzbine(): void {
    this.ucitavanjePorudzbina = true;
    this.greska = "";
    this.zaposleniService.dohvatiPorudzbine().subscribe({
      next: porudzbine => {
        this.porudzbine = porudzbine;
        this.ucitavanjePorudzbina = false;
      },
      error: error => {
        this.greska = error.error?.message || "Nije moguće učitati porudžbine.";
        this.ucitavanjePorudzbina = false;
      }
    });
  }

  filtriranePorudzbine(): Porudzbina[] {
    if(!this.statusPorudzbineFilter) {
      return this.porudzbine;
    }
    return this.porudzbine.filter(porudzbina => porudzbina.status === this.statusPorudzbineFilter);
  }

  oznaciKaoPreuzeto(porudzbina: Porudzbina): void {
    if(porudzbina.status !== "naruceno") {
      return;
    }
    const potvrda = window.confirm("Da li potvrđujete da je porudžbina preuzeta?");
    if(!potvrda) {
      return;
    }
    this.poruka = "";
    this.greska = "";
    this.obradaPorudzbineId = porudzbina.id;
    this.zaposleniService.oznaciPorudzbinuKaoPreuzetu(porudzbina.id).subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.obradaPorudzbineId = "";
        this.ucitajPorudzbine();
      },
      error: error => {
        this.greska = error.error?.message || "Status porudžbine nije moguće promeniti.";
        this.obradaPorudzbineId = "";
      }
    });
  }
  obrisiOtkazanePorudzbine(): void {
    const brojOtkazanih = this.porudzbine.filter(porudzbina => porudzbina.status === "otkazano").length;
    if(brojOtkazanih === 0) {
      this.greska = "Nema otkazanih porudžbina za brisanje.";
      return;
    }
    const potvrda = window.confirm(`Da li želite da obrišete ${brojOtkazanih} otkazanih porudžbina?`);
    if(!potvrda) {
      return;
    }
    this.poruka = "";
    this.greska = "";
    this.brisanjeOtkazanihPorudzbina = true;
    this.zaposleniService.obrisiOtkazanePorudzbine().subscribe({
      next: odgovor => {
        this.poruka = odgovor.message;
        this.brisanjeOtkazanihPorudzbina = false;
        this.ucitajPorudzbine();
      },
      error: error => {
        this.greska = error.error?.message || "Otkazane porudžbine trenutno nije moguće obrisati.";
        this.brisanjeOtkazanihPorudzbina = false;
      }
    });
  }

  otkaziPorudzbinu(porudzbina: Porudzbina): void {
    if(porudzbina.status !== "naruceno") {
      return;
    }
    const potvrda = window.confirm("Da li ste sigurni da želite da otkažete porudžbinu?");
    if(!potvrda) {
      return;
    }
    this.poruka = "";
    this.greska = "";
    this.obradaPorudzbineId = porudzbina.id;
    this.zaposleniService.otkaziPorudzbinu(porudzbina.id).subscribe({
      next: odgovor => {
        porudzbina.status = odgovor.status;
        this.poruka = odgovor.message;
        this.obradaPorudzbineId = "";
      },
      error: error => {
        this.greska = error.error?.message || "Porudžbinu trenutno nije moguće otkazati.";
        this.obradaPorudzbineId = "";
      }
    });
  }

  tekstStatusaPorudzbine(status: Porudzbina["status"]): string {
    if(status === "naruceno") {
      return "Prihvaćeno";
    }
    if(status === "preuzeto") {
      return "Preuzeto";
    }
    return "Otkazano";
  }

  brojStavki(porudzbina: Porudzbina): number {
    let broj = 0;
    for(const stavka of porudzbina.stavke) {
      broj += stavka.kolicina;
    }
    return broj;
  }

  formatirajDatumVreme(vrednost: string): string {
    const datum = new Date(vrednost);
    if(Number.isNaN(datum.getTime())) {
      return vrednost;
    }
    return datum.toLocaleString("sr-RS");
  }

  formatirajDatum(vrednost: string): string {
    const datum = new Date(vrednost);
    if(Number.isNaN(datum.getTime())) {
      return vrednost;
    }
    return datum.toLocaleDateString("sr-RS",{ day: "2-digit",month: "2-digit",year: "numeric" });
  }

  private praznaFormaPromocije(): FormaPromocije {
    return { naziv: "",objekatId: "",datumPocetka: "",datumKraja: "",tipPopusta: "procenat",vrednostPopusta: null,sport: "" };
  }

  private praznaFormaOpreme(): FormaOpreme {
    return { naziv: "",sport: "",cena: null,stanje: null };
  }
  
  private danasnjiDatum(): string {
    const datum = new Date();
    const godina = datum.getFullYear();
    const mesec = String(datum.getMonth() + 1).padStart(2,"0");
    const dan = String(datum.getDate()).padStart(2,"0");
    return `${godina}-${mesec}-${dan}`;
  }
}