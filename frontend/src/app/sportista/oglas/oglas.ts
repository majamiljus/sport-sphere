import {Component,inject,OnInit} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {Oglas} from "../../models/oglas";
import {SportistaService} from "../../services/sportista.service";
import {PublicFooter} from "../../shared/neregistrovan/footer/footer";
import {SportistaHeader} from "../../shared/sportista/header";

@Component({
  selector: "app-oglas",
  imports: [FormsModule,SportistaHeader,PublicFooter],
  templateUrl: "./oglas.html",
  styleUrl: "./oglas.css"
})
export class OglasComponent implements OnInit {
  private sportistaService = inject(SportistaService);
  private router = inject(Router);

  oglasi: Oglas[] = [];
  zatvoreniOglasi: Oglas[] = [];
  username = "";
  minimalniDatum = "";
  poruka = "";
  greska = "";
  ucitavanje = false;
  slanje = false;
  prikaziZatvorene = false;
  ucitavanjeZatvorenih = false;

  sportovi = ['Atletika','Badminton','Biciklizam','Borilački sportovi','Fudbal','Gimnastika','Košarka','Odbojka','Plivanje','Rukomet','Skijanje','Stoni tenis','Tenis','Vaterpolo','Fitnes'];

  sati: string[] = ["00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];

  noviOglas: Oglas = {
    id: "",
    username: "",
    ime: "",
    prezime: "",
    sport: "",
    grad: "",
    datum: "",
    vremeOd: "",
    vremeDo: "",
    brojNedostajucihIgraca: 1,
    status: "aktivan",
    zahtevi: []
  };

  ngOnInit(): void {
    this.minimalniDatum = this.danasnjiDatum();

    const sacuvaniKorisnik = localStorage.getItem("currentUser");
    if(!sacuvaniKorisnik) {
      this.router.navigate(["/prijava"]);
      return;
    }

    try {
      const korisnik = JSON.parse(sacuvaniKorisnik);
      this.username = korisnik.username;
      this.noviOglas.username = korisnik.username;
      this.noviOglas.ime = korisnik.ime;
      this.noviOglas.prezime = korisnik.prezime;
    } catch {
      localStorage.removeItem("currentUser");
      this.router.navigate(["/prijava"]);
      return;
    }

    this.ucitajOglase();
  }

  ucitajOglase(): void {
    this.ucitavanje = true;
    this.greska = "";

    this.sportistaService.dohvatiAktivneOglase(this.username).subscribe({
      next: (oglasi) => {
        this.oglasi = oglasi;
        this.ucitavanje = false;
      },
      error: (error) => {
        this.greska = error.error?.message || "Nije moguće učitati oglase.";
        this.ucitavanje = false;
      }
    });
  }

  moguciKrajeviTermina(): string[] {
    if(!this.noviOglas.vremeOd) {return [];}
    return this.sati.filter(sat => sat > this.noviOglas.vremeOd);
  }

  promenjenPocetakTermina(): void {
    if(this.noviOglas.vremeDo && this.noviOglas.vremeDo <= this.noviOglas.vremeOd) {
      this.noviOglas.vremeDo = "";
    }
  }

  objaviOglas(): void {
    this.poruka = "";
    this.greska = "";
    this.minimalniDatum = this.danasnjiDatum();

    if(!this.noviOglas.sport || !this.noviOglas.grad.trim() || !this.noviOglas.datum || !this.noviOglas.vremeOd || !this.noviOglas.vremeDo) {
      this.greska = "Sva polja su obavezna.";
      return;
    }

    if(this.noviOglas.datum < this.minimalniDatum) {
      this.greska = "Datum ne može biti u prošlosti.";
      return;
    }

    if(!this.sati.includes(this.noviOglas.vremeOd) || !this.sati.includes(this.noviOglas.vremeDo)) {
      this.greska = "Početak i kraj termina moraju biti na pun sat.";
      return;
    }

    if(this.noviOglas.vremeOd >= this.noviOglas.vremeDo) {
      this.greska = "Vreme završetka mora biti nakon vremena početka.";
      return;
    }

    const brojIgraca = Number(this.noviOglas.brojNedostajucihIgraca);
    if(!Number.isInteger(brojIgraca) || brojIgraca < 1) {
      this.greska = "Broj igrača mora biti pozitivan ceo broj.";
      return;
    }

    this.noviOglas.brojNedostajucihIgraca = brojIgraca;
    this.slanje = true;

    this.sportistaService.objaviOglas(this.noviOglas).subscribe({
      next: (odgovor) => {
        const ime = this.noviOglas.ime;
        const prezime = this.noviOglas.prezime;

        this.poruka = odgovor.message || "Dodat novi oglas";
        this.slanje = false;

        this.noviOglas = {
          id: "",
          username: this.username,
          ime,
          prezime,
          sport: "",
          grad: "",
          datum: "",
          vremeOd: "",
          vremeDo: "",
          brojNedostajucihIgraca: 1,
          status: "aktivan",
          zahtevi: []
        };

        this.ucitajOglase();
      },
      error: (error) => {
        this.greska = error.error?.message || "Nije moguće objaviti oglas.";
        this.slanje = false;
      }
    });
  }

  posaljiZahtev(oglas: Oglas): void {
    this.poruka = "";
    this.greska = "";

    this.sportistaService.posaljiZahtev(oglas.id,this.username).subscribe({
      next: (odgovor) => {
        this.poruka = odgovor.message;
        this.ucitajOglase();
      },
      error: (error) => {
        this.greska = error.error?.message || "Nije moguće poslati zahtev.";
      }
    });
  }

  obradiZahtev(oglas: Oglas,usernameZahtev: string,odluka: string): void {
    this.poruka = "";
    this.greska = "";

    this.sportistaService.obradiZahtev(oglas.id,usernameZahtev,this.username,odluka).subscribe({
      next: (odgovor) => {
        this.poruka = odgovor.message;
        this.ucitajOglase();

        if(this.prikaziZatvorene) {
          this.ucitajZatvoreneOglase();
        }
      },
      error: (error) => {
        this.greska = error.error?.message || "Nije moguće obraditi zahtev.";
      }
    });
  }

  zatvoriOglas(oglas: Oglas): void {
    const potvrda = window.confirm("Da li sigurno želite da zatvorite oglas?");
    if(!potvrda) {return;}

    this.poruka = "";
    this.greska = "";

    this.sportistaService.zatvoriOglas(oglas.id,this.username).subscribe({
      next: (odgovor) => {
        this.poruka = odgovor.message;
        this.ucitajOglase();

        if(this.prikaziZatvorene) {
          this.ucitajZatvoreneOglase();
        }
      },
      error: (error) => {
        this.greska = error.error?.message || "Nije moguće zatvoriti oglas.";
      }
    });
  }

  jeVlasnik(oglas: Oglas): boolean {
    return oglas.username === this.username;
  }

  statusMogZahteva(oglas: Oglas): string | null {
    return oglas.zahtevi.find(zahtev => zahtev.username === this.username)?.status || null;
  }

  tekstStatusa(status: string | null): string {
    if(status === "na_cekanju") {return "Zahtev je na čekanju";}
    if(status === "odobren") {return "Zahtev je odobren";}
    if(status === "odbijen") {return "Zahtev je odbijen";}
    return "";
  }

  formatirajDatum(datum: string): string {
    const delovi = datum.split("-");
    if(delovi.length !== 3) {return datum;}
    return `${delovi[2]}.${delovi[1]}.${delovi[0]}.`;
  }

  private danasnjiDatum(): string {
    const datum = new Date();
    const godina = datum.getFullYear();
    const mesec = String(datum.getMonth() + 1).padStart(2,"0");
    const dan = String(datum.getDate()).padStart(2,"0");
    return `${godina}-${mesec}-${dan}`;
  }

  promeniPrikazZatvorenih(): void {
    this.prikaziZatvorene = !this.prikaziZatvorene;

    if(this.prikaziZatvorene) {
      this.ucitajZatvoreneOglase();
    }
  }

  ucitajZatvoreneOglase(): void {
    this.ucitavanjeZatvorenih = true;
    this.greska = "";

    this.sportistaService.dohvatiZatvoreneOglase(this.username).subscribe({
      next: (oglasi) => {
        this.zatvoreniOglasi = oglasi;
        this.ucitavanjeZatvorenih = false;
      },
      error: (error) => {
        this.greska = error.error?.message || "Nije moguće učitati zatvorene oglase.";
        this.ucitavanjeZatvorenih = false;
      }
    });
  }

  tekstStatusaOglasa(status: string): string {
    if(status === "popunjen") {return "Oglas je popunjen";}
    if(status === "zatvoren") {return "Oglas je zatvoren";}
    if(status === "istekao") {return "Oglas je istekao";}
    return "";
  }

  tekstPovezanostiSaOglasom(oglas: Oglas): string {
    if(this.jeVlasnik(oglas)) {return "Moj oglas";}
    return "Poslali ste zahtev za ovaj oglas";
  }
}