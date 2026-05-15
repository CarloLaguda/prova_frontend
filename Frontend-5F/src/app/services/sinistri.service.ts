import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { sinistro } from '../models/sinistro.model';
import { HttpClient } from '@angular/common/http';
import { switchMap, map } from 'rxjs/operators';
import { Pratica } from '../models/pratica.model';

@Injectable({
  providedIn: 'root',
})
export class Sinistri {
  link  = "https://ubiquitous-happiness-x55jj9xxw7xjf66rx-7000.app.github.dev/"
  link2 = "https://ubiquitous-happiness-x55jj9xxw7xjf66rx-8000.app.github.dev/"

  private sinistriSubject = new BehaviorSubject<sinistro[]>([]);
  sinistri$: Observable<sinistro[]> = this.sinistriSubject.asObservable();
  sinistri: sinistro[] = [];

  constructor(public http: HttpClient) {}

  askSinistri(userId?: number) {
    const url = userId
      ? `${this.link}sinistri?automobilista_id=${userId}`
      : `${this.link}sinistri`;

    this.http.get<sinistro[]>(url).subscribe({
      next: (data) => {
        this.sinistri = data;
        this.sinistriSubject.next(data);
      },
      error: (err: any) => console.error("Errore download sinistri:", err)
    });
  }

  /** Crea il sinistro e subito dopo la pratica (senza perito) */
  createSinistro(nuovoSinistro: sinistro): Observable<any> {
    return this.http.post<any>(`${this.link}sinistro`, nuovoSinistro).pipe(
      switchMap((res: any) => {
        this.askSinistri(nuovoSinistro.automobilista_id);

        const sinistroId: string = res?.mongo_id;

        if (sinistroId) {
          return this.creaPraticaSenzaPerito(sinistroId, {
            titolo: `Pratica – ${nuovoSinistro.targa}`,
            descrizione: nuovoSinistro.descrizione ?? ''
          }).pipe(
            map(() => res)
          );
        }

        return of(res);
      })
    );
  }

  /** POST /sinistro/:id/pratica  senza perito_id */
  creaPraticaSenzaPerito(
    sinistro_id: string,
    data: Partial<Pratica>
  ): Observable<{ status: string; id_pratica: string; stato: string }> {
    return this.http.post<{ status: string; id_pratica: string; stato: string }>(
      `${this.link2}sinistro/${sinistro_id}/pratica`,
      data
    );
  }

  aggiornaSinistro(sinistroId: string, data: Partial<sinistro>): Observable<any> {
    return this.http.put<any>(`${this.link}sinistro/${sinistroId}`, data);
  }

  /** POST /sinistro/:id/pratica  con perito_id (usato da CreaPratica) */
  creaPratica(
    sinistro_id: string,
    perito_id: string,
    data: Partial<Pratica>
  ): Observable<{ status: string; id_pratica: string; stato: string }> {
    return this.http.post<{ status: string; id_pratica: string; stato: string }>(
      `${this.link2}sinistro/${sinistro_id}/pratica`,
      { ...data, perito_id }
    );
  }

  /** PUT /pratica/:id/assegna  – assegna perito a pratica già esistente */
  assegnaPerito(
    pratica_id: string,
    perito_id: string
  ): Observable<{ status: string; pratica_id: string; perito_id: string }> {
    return this.http.put<{ status: string; pratica_id: string; perito_id: string }>(
      `${this.link2}pratica/${pratica_id}/assegna`,
      { perito_id }
    );
  }

  getPratiche(): Observable<{ totale: number; pratiche: Pratica[] }> {
    return this.http.get<{ totale: number; pratiche: Pratica[] }>(
      `${this.link2}pratiche_assicurazione`
    );
  }

  askTuttiPeriti(): Observable<any[]> {
    return this.http.get<any[]>(`${this.link2}periti`);
  }

  uploadImmagini(sinistroId: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('immagine', file, file.name));
    return this.http.post(`${this.link}sinistro/${sinistroId}/immagini`, formData);
  }

  getSinistroById(sinistroId: string): Observable<any> {
    return this.http.get<any>(`${this.link}sinistro/${sinistroId}`);
  }
}