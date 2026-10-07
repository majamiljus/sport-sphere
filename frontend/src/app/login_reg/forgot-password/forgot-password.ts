import {Component,inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {PublicHeader} from '../../shared/neregistrovan/header/header';
import {LoginReg} from '../../shared/login_reg/login_reg';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule,RouterLink,LoginReg,PublicFooter,PublicHeader],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  identifikator = '';
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'error';

  submit(): void {
    this.message = '';
    if(!this.identifikator.trim()) {
      this.messageType = 'error';
      this.message = 'Korisničko ime ili imejl adresa su obavezni.';
      return;
    }
    this.loading = true;
    this.authService.zahtevajPromenuLozinke(this.identifikator.trim()).subscribe({
      next: () => {
        this.messageType = 'success';
        this.message = 'Ako nalog postoji, poslat je privremeni link za postavljanje nove lozinke. Link važi 30 minuta.';
        this.loading = false;
      },
      error: () => {
        this.messageType = 'error';
        this.message = 'Zahtev za promenu lozinke nije moguće poslati.';
        this.loading = false;
      }
    });
  }
}