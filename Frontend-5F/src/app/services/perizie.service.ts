import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Perizia } from '../models/perizia.model';
import { Pratica } from '../models/pratica.model';
import { Relazione, Claim } from '../perito/perito';

@Injectable({
  providedIn: 'root'
})
export class Perizie {

  private praticheLink = 'https://laughing-spoon-wrrww9446pq62954j-8000.app.github.dev/';
  private sinistriLink = 'https://laughing-spoon-wrrww9446pq62954j-7000.app.github.dev/';

  constructor(public http: HttpClient) {}

  // ── Sinistri ────────────────────────────────────────────────────────────────

  askSinistriPerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}perito/${peritoId}/sinistri`);
  }

  askTuttiSinistri(): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}sinistri`);
  }

  askTuttiPeriti(): Observable<any[]> {
    return this.http.get<any[]>(`${this.praticheLink}periti`);
  }

  getSinistro(sinistroId: string): Observable<any> {
    return this.http.get<any>(`${this.sinistriLink}sinistro/${sinistroId}`);
  }

  getAnalisiAI(sinistroId: string): Observable<any> {
    return this.http.get<any>(`${this.sinistriLink}sinistro/${sinistroId}/analisi`);
  }

  // ── Pratiche ────────────────────────────────────────────────────────────────

  getPratichePerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.praticheLink}perito/${peritoId}/pratiche`);
  }

  accettaPratica(praticaId: string, peritoId: string): Observable<any> {
    return this.http.put<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`,
      { stato: 'in_perizia' }
    );
  }

  rifiutaPratica(praticaId: string, peritoId: string): Observable<any> {
    return this.http.put<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`,
      { stato: 'da_assegnare', _reset_perito: true }
    );
  }

  eliminaPratica(praticaId: string, peritoId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`
    ).pipe(
      catchError(() => of({ ok: false }))
    );
  }

  // ── Mapping ─────────────────────────────────────────────────────────────────

  mapPraticaToClaimCard(p: any): Claim {
    const s = p.sinistro ?? {};
    // Accetta sia data_sinistro (nuovo) che data_evento (alias retrocompat)
    const dataEvento = s.data_sinistro
      ? new Date(s.data_sinistro)
      : (s.data_evento ? new Date(s.data_evento) : new Date());

    const statoMap: Record<string, string> = {
      'in_valutazione':        'in_valutazione',
      'aperto':                'in_valutazione',
      'nuovo':                 'in_valutazione',
      'assegnato':             'assegnato',
      'assegnata':             'assegnato',
      'assegnato_a_perito':    'assegnato',
      'in_perizia':            'in_perizia',
      'in_attesa':             'in_attesa',
      'approvato':             'approvato',
      'rimborso_proposto':     'approvato',
      'chiuso':                'chiuso',
      'concluso':              'chiuso',
      'in_riparazione':        'chiuso',
      'da_assegnare':          'in_valutazione',
    };
    const praticaStato = (p.stato ?? s.stato_sinistro ?? s.stato ?? '').toLowerCase();
    const status = statoMap[praticaStato] ?? 'assegnato';

    // stima: in nuovo schema è in preventivo.costo_totale del sinistro
    const stima = s.preventivo?.costo_totale ?? s.stima_danno ?? p.stima_danno ?? 0;
    let priority = 'media';
    if      (s.priorita)                priority = s.priorita;
    else if (stima > 10000)             priority = 'alta';
    else if (stima > 0 && stima < 1000) priority = 'bassa';

    // modello: nuovo nome è modello_veicolo
    const modello = s.modello ?? s.modello_veicolo ?? '';
    const vehicle = (
      [s.marca ?? '', modello, s.targa ? `- ${s.targa}` : '']
        .join(' ').trim() || s.targa
    ) ?? 'N/D';

    const stableId = String(p.sinistro_id ?? s._id ?? p._id);
    const praticaId = String(p._id);

    return {
      id:               stableId,
      praticaId:        praticaId,
      code:             `SN-${stableId.slice(-5).toUpperCase()}`,
      status:           status as Claim['status'],
      type:             s.tipo_sinistro ?? (s.descrizione?.substring(0, 50) ?? 'Sinistro'),
      location:         s.luogo ?? s.indirizzo ?? 'N/D',
      date:             dataEvento.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
      time:             dataEvento.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      vehicle,
      priority:         priority as Claim['priority'],
      insuranceCompany: s.compagnia_assicurativa ?? p.compagnia ?? 'N/D',
      amount:           stima || undefined,
      month:            dataEvento.getMonth() + 1,
      year:             dataEvento.getFullYear(),
    };
  }

  mapSinistreToClaim(s: any): Claim {
    const dataEvento = s.data_sinistro
      ? new Date(s.data_sinistro)
      : (s.data_evento ? new Date(s.data_evento) : new Date());
    const statoMap: Record<string, string> = {
      'in_valutazione': 'in_valutazione', 'aperto': 'in_valutazione', 'nuovo': 'in_valutazione',
      'assegnato': 'assegnato', 'assegnata': 'assegnato', 'assegnato_a_perito': 'assegnato',
      'in_perizia': 'in_perizia', 'in_attesa': 'in_attesa', 'approvato': 'approvato',
      'rimborso_proposto': 'approvato', 'chiuso': 'chiuso', 'concluso': 'chiuso',
      'in_riparazione': 'chiuso', 'da_assegnare': 'in_valutazione',
    };
    const statoRaw = (s.stato_sinistro ?? s.stato ?? '').toLowerCase();
    const status = statoMap[statoRaw] ?? 'assegnato';
    // stima: in nuovo schema è in preventivo.costo_totale
    const stima = s.preventivo?.costo_totale ?? s.stima_danno ?? s.importo ?? 0;
    let priority = 'media';
    if      (s.priorita)    priority = s.priorita;
    else if (stima > 10000) priority = 'alta';
    else if (stima < 1000)  priority = 'bassa';

    const stableId = String(s._id ?? s.id);

    return {
      id:               stableId,
      praticaId:        undefined,
      code:             `SN-${stableId.slice(-5).toUpperCase()}`,
      status:           status as Claim['status'],
      type:             s.tipo_sinistro ?? s.descrizione ?? 'Sinistro',
      location:         s.luogo ?? s.indirizzo ?? 'N/D',
      date:             dataEvento.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
      time:             dataEvento.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      vehicle:          `${s.marca ?? ''} ${s.modello ?? s.modello_veicolo ?? ''} ${s.targa ? '- ' + s.targa : ''}`.trim(),
      priority:         priority as Claim['priority'],
      insuranceCompany: s.compagnia_assicurativa ?? s.assicurazione ?? 'N/D',
      amount:           stima || undefined,
      month:            dataEvento.getMonth() + 1,
      year:             dataEvento.getFullYear(),
    };
  }

  // ── Relazioni ───────────────────────────────────────────────────────────────

  getRelazioniPerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.praticheLink}perito/${peritoId}/perizie`);
  }

  creaRelazione(sinistroId: string, peritoId: string, rel: Partial<Relazione>): Observable<any> {
    const body = {
      titolo:             rel.title,
      tipo_intervento:    rel.tipoDanno,    // nuovo nome (backend accetta anche tipo_danno)
      tipo_danno:         rel.tipoDanno,    // alias legacy
      stima_danno:        rel.estimatedDamage,
      ricambi_utilizzati: (rel.partiDanneggiate ?? []).map(n => ({ nome: n })),
      parti_danneggiate:  rel.partiDanneggiate,   // alias legacy
      descrizione_lavori: rel.description,  // nuovo nome
      descrizione:        rel.description,  // alias legacy
      conclusione:        rel.conclusione,
      veicolo_targa:      rel.vehicle,      // nuovo nome
      veicolo:            rel.vehicle,      // alias legacy
      claim_code:         rel.claimCode,
      stato:              rel.status ?? 'Bozza',
    };
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`, body
    );
  }

  aggiornaRelazione(sinistroId: string, peritoId: string, rel: Partial<Relazione>): Observable<any> {
    const body = {
      titolo:             rel.title,
      tipo_intervento:    rel.tipoDanno,
      tipo_danno:         rel.tipoDanno,    // alias legacy
      stima_danno:        rel.estimatedDamage,
      ricambi_utilizzati: (rel.partiDanneggiate ?? []).map(n => ({ nome: n })),
      parti_danneggiate:  rel.partiDanneggiate,
      descrizione_lavori: rel.description,
      descrizione:        rel.description,  // alias legacy
      conclusione:        rel.conclusione,
      veicolo_targa:      rel.vehicle,
      veicolo:            rel.vehicle,      // alias legacy
      stato:              rel.status ?? 'Bozza',
    };
    return this.http.put<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`, body
    );
  }

  eliminaRelazione(periziaid: string): Observable<any> {
    return this.http.delete<any>(`${this.praticheLink}perizia/${periziaid}`);
  }

  // ── Pratica / Rimborso / Intervento ─────────────────────────────────────────

  askPratica(sinistroId: string, peritoId: string): Observable<Pratica> {
    return this.http.get<Pratica>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`
    );
  }

  askCreaPerizia(sinistroId: string, peritoId: string, body: Partial<Pratica>): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`, body
    );
  }

  askRimborso(
    sinistroId: string, peritoId: string, periziaid: string,
    body: { stima_danno: number; esito: string }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/rimborso`, body
    );
  }

  askIntervento(
    sinistroId: string, peritoId: string, periziaid: string,
    body: { id_officina: string; data_inizio_lavori: string }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/intervento`, body
    );
  }
}