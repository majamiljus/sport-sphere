import {Routes} from '@angular/router';
import {PublicHome} from './index/index';
import {ObjekatDetalji} from './sportista/objekat_detalji/objekat_detalji';
import {Login} from './login_reg/login/login';
import {Register} from './login_reg/register/register';
import {ForgotPassword} from './login_reg/forgot-password/forgot-password';
import {ResetPassword} from './login_reg/reset-password/reset-password';
import {AdminLogin} from './login_reg/admin-login/admin-login';
import {Profil} from './sportista/profil/profil';
import {Rezervisi} from './sportista/rezervisiTeren/rezervisi';
import {OglasComponent} from './sportista/oglas/oglas';
import {TreningComponent} from './sportista/treninzi/trening';
import {ProdavnicaComponent} from './sportista/prodavnica/prodavnica';
import {KorpaComponent} from './sportista/korpa/korpa';
import {OcenjivanjeComponent} from './sportista/ocenjivanje/ocenjivanje';
import {StatistikaComponent} from './sportista/statistika/statistika';
import {Profil as ProfilZaposlenog} from './zaposleni/profil/profil';
import {ObjektiZaposlenog} from './zaposleni/objekti/objekti';
import {Rezervacije} from './zaposleni/rezervacije/rezervacije';
import {PromocijeComponent} from './zaposleni/promocije/promocije';
import {KalendarZaposlenog} from './zaposleni/kalendar/kalendar';
import {Nalozi} from './admin/nalozi/nalozi';
import {Registracije} from './admin/registracije/registracije';
import {Objekti} from './admin/objekti/objekti';
import {Treneri} from './admin/treneri/treneri';
export const routes: Routes = [
  {path: '',component: PublicHome},
  {path: 'objekti/:id',component: ObjekatDetalji},
  {path: 'prijava',component: Login},
  {path: 'registracija',component: Register},
  {path: 'zaboravljena-lozinka',component: ForgotPassword},
  {path: 'postavi-lozinku/:token',component: ResetPassword},
  {path: 'admin',component: AdminLogin},
  {path: 'sportista/profil',component: Profil},
  {path: 'sportista/rezervisi',component: Rezervisi},
  {path: 'sportista/oglas',component: OglasComponent},
  {path: 'sportista/trening',component: TreningComponent},
  {path: 'sportista/prodavnica',component: ProdavnicaComponent},
  {path: 'sportista/korpa',component: KorpaComponent},
  {path: 'sportista/ocenjivanje',component: OcenjivanjeComponent},
  {path: 'sportista/statistika',component: StatistikaComponent},
  {path: 'zaposleni/profil',component: ProfilZaposlenog},
  {path: 'zaposleni/objekti',component: ObjektiZaposlenog},
  {path: 'zaposleni/rezervacije',component: Rezervacije},
  {path: 'zaposleni/promocije_oprema',component: PromocijeComponent},
  {path: 'zaposleni/kalendar',component: KalendarZaposlenog},
  {path: 'admin/nalozi',component: Nalozi},
  {path: 'admin/registracije',component: Registracije},
  {path: 'admin/objekti',component: Objekti},
  {path: 'admin/treneri',component: Treneri},
  {path: '**',redirectTo: ''}
];