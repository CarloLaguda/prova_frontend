import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RichiestaSoccorso {
  id: number;
  id_automobilista: number;
  data_richiesta: string;
  stato: string;
}

export interface SoccorsoPayload {
  targa: string;
  lat?: number;
  lon?: number;
  via?: string;
  id_sinistro?: string | null;
  orario_arrivo?: string | null;
  durata_soccorso?: string | null;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class SoccorsoService {

  private readonly link = '/api/sinistri/';

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  constructor(private http: HttpClient) {}

  /** POST /soccorso — invia una nuova richiesta di soccorso */
  inviaSoccorso(payload: SoccorsoPayload): Observable<any> {
    return this.http.post<any>(`${this.link}soccorso`, payload, { headers: this.headers });
  }

  /** GET /soccorso/utente/:userId — storico richieste dell'utente */
  getRichiesteUtente(userId: number): Observable<RichiestaSoccorso[]> {
    return this.http.get<RichiestaSoccorso[]>(
      `${this.link}soccorso/utente/${userId}`,
      { headers: this.headers }
    );
  }
}