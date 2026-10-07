import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {PodaciPocetneStranice} from '../models/neregistrovan';
import {Objekat} from '../models/objekti';

@Injectable({
  providedIn: 'root'
})
export class NeregistrovanService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:4000/index';

  dohvatiPodatkePocetneStranice() {
    return this.http.get<PodaciPocetneStranice>(`${this.url}/home`);
  }

  dohvatiObjekte() {
    return this.http.get<Objekat[]>(`${this.url}/obj`);
  }

  dohvatiObjekat(id: string) {
    return this.http.get<Objekat>(`${this.url}/objDetails/${id}`);
  }
}