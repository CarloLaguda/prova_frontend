import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Veicolo } from '../models/veicolo.model';

@Injectable({
  providedIn: 'root',
})
export class VeicoliService {
  private link = 'https://laughing-spoon-wrrww9446pq62954j-5000.app.github.dev/';

  // Stato interno dei veicoli (riflette l'ultima operazione di caricamento fatta)
  public veicoli: Veicolo[] = [];
  private veicoliSubject = new BehaviorSubject<Veicolo[]>([]);
  
  // Stream a cui si iscriveranno i componenti
  veicoli$ = this.veicoliSubject.asObservable();

  constructor(private http: HttpClient) {}

  // --- METODI PER TUTTI I VEICOLI ---

  /**
   * Prende TUTTI i veicoli dal database
   */
  getVeicoli(): Observable<Veicolo[]> {
    return this.http.get<Veicolo[]>(`${this.link}veicoli`).pipe(
      tap((data: Veicolo[]) => {
        this.veicoli = data;
        this.veicoliSubject.next(data);
        console.log("Caricati tutti i veicoli del sistema:", data);
      })
    );
  }

  /**
   * Trigger per caricare tutti i veicoli senza gestire la sottoscrizione nel componente
   */
  askVeicoliAll(): void {
    this.getVeicoli().subscribe({
      error: (err) => console.error("Errore nel caricamento totale veicoli:", err)
    });
  }

  // --- METODI PER VEICOLI UTENTE ---

  /**
   * Prende i veicoli di un singolo utente
   */
  getVeicoliUtente(userId: number): Observable<Veicolo[]> {
    return this.http.get<Veicolo[]>(`${this.link}veicoli-utente/${userId}`).pipe(
      tap((data: Veicolo[]) => {
        this.veicoli = data;
        this.veicoliSubject.next(data);
        console.log(`Veicoli caricati per l'utente ${userId}:`, data);
      })
    );
  }

  /**
   * Trigger per caricare i veicoli di un utente specifico
   */
  askVeicoliUtente(userId: number): void {
    this.getVeicoliUtente(userId).subscribe({
      error: (err) => console.error("Errore nel refresh veicoli utente:", err)
    });
  }

  // --- METODI DI DETTAGLIO E CREAZIONE ---

  getVeicoloById(id: number): Observable<Veicolo> {
    return this.http.get<Veicolo>(`${this.link}veicoli/${id}`);
  }

  createVeicolo(payload: any): Observable<any> {
    const userId = payload.automobilista_id;
    return this.http.post<any>(`${this.link}veicolo/user/${userId}`, payload);
  }
}