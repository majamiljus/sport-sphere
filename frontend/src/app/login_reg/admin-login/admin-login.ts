import {Component,inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {LoginReg} from '../../shared/login_reg/login_reg';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule,LoginReg],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLogin {
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
      this.message = 'Korisničko ime i lozinka ne smeju biti prazni.';
      return;
    }
    this.loading = true;
    this.authService.prijavaAdministratora(this.username.trim(),this.password).subscribe({
      next: administrator => {
        localStorage.setItem('currentUser',JSON.stringify(administrator));
        this.messageType = 'success';
        this.message = 'Administrator je uspešno prijavljen.';
        this.loading = false;
        this.router.navigate(['/admin/nalozi']);
      },
      error: () => {
        this.messageType = 'error';
        this.message = 'Korisničko ime ili lozinka nisu ispravni.';
        this.loading = false;
      }
    });
  }
}