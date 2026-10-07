import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-login-reg',
  standalone: true,
  imports: [],
  templateUrl: './login_reg.html',
  styleUrl: './login_reg.css'
})
export class LoginReg {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() wide = false;
}