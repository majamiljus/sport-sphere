import {Component,inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router,RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {PublicFooter} from '../../shared/neregistrovan/footer/footer';
import {PublicHeader} from '../../shared/neregistrovan/header/header';
import {LoginReg} from '../../shared/login_reg/login_reg';

@Component({
  selector: 'app-login',
  imports: [FormsModule,RouterLink,LoginReg,PublicFooter,PublicHeader],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  username = '';
  password = '';
  showPassword = false;
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'error';

  submit(): void {
    this.message = '';
    if(!this.username.trim() || !this.password) {
      this.messageType = 'error';
      this.message = 'Korisničko ime i lozinka su obavezni.';
      return;
    }
    this.loading = true;
    this.authService.prijava(this.username.trim(),this.password).subscribe({
      next: korisnik => {
        localStorage.setItem('currentUser',JSON.stringify(korisnik));
        this.loading = false;
        if(korisnik.tip === 'sportista') {
          this.router.navigate(['/sportista/profil']);
          return;
        }
        if(korisnik.tip === 'zaposleni') {
          this.router.navigate(['/zaposleni/profil']);
          return;
        }
        this.router.navigate(['/']);
      },
      error: () => {
        this.messageType = 'error';
        this.message = 'Korisničko ime ili lozinka nisu ispravni.';
        this.loading = false;
      }
    });
  }
}