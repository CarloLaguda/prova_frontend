import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AssistenteChatResponse {
  risposta: string;
  chunk_usati: { titolo: string; score: number }[];
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssistenteService {
  private readonly baseUrl = 'https://laughing-spoon-wrrww9446pq62954j-12000.app.github.dev/assistente/';

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  constructor(private http: HttpClient) {}

  chat(domanda: string): Observable<AssistenteChatResponse> {
    return this.http.post<any>(`${this.baseUrl}chat`, { domanda }, { headers: this.headers }).pipe(
      map(response => {
        // Se GitHub ha restituito HTML invece di JSON, response sarà un oggetto strano
        if (!response || typeof response.risposta !== 'string') {
          console.error('Risposta inattesa dal server:', response);
          return {
            risposta: 'Errore: risposta non valida dal server. Controlla che il backend sia attivo.',
            chunk_usati: [],
            status: 'error'
          };
        }
        return response as AssistenteChatResponse;
      })
    );
  }

  health(): Observable<{ status: string; modello: string; kb_chunks: number; tfidf_termini: number }> {
    return this.http.get<any>(`${this.baseUrl}health`, { headers: this.headers });
  }

  argomenti(): Observable<{ argomenti: string[]; totale: number }> {
    return this.http.get<any>(`${this.baseUrl}argomenti`, { headers: this.headers });
  }
}