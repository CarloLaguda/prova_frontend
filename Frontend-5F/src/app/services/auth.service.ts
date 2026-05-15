import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  link = "https://ubiquitous-happiness-x55jj9xxw7xjf66rx-6000.app.github.dev/";
  linkAssicurazione = "https://ubiquitous-happiness-x55jj9xxw7xjf66rx-5000.app.github.dev/";

  private _currentUser?: User;

  get currentUser(): User | undefined {
    if (!this._currentUser) {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        try { this._currentUser = JSON.parse(saved); } catch {}
      }
    }
    return this._currentUser;
  }

  constructor(private http: HttpClient) {}

  login(email_in: string, psw_in: string): Observable<any> {
    return this.http.post<any>(`${this.link}login`, {
      email: email_in,
      password: psw_in
    }).pipe(
      tap(res => {
        console.log("Risposta API Login:", res);
        if (res.status === "success") {
          this._currentUser = res.user;
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          localStorage.setItem('userRole', res.user.ruolo);
          const token = res.access_token ?? res.token ?? null;
          if (token) localStorage.setItem('access_token', token);
          console.log("Utente loggato:", this._currentUser);
        }
      })
    );
  }

  signup(nuovoUtente: User): Observable<any> {
    const payload = {
      nome:          nuovoUtente.nome?.trim(),
      cognome:       nuovoUtente.cognome?.trim(),
      cf:            nuovoUtente.cf?.trim().toUpperCase(),
      email:         nuovoUtente.email?.trim().toLowerCase(),
      password_hash: nuovoUtente.password_hash,
      telefono:      nuovoUtente.telefono?.trim(),
      ruolo:         'automobilista',
    };
    return this.http.post<any>(`${this.link}registrazione`, payload);
  }

  registrazioneCompleta(payload: {
    utente:  any;
    veicolo: any;
    polizza: any;
  }): Observable<any> {
    return this.http.post<any>(`${this.linkAssicurazione}registrazione-completa`, payload);
  }

  updateUser(id: number, data: Partial<User>): Observable<any> {
    const ruolo = localStorage.getItem('userRole') ?? '';
    return this.http.put<any>(`${this.link}utente/${id}`, { ...data, ruolo }).pipe(
      tap(res => {
        if (res?.status === 'success') {
          const updated = res.user
            ? { ...res.user, ruolo: this._currentUser?.ruolo ?? ruolo }
            : { ...(this._currentUser as User), ...data };
          this._currentUser = updated as User;
          localStorage.setItem('currentUser', JSON.stringify(this._currentUser));
        }
      })
    );
  }

  logout(): void {
    this._currentUser = undefined;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('access_token');
  }
}