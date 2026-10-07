import {CommonModule} from "@angular/common";
import {Component,inject,OnInit} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {Trening,Trener} from "../../models/trening";
import {Objekat,Teren} from "../../models/objekti";
import {Promocija} from "../../models/neregistrovan";
import {SportistaService} from "../../services/sportista.service";
import {PublicFooter} from "../../shared/neregistrovan/footer/footer";
import {SportistaHeader} from "../../shared/sportista/header";

@Component({
  selector: "app-trening",
  imports: [CommonModule,FormsModule,SportistaHeader,PublicFooter],
  templateUrl: "./trening.html",
  styleUrl: "./trening.css"
})
export class TreningComponent implements OnInit {
  private sportistaService =inject(SportistaService);
  private router =inject(Router);
  username = "";
  objekti: Objekat[] = [];
  treneri: Trener[] = [];
  treninzi: Trening[] = [];
  promocije: Promocija[] = [];
  izabranaPromocijaId = "";
  objekatId = "";
  sport = "";
  teren = "";
  trenerId = "";
  datum = "";
  vreme = "";
  sviSati: number[] = [];
  slobodniSati: number[] = [];
  zauzetiTermini: string[] = [];
  minimalniDatum = "";
  poruka = "";
  greska = "";
  mozeDaZakazeTrening = true;
  proveraPravaZakazivanja = false;
  porukaZabraneZakazivanja = "";
  ucitavanjeTrenera = false;
  ucitavanjeTermina = false;
  ucitavanjeArhive = false;
  ucitavanjePromocija = false;
  zakazivanje = false;
  prikaziArhivu = false;

  ngOnInit(): void {
    const sacuvaniKorisnik =localStorage.getItem("currentUser");
    if(!sacuvaniKorisnik) {
      this.router.navigate(["/prijava"]);
      return;
    }
    const korisnik =JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== "sportista") {
      this.router.navigate(["/"]);
      return;
    }
    this.username = korisnik.username;
    this.minimalniDatum = this.danasnjiDatum();
    this.ucitajObjekte();
  }

  ucitajObjekte(): void {
    this.greska = "";
    this.sportistaService.dohvatiObjekteZaTrening().subscribe({
        next: objekti => {
          this.objekti = objekti;
        },
        error: error => {
          this.objekti = [];
          this.greska = error.error?.message || "Nije moguće učitati sportske objekte.";
        }
      });
  }

  promenjenObjekat(): void {
    this.sport = "";
    this.teren = "";
    this.trenerId = "";
    this.datum = "";
    this.vreme = "";
    this.treneri = [];
    this.promocije = [];
    this.zauzetiTermini = [];
    this.slobodniSati = [];
    this.sviSati = [];
    this.izabranaPromocijaId = "";
    this.poruka = "";
    this.greska = "";
    this.mozeDaZakazeTrening = true;
    this.proveraPravaZakazivanja = false;
    this.porukaZabraneZakazivanja = "";
    if(!this.objekatId) {
      return;
    }
    const proveravaniObjekatId = this.objekatId;
    this.proveraPravaZakazivanja = true;
    this.sportistaService.proveriPravoZakazivanjaTreninga(this.username,proveravaniObjekatId).subscribe({
        next: () => {
          if(this.objekatId !== proveravaniObjekatId) {
            return;
          }
          this.proveraPravaZakazivanja = false;
          this.mozeDaZakazeTrening = true;
          this.postaviSateRadnogVremena();
          this.ucitajPromocije();
        },
        error: error => {
          if(this.objekatId !==proveravaniObjekatId) {
            return;
          }
          this.proveraPravaZakazivanja = false;
          this.mozeDaZakazeTrening = false;
          this.porukaZabraneZakazivanja = error.error?.message || "Nije moguće proveriti pravo zakazivanja.";
          this.greska = this.porukaZabraneZakazivanja;
        }
      });
  }

  promenjenSport(): void {
    this.teren = "";
    this.trenerId = "";
    this.datum = "";
    this.vreme = "";
    this.treneri = [];
    this.izabranaPromocijaId = "";
    this.zauzetiTermini = [];
    this.slobodniSati = [];
    if(!this.mozeDaZakazeTrening || this.proveraPravaZakazivanja) {
      return;
    }
    this.ucitajTrenere();
  }

  promenjenTeren(): void {
    this.datum = "";
    this.vreme = "";
    this.izabranaPromocijaId = "";
    this.zauzetiTermini = [];
    this.slobodniSati = [];
  }

  promenjenTrener(): void {
    this.datum = "";
    this.vreme = "";
    this.izabranaPromocijaId = "";
    this.zauzetiTermini = [];
    this.slobodniSati = [];
  }

  promenjenDatum(): void {
    this.vreme = "";
    this.izabranaPromocijaId = "";
    this.zauzetiTermini = [];
    this.slobodniSati = [];

    if(
      !this.mozeDaZakazeTrening ||
      this.proveraPravaZakazivanja
    ) {
      return;
    }

    this.ucitajSlobodneTermine();
  }

  ucitajPromocije(): void {
    this.promocije = [];
    this.izabranaPromocijaId = "";
    if(!this.objekatId || !this.mozeDaZakazeTrening || this.proveraPravaZakazivanja) {
      return;
    }

    this.ucitavanjePromocija = true;

    this.sportistaService
      .dohvatiPromocijeObjekta(
        this.objekatId
      )
      .subscribe({
        next: promocije => {
          this.promocije = promocije;
          this.ucitavanjePromocija = false;
        },
        error: () => {
          this.promocije = [];
          this.ucitavanjePromocija = false;
        }
      });
  }

  dostupnePromocije(): Promocija[] {
    if(!this.mozeDaZakazeTrening || !this.objekatId || !this.sport || !this.datum) {
      return [];
    }
    const izabraniDatum = this.samoDatum(this.datum);
    return this.promocije.filter(
      promocija => {
        const datumPocetka = this.samoDatum(promocija.datumPocetka);
        const datumKraja = this.samoDatum(promocija.datumKraja);
        const odgovaraObjekat = promocija.objekatId === this.objekatId;
        const odgovaraSport = promocija.sport === null || promocija.sport === this.sport;
        const odgovaraDatum = datumPocetka <= izabraniDatum && datumKraja >= izabraniDatum;
        return odgovaraObjekat && odgovaraSport && odgovaraDatum;
      }
    );
  }

  izaberiPromociju(promocijaId: string) {
    if(!this.mozeDaZakazeTrening) {
      return;
    }
    if(this.izabranaPromocijaId === promocijaId) {
      this.izabranaPromocijaId = "";
    } else {
      this.izabranaPromocijaId = promocijaId;
    }
  }

  izabranaPromocija(): Promocija | undefined {
    return this.dostupnePromocije().find(
      promocija => promocija.id === this.izabranaPromocijaId
    );
  }

  cenaTreninga(): number {
    const trener = this.izabraniTrener();
    if(!trener) {return 0;}
    let cena = trener.cenaPoSatu;
    const promocija = this.izabranaPromocija();
    if(!promocija) {return cena;}
    if(promocija.tipPopusta === "procenat") {
      cena = cena - cena * promocija.vrednostPopusta / 100;
    } else {
      cena = cena - promocija.vrednostPopusta;
    }
    return Math.max(0,Math.round(cena));
  }

  tekstPopusta(promocija: Promocija): string {
    if(promocija.tipPopusta ==="procenat") {
      return `${promocija.vrednostPopusta}% popusta`;
    }
    return `${promocija.vrednostPopusta} RSD popusta`;
  }

  sportoviIzabranogObjekta(): string[] {
    if(!this.mozeDaZakazeTrening || this.proveraPravaZakazivanja) {
      return [];
    }

    const objekat =
      this.izabraniObjekat();

    return objekat
      ? objekat.sportovi
      : [];
  }

  tereniIzabranogSporta(): Teren[] {
    if(!this.mozeDaZakazeTrening) {return [];}
    const objekat = this.izabraniObjekat();
    if(!objekat || !this.sport) {return [];}
    return objekat.tereni.filter(
      terenObjekta =>terenObjekta.sport === this.sport
    );
  }

  ucitajTrenere(): void {
    if(!this.mozeDaZakazeTrening || this.proveraPravaZakazivanja || !this.objekatId || !this.sport) {
      return;
    }
    this.ucitavanjeTrenera = true;
    this.greska = "";
    this.sportistaService.dohvatiTrenere(this.objekatId,this.sport).subscribe({
        next: treneri => {
          this.treneri = treneri;
          this.ucitavanjeTrenera = false;
        },
        error: error => {
          this.greska = error.error?.message || "Nije moguće učitati trenere.";
          this.ucitavanjeTrenera = false;
        }
      });
  }

  ucitajSlobodneTermine(): void {
    this.vreme = "";
    this.zauzetiTermini = [];
    this.slobodniSati = [];
    if(!this.mozeDaZakazeTrening || this.proveraPravaZakazivanja || !this.trenerId || !this.objekatId || !this.teren || !this.datum) {
      return;
    }
    this.ucitavanjeTermina = true;
    this.greska = "";
    this.sportistaService.dohvatiZauzeteTermine(this.trenerId,this.objekatId,this.teren,this.datum).subscribe({
        next: zauzetiTermini => {
          this.zauzetiTermini = zauzetiTermini;
          this.slobodniSati = [];
          for(const sat of this.sviSati) {
            const vreme = `${String(sat).padStart(2,"0")}:00`;
            if(!this.zauzetiTermini.includes(vreme)) {
              this.slobodniSati.push(sat);
            }
          }
          this.ucitavanjeTermina = false;
        },
        error: error => {
          this.greska = error.error?.message || "Nije moguće učitati slobodne termine.";
          this.ucitavanjeTermina = false;
        }
      });
  }

  zakaziTrening(): void {
    this.poruka = "";
    this.greska = "";
    this.minimalniDatum = this.danasnjiDatum();
    if(!this.mozeDaZakazeTrening || this.proveraPravaZakazivanja) {
      this.greska = this.porukaZabraneZakazivanja || "Nemate pravo da zakažete trening u ovom objektu.";
      return;
    }
    if(!this.objekatId || !this.sport || !this.teren || !this.trenerId || !this.datum || !this.vreme) {
      this.greska = "Sva polja su obavezna.";
      return;
    }
    if(this.datum < this.minimalniDatum) {
      this.greska = "Datum ne može biti u prošlosti.";
      return;
    }

    const objekat =
      this.izabraniObjekat();

    if(!objekat) {
      this.greska =
        "Izabrani objekat nije pronađen.";
      return;
    }

    const pocetakRadnogVremena =
      this.vremeUMinute(
        objekat.radnoVremeOd
      );

    const krajRadnogVremena =
      this.vremeKrajaUMinute(
        objekat.radnoVremeDo
      );

    const pocetakTreninga =
      this.vremeUMinute(this.vreme);

    const krajTreninga =
      pocetakTreninga + 60;

    if(
      pocetakTreninga <
        pocetakRadnogVremena ||
      krajTreninga >
        krajRadnogVremena
    ) {
      this.greska =
        `Termin mora biti u radnom vremenu objekta ${objekat.radnoVremeOd}–${objekat.radnoVremeDo}.`;

      return;
    }

    if(
      this.zauzetiTermini.includes(
        this.vreme
      )
    ) {
      this.greska =
        "Izabrani trener ili teren su već zauzeti u ovom terminu.";

      this.ucitajSlobodneTermine();
      return;
    }

    this.zakazivanje = true;

    this.sportistaService
      .zakaziTrening(
        this.username,
        this.trenerId,
        this.objekatId,
        this.teren,
        this.datum,
        this.vreme,
        this.izabranaPromocijaId
      )
      .subscribe({
        next: odgovor => {
          this.poruka =
            odgovor.message;

          this.zakazivanje = false;
          this.izabranaPromocijaId = "";

          this.ucitajSlobodneTermine();

          if(this.prikaziArhivu) {
            this.ucitajArhivu();
          }
        },
        error: error => {
          this.zakazivanje = false;

          if(error.status === 403) {
            this.blokirajZakazivanje(
              error.error?.message ||
              "Nemate pravo da zakažete trening u ovom objektu."
            );

            return;
          }

          this.ucitajSlobodneTermine();

          this.greska =
            error.error?.message ||
            "Nije moguće zakazati trening.";
        }
      });
  }
  mozeDaOtkazeTrening(trening: Trening): boolean {
    if(trening.status !== "zakazan") {return false;}
    const pocetakTreninga = new Date(trening.pocetak);
    return pocetakTreninga.getTime() - Date.now() >= 12 * 60 * 60 * 1000;
  }
  promeniPrikazArhive(): void {
    this.prikaziArhivu = !this.prikaziArhivu;
    if(this.prikaziArhivu) {
      this.ucitajArhivu();
    }
  }

  ucitajArhivu(): void {
    this.ucitavanjeArhive = true;
    this.greska = "";
    this.sportistaService.dohvatiArhivuTreninga(this.username).subscribe({
        next: treninzi => {
          this.treninzi = treninzi;
          this.ucitavanjeArhive = false;
        },
        error: error => {
          this.greska =  error.error?.message || "Nije moguće učitati arhivu treninga.";
          this.ucitavanjeArhive = false;
        }
      });
  }

  otkaziTrening(trening: Trening): void {
    this.poruka = "";
    this.greska = "";
    const pocetakTreninga = new Date(trening.pocetak);
    const vremeDoPocetka = pocetakTreninga.getTime() - Date.now();
    if(vremeDoPocetka < 12 * 60 * 60 * 1000) {
      this.greska ="Trening je moguće otkazati najmanje 12 sata ranije.";
      return;
    }
    const potvrda = window.confirm("Da li sigurno želite da otkažete trening?");
    if(!potvrda) {
      return;
    }
    this.sportistaService.otkaziTrening(trening.id,this.username).subscribe({
        next: odgovor => {
          this.poruka = odgovor.message;
          this.ucitajArhivu();
          if(this.trenerId === trening.trenerId && this.teren === trening.teren && this.datum === this.datumIzVrednosti(trening.pocetak)) {
            this.ucitajSlobodneTermine();
          }
        },
        error: error => {
          this.greska = error.error?.message || "Nije moguće otkazati trening.";
        }
      });
  }

  izabraniObjekat(): Objekat | undefined {
    return this.objekti.find(
      objekat => objekat.id === this.objekatId
    );
  }

  izabraniTrener(): Trener | undefined {
    return this.treneri.find(
      trener => trener.id === this.trenerId
    );
  }

  tekstStatusa(status: string): string {
    if(status === "zakazan") {return "Zakazan";}
    if(status === "zavrsen") {return "Završen";}
    if(status === "otkazan") {return "Otkazan";}
    if(status === "neodrzan") {return "Neodržan";}
    return "";
  }

  formatirajDatumVreme(vrednost: string): string {
    const datum = new Date(vrednost);
    if(Number.isNaN(datum.getTime())) {return vrednost;}
    const dan = String(datum.getDate()).padStart(2,"0");
    const mesec = String(datum.getMonth() + 1).padStart(2,"0");
    const godina = datum.getFullYear();
    const sati = String(datum.getHours()).padStart(2,"0");
    const minuti = String(datum.getMinutes()).padStart(2,"0");
    return `${dan}.${mesec}.${godina}. ` + `${sati}:${minuti}`;
  }

  tekstRadnogVremena(): string {
    const objekat = this.izabraniObjekat();
    if(!objekat) {return "";}
    const kraj = objekat.radnoVremeDo === "24:00" ? "00:00" : objekat.radnoVremeDo;
    return `${objekat.radnoVremeOd}–${kraj}`;
  }

  tekstTermina(sat: number): string {
    const sledeciSat = (sat + 1) % 24;
    const pocetak = String(sat).padStart(2,"0");
    const kraj = String(sledeciSat).padStart(2,"0");
    return `${pocetak}:00–${kraj}:00`;
  }

  private postaviSateRadnogVremena(): void {
    this.sviSati = [];
    const objekat = this.izabraniObjekat();
    if(!objekat || !this.mozeDaZakazeTrening) {
      return;
    }
    const pocetniSat = this.vremeUMinute(objekat.radnoVremeOd) / 60;
    const krajnjiSat = this.vremeKrajaUMinute(objekat.radnoVremeDo) / 60;
    for(let sat = Math.floor(pocetniSat); sat < Math.ceil(krajnjiSat); sat++) {
      this.sviSati.push(sat);
    }
  }

  private blokirajZakazivanje(poruka: string): void {
    this.mozeDaZakazeTrening = false;
    this.porukaZabraneZakazivanja = poruka;
    this.greska = poruka;
    this.sport = "";
    this.teren = "";
    this.trenerId = "";
    this.datum = "";
    this.vreme = "";
    this.treneri = [];
    this.promocije = [];
    this.zauzetiTermini = [];
    this.slobodniSati = [];
    this.sviSati = [];
    this.izabranaPromocijaId = "";
  }

  private vremeUMinute(vreme: string): number {
    const [sat,minut] = vreme.split(":").map(Number);
    return sat * 60 + minut;
  }

  private vremeKrajaUMinute(vreme: string): number {
    if(vreme === "00:00") {return 24 * 60;}
    return this.vremeUMinute(vreme);
  }

  private samoDatum(vrednost: string): string {
    return String(vrednost || "").slice(0,10);
  }

  private danasnjiDatum(): string {
    const datum = new Date();
    const godina = datum.getFullYear();
    const mesec = String(datum.getMonth() + 1).padStart(2,"0");
    const dan =String(datum.getDate()).padStart(2,"0");
    return `${godina}-${mesec}-${dan}`;
  }

  private datumIzVrednosti(vrednost: string): string {
    const datum = new Date(vrednost);
    if(Number.isNaN(datum.getTime())) {return "";}
    const godina = datum.getFullYear();
    const mesec = String(datum.getMonth() + 1).padStart(2,"0");
    const dan = String(datum.getDate()).padStart(2,"0");
    return `${godina}-${mesec}-${dan}`;
  }
}