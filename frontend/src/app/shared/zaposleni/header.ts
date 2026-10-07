import {Component,inject} from '@angular/core';
import {Router,RouterLink,RouterLinkActive} from '@angular/router';


@Component({
  selector: 'app-zaposleni-header',
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class ZaposleniHeader {
  private readonly router = inject(Router);
  odjaviSe(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/prijava']);
  }
}