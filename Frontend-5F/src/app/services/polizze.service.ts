import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Polizza } from '../models/polizza.model';

@Injectable({
  providedIn: 'root'
})

export class PolizzeService {

  private readonly base = 'https://laughing-spoon-wrrww9446pq62954j-9000.app.github.dev/';

  constructor(private http: HttpClient) {}

  // ── GET tutte le polizze ──────────────────────────────────────────────────
  getPolizze(): Observable<Polizza[]> {
    return this.http.get<Polizza[]>(`${this.base}polizze`);
  }

  getPolizzeUtente(userId: number): Observable<Polizza[]> {
    return this.http.get<Polizza[]>(`${this.base}polizze/utente/${userId}`);
  }

  // ── POST nuova polizza ────────────────────────────────────────────────────
  creaPolizza(polizza: Polizza): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(
      `${this.base}polizze`,
      polizza
    );
  }

  // ── PUT aggiorna polizza ──────────────────────────────────────────────────
  aggiornaPolizza(id: number, data: Partial<Polizza>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.base}polizze/${id}`,
      data
    );
  }

  // ── DELETE elimina polizza ────────────────────────────────────────────────
  eliminaPolizza(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}polizze/${id}`
    );
  }

  // ── Utility: verifica se una polizza è ancora attiva ─────────────────────
  isAttiva(polizza: Polizza): boolean {
    return new Date(polizza.data_scadenza) >= new Date();
  }
}