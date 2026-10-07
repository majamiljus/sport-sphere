import {Component,inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {LoginReg} from '../../shared/login_reg/login_reg';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule,RouterLink,LoginReg],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword {
  private readonly ruta = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  readonly token = this.ruta.snapshot.paramMap.get('token') ?? '';
  lozinka = '';
  potvrdaLozinke = '';
  prikaziLozinku = false;
  ucitavanje = false;
  poruka = '';
  tipPoruke: 'success' | 'error' = 'error';

  get lozinkaValidna(): boolean {
    const regexLozinke = /^(?=\p{L})(?=\S{8,12}$)(?=.*\p{Lu})(?=.*\d)(?=.*[^\p{L}\d]).*$/u;
    return regexLozinke.test(this.lozinka);
  }

  potvrdi(): void {
    this.poruka = '';
    if(!this.token) {
      this.tipPoruke = 'error';
      this.poruka = 'Link za promenu lozinke nije ispravan.';
      return;
    }
    if(!this.lozinka || !this.potvrdaLozinke) {
      this.tipPoruke = 'error';
      this.poruka = 'Oba polja za lozinku su obavezna.';
      return;
    }
    if(!this.lozinkaValidna) {
      this.tipPoruke = 'error';
      this.poruka = 'Lozinka mora imati 8–12 karaktera, početi slovom i sadržati veliko slovo, broj i specijalni karakter.';
      return;
    }
    if(this.lozinka !== this.potvrdaLozinke) {
      this.tipPoruke = 'error';
      this.poruka = 'Lozinke se ne podudaraju.';
      return;
    }
    this.ucitavanje = true;
    this.authService.promeniLozinku(this.token,this.lozinka).subscribe({
      next: () => {
        this.tipPoruke = 'success';
        this.poruka = 'Nova lozinka je uspešno postavljena.';
        this.ucitavanje = false;
      },
      error: () => {
        this.tipPoruke = 'error';
        this.poruka = 'Link je neispravan ili je istekao.';
        this.ucitavanje = false;
      }
    });
  }
}