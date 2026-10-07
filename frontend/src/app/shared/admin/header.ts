import {Component,inject} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class AdminHeader {
  private readonly router =
    inject(Router);

  odjaviSe(): void {
    localStorage.removeItem(
      'currentUser'
    );

    this.router.navigate([
      '/prijava'
    ]);
  }
}