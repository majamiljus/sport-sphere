import {CommonModule} from '@angular/common';
import {Component,inject,OnInit} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {Objekat} from '../../models/objekti';
import {NeregistrovanService} from '../../services/index.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {PublicHeader} from '../../shared/neregistrovan/header/header';

@Component({
  selector: 'app-objekat-detalji',
  imports: [
    CommonModule,
    RouterLink,
    PublicHeader,
    PublicFooter
  ],
  templateUrl: './objekat_detalji.html',
  styleUrl: './objekat_detalji.css'
})
export class ObjekatDetalji implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly neregistrovanService = inject(NeregistrovanService);

  objekat: Objekat | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if(!id) {
      this.errorMessage = 'Objekat nije pronađen.';
      this.loading = false;
      return;
    }

    this.neregistrovanService.dohvatiObjekat(id).subscribe({
      next: objekat => {
        this.objekat = objekat;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Objekat nije pronađen ili nije aktivan.';
        this.loading = false;
      }
    });
  }
}