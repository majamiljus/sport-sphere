import {CommonModule} from '@angular/common';
import {ChangeDetectorRef,Component,ElementRef,inject,OnDestroy,OnInit,ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Chart,ChartConfiguration,registerables} from 'chart.js';
import {PodaciStatistike} from '../../models/statistika';
import {SportistaService} from '../../services/sportista.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {SportistaHeader} from '../../shared/sportista/header';

Chart.register(...registerables);

@Component({
  selector: 'app-statistika',
  imports: [CommonModule,SportistaHeader,PublicFooter],
  templateUrl: './statistika.html',
  styleUrl: './statistika.css'
})
export class StatistikaComponent implements OnInit,OnDestroy {
  private readonly sportistaService =inject(SportistaService);
  private readonly router =inject(Router);
  private readonly changeDetector =inject(ChangeDetectorRef);

  @ViewChild('terminiGrafik')
  terminiGrafik?: ElementRef<HTMLCanvasElement>;

  @ViewChild('aktivnostGrafik')
  aktivnostGrafik?: ElementRef<HTMLCanvasElement>;

  @ViewChild('potrosnjaGrafik')
  potrosnjaGrafik?: ElementRef<HTMLCanvasElement>;

  podaci: PodaciStatistike | null = null;
  ucitavanje = true;
  greska = '';
  private grafikTermina: Chart | null = null;
  private grafikAktivnosti: Chart | null = null;
  private grafikPotrosnje: Chart | null = null;

  ngOnInit(): void {
    const sacuvaniKorisnik = localStorage.getItem('currentUser');
    if(!sacuvaniKorisnik) {
      this.router.navigate(['/prijava']);
      return;
    }
    const korisnik = JSON.parse(sacuvaniKorisnik);
    if(korisnik.tip !== 'sportista') {
      this.router.navigate(['/']);
      return;
    }
    this.ucitajStatistiku();
  }

  ngOnDestroy(): void {
    this.unistiGrafike();
  }

  ucitajStatistiku(): void {
    this.ucitavanje = true;
    this.greska = '';
    this.sportistaService.dohvatiStatistiku().subscribe({
        next: podaci => {
          this.podaci = podaci;
          this.ucitavanje = false;
          this.changeDetector.detectChanges();
          setTimeout(() => {
            this.nacrtajGrafike();
          },100);
        },
        error: greska => {
          this.greska = greska.error?.message || 'Statistiku trenutno nije moguće učitati.';
          this.ucitavanje = false;
          this.changeDetector.detectChanges();
        }
      });
  }

  nacrtajGrafike(): void {
    if(!this.podaci) {
      return;
    }
    this.unistiGrafike();
    this.nacrtajTerminePoSportovima();
    this.nacrtajMesecnuAktivnost();
    this.nacrtajPotrosnjuPoSportovima();
  }

  nacrtajTerminePoSportovima(): void {
    if(!this.podaci || !this.terminiGrafik || this.podaci.terminiPoSportovima.length === 0) {
      return;
    }
    const sportovi: string[] = [];
    const odigrani: number[] = [];
    const rezervisani: number[] = [];
    for(const podatak of this.podaci.terminiPoSportovima) {
      sportovi.push(podatak.sport);
      odigrani.push(podatak.odigrani);
      rezervisani.push(podatak.rezervisani);
    }
    this.grafikTermina = new Chart(this.terminiGrafik.nativeElement,
      {
        type: 'bar',
        data: {
          labels: sportovi,
          datasets: [
            {
              label: 'Odigrani termini',
              data: odigrani,
              backgroundColor: '#d96c1f'
            },
            {
              label: 'Rezervisani termini',
              data: rezervisani,
              backgroundColor: '#2f786b'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      }
    );
  }

  nacrtajMesecnuAktivnost(): void {
    if(!this.podaci || !this.aktivnostGrafik || this.podaci.mesecnaAktivnost.length === 0) {
      return;
    }
    const meseci: string[] = [];
    const odigrani: number[] = [];
    const rezervisani: number[] = [];
    for(const podatak of this.podaci.mesecnaAktivnost) {
      meseci.push(podatak.mesec);
      odigrani.push(podatak.odigrani);
      rezervisani.push(podatak.rezervisani);
    }
    this.grafikAktivnosti = new Chart(this.aktivnostGrafik.nativeElement,
      {
        type: 'line',
        data: {
          labels: meseci,
          datasets: [
            {
              label: 'Odigrani termini',
              data: odigrani,
              borderColor: '#d96c1f'
            },
            {
              label: 'Rezervisani termini',
              data: rezervisani,
              borderColor: '#2f786b'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      }
    );
  }

 nacrtajPotrosnjuPoSportovima(): void {
  if(!this.podaci || !this.potrosnjaGrafik || this.podaci.potrosnjaPoSportovima.length === 0) {
    return;
  }
  const sportovi: string[] = [];
  const potrosnja: number[] = [];
  for(const podatak of this.podaci.potrosnjaPoSportovima) {
    sportovi.push(podatak.sport);
    potrosnja.push(podatak.potrosnja);
  }
  this.grafikPotrosnje = new Chart(
    this.potrosnjaGrafik.nativeElement,
    {
      type: "polarArea",
      data: {
        labels: sportovi,
        datasets: [
          {
          label: "Potrošnja u RSD",
          data: potrosnja,
           backgroundColor: [
              "rgba(217,108,31,0.55)",
              "rgba(47,120,107,0.55)",
              "rgba(227,169,91,0.55)",
              "rgba(111,159,148,0.55)",
              "rgba(183,77,23,0.55)",
              "rgba(77,133,121,0.55)"
            ]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top"
          },
          title: {
            display: true,
            text: "Potrošnja po sportovima"
          }
        }
      }
    }
  );
}

  unistiGrafike(): void {
    if(this.grafikTermina) {
      this.grafikTermina.destroy();
      this.grafikTermina = null;
    }
    if(this.grafikAktivnosti) {
      this.grafikAktivnosti.destroy();
      this.grafikAktivnosti = null;
    }
    if(this.grafikPotrosnje) {
      this.grafikPotrosnje.destroy();
      this.grafikPotrosnje = null;
    }
  }
}