import {Component,inject} from '@angular/core';
import {Router,RouterLink,RouterLinkActive} from '@angular/router';
import {StavkaKorpe} from '../../models/prodavnica';

@Component({
  selector: 'app-sportista-header',
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class SportistaHeader {
  private readonly router = inject(Router);

  ukupanBrojProizvoda(): number {
    const sacuvanaKorpa = localStorage.getItem('korpa');
    if(!sacuvanaKorpa) {
      return 0;
    }
    try {
      const korpa: StavkaKorpe[] = JSON.parse(sacuvanaKorpa);
      let ukupno = 0;
      for(const stavka of korpa) {
        ukupno += stavka.kolicina;
      }
      return ukupno;
    } catch {
      localStorage.removeItem('korpa');
      return 0;
    }
  }

  odjaviSe(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/prijava']);
  }
}