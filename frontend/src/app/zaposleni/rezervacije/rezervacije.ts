import {CommonModule} from '@angular/common';
import {Component,inject,OnDestroy,OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Rezervacija} from '../../models/sportista';
import {Trening} from '../../models/trening';
import {ZaposleniService} from '../../services/zaposleni.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {ZaposleniHeader} from '../../shared/zaposleni/header';

@Component({
  selector: 'app-rezervacije',
  imports: [CommonModule,ZaposleniHeader,PublicFooter],
  templateUrl: './rezervacije.html',
  styleUrl: './rezervacije.css'
})
export class Rezervacije implements OnInit,OnDestroy {
  private readonly zaposleniService = inject(ZaposleniService);
  private readonly router = inject(Router);

  username = '';
  rezervacije: Rezervacija[] = [];
  treninzi: Trening[] = [];
  loading = true;
  menjanjeStatusa = false;
  poruka = '';
  trenutnoVreme = new Date();
  intervalId: ReturnType<typeof setInterval> | null = null;

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
    this.ucitajPodatke();

    this.intervalId = setInterval(() => {
      this.trenutnoVreme = new Date();
    },30000);
  }

  ngOnDestroy(): void {
    if(this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ucitajPodatke(): void {
    this.loading = true;
    this.poruka = '';

    this.zaposleniService.dohvatiRezervacijeITreninge(this.username).subscribe({
      next: podaci => {
        this.rezervacije = podaci.rezervacije;
        this.treninzi = podaci.treninzi;
        this.sortirajRezervacije();
        this.sortirajTreninge();
        this.loading = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Rezervacije i treninge trenutno nije moguće učitati.';
        this.loading = false;
      }
    });
  }

  sortirajRezervacije(): void {
    const redosledStatusa: Record<string,number> = {
      zakazan: 1,
      zavrsen: 2,
      neodrzan: 3,
      otkazan: 4
    };

    this.rezervacije.sort((prva,druga) => {
      const razlikaStatusa = (redosledStatusa[prva.status] || 5) - (redosledStatusa[druga.status] || 5);

      if(razlikaStatusa !== 0) {
        return razlikaStatusa;
      }

      return new Date(druga.pocetak).getTime() - new Date(prva.pocetak).getTime();
    });
  }

  sortirajTreninge(): void {
    const redosledStatusa: Record<string,number> = {
      zakazan: 1,
      zavrsen: 2,
      neodrzan: 3,
      otkazan: 4
    };

    this.treninzi.sort((prvi,drugi) => {
      const razlikaStatusa = (redosledStatusa[prvi.status] || 5) - (redosledStatusa[drugi.status] || 5);

      if(razlikaStatusa !== 0) {
        return razlikaStatusa;
      }

      return new Date(drugi.pocetak).getTime() - new Date(prvi.pocetak).getTime();
    });
  }

  mozePromenaStatusa(pocetak: string,status: string): boolean {
    if(status !== 'zakazan') {
      return false;
    }

    const pocetakTermina = new Date(pocetak).getTime();
    const sada = this.trenutnoVreme.getTime();
    const desetMinutaPosle = pocetakTermina + 10 * 60 * 1000;

    return sada >= pocetakTermina && sada <= desetMinutaPosle;
  }

  odbijRezervaciju(rezervacija: Rezervacija): void {
    if(this.menjanjeStatusa) {
      return;
    }

    this.menjanjeStatusa = true;
    this.poruka = '';

    this.zaposleniService.odbijRezervaciju(this.username,rezervacija.id).subscribe({
      next: odgovor => {
        this.rezervacije = this.rezervacije.filter(
          trenutnaRezervacija => trenutnaRezervacija.id !== rezervacija.id
        );

        this.sortirajRezervacije();
        this.poruka = odgovor.message;
        this.menjanjeStatusa = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Rezervaciju trenutno nije moguće odbiti.';
        this.menjanjeStatusa = false;
      }
    });
  }

  potvrdiRezervaciju(rezervacija: Rezervacija): void {
    if(this.menjanjeStatusa) {
      return;
    }

    this.menjanjeStatusa = true;
    this.poruka = '';

    this.zaposleniService.potvrdiRezervaciju(this.username,rezervacija.id).subscribe({
      next: odgovor => {
        rezervacija.status = odgovor.status;
        this.sortirajRezervacije();
        this.poruka = odgovor.message;
        this.menjanjeStatusa = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Rezervaciju trenutno nije moguće potvrditi.';
        this.menjanjeStatusa = false;
      }
    });
  }

  odjaviRezervaciju(rezervacija: Rezervacija): void {
    if(this.menjanjeStatusa) {
      return;
    }

    this.menjanjeStatusa = true;
    this.poruka = '';

    this.zaposleniService.odjaviRezervaciju(this.username,rezervacija.id).subscribe({
      next: odgovor => {
        rezervacija.status = odgovor.status;
        this.sortirajRezervacije();
        this.poruka = odgovor.message;
        this.menjanjeStatusa = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Nedolazak trenutno nije moguće evidentirati.';
        this.menjanjeStatusa = false;
      }
    });
  }

  odbijTrening(trening: Trening): void {
    if(this.menjanjeStatusa) {
      return;
    }

    this.menjanjeStatusa = true;
    this.poruka = '';

    this.zaposleniService.odbijTrening(this.username,trening.id).subscribe({
      next: odgovor => {
        this.treninzi = this.treninzi.filter(
          trenutniTrening => trenutniTrening.id !== trening.id
        );

        this.sortirajTreninge();
        this.poruka = odgovor.message;
        this.menjanjeStatusa = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Trening trenutno nije moguće odbiti.';
        this.menjanjeStatusa = false;
      }
    });
  }

  potvrdiTrening(trening: Trening): void {
    if(this.menjanjeStatusa) {
      return;
    }

    this.menjanjeStatusa = true;
    this.poruka = '';

    this.zaposleniService.potvrdiTrening(this.username,trening.id).subscribe({
      next: odgovor => {
        trening.status = odgovor.status;
        this.sortirajTreninge();
        this.poruka = odgovor.message;
        this.menjanjeStatusa = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Trening trenutno nije moguće potvrditi.';
        this.menjanjeStatusa = false;
      }
    });
  }

  odjaviTrening(trening: Trening): void {
    if(this.menjanjeStatusa) {
      return;
    }

    this.menjanjeStatusa = true;
    this.poruka = '';

    this.zaposleniService.odjaviTrening(this.username,trening.id).subscribe({
      next: odgovor => {
        trening.status = odgovor.status;
        this.sortirajTreninge();
        this.poruka = odgovor.message;
        this.menjanjeStatusa = false;
      },
      error: greska => {
        this.poruka = greska.error?.message || 'Trening trenutno nije moguće odjaviti.';
        this.menjanjeStatusa = false;
      }
    });
  }

  prikaziDatum(datum: string): string {
    return new Date(datum).toLocaleDateString('sr-RS');
  }

  prikaziVreme(datum: string): string {
    return new Date(datum).toLocaleTimeString('sr-RS',{
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  nazivStatusa(status: string): string {
    if(status === 'zakazan') {
      return 'Zakazan';
    }

    if(status === 'otkazan') {
      return 'Otkazan';
    }

    if(status === 'zavrsen') {
      return 'Završen';
    }

    return 'Neodržan';
  }

  tekstBrojaRezervacija(): string {
    const broj = this.rezervacije.length;
    const poslednjeDveCifre = broj % 100;
    const poslednjaCifra = broj % 10;

    if(poslednjeDveCifre >= 11 && poslednjeDveCifre <= 14) {
      return 'rezervacija';
    }

    if(poslednjaCifra === 1) {
      return 'rezervacija';
    }

    if(poslednjaCifra >= 2 && poslednjaCifra <= 4) {
      return 'rezervacije';
    }

    return 'rezervacija';
  }

  tekstBrojaTreninga(): string {
    const broj = this.treninzi.length;
    const poslednjeDveCifre = broj % 100;
    const poslednjaCifra = broj % 10;

    if(poslednjeDveCifre >= 11 && poslednjeDveCifre <= 14) {
      return 'treninga';
    }

    if(poslednjaCifra === 1) {
      return 'trening';
    }

    if(poslednjaCifra >= 2 && poslednjaCifra <= 4) {
      return 'treninga';
    }

    return 'treninga';
  }
}