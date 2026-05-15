
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TEST_EMAILS } from '../email_test_config';


// ── Interfacce ────────────────────────────────────────────────────────────────


export interface EmailPayload {
  destinatario: string;
  oggetto: string;
  messaggio: string;
}


export interface EmailResponse {
  status: 'success' | 'error';
  message: string;
}


// ── Template HTML ─────────────────────────────────────────────────────────────


const TEMPLATES = {


  // 1. Creazione sinistro → automobilista
  sinistroAutomobilista: (nome: string, targa: string, data: string, sinistroId: string) => `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width:600px; margin:0 auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#f39c12; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">SafeClaim — Nuovo Sinistro</h1>
        </div>
        <div style="padding:24px;">
          <h2>Ciao ${nome},</h2>
          <p>La segnalazione del tuo sinistro è stata registrata correttamente.</p>
          <div style="background:#fff9f0; border-left:4px solid #f39c12; padding:15px; margin:20px 0;">
            <p><strong>Targa:</strong> ${targa}</p>
            <p><strong>Data evento:</strong> ${data}</p>
            <p><strong>ID Sinistro:</strong> #${sinistroId}</p>
          </div>
          <p>Il tuo caso verrà preso in carico dal nostro team il prima possibile.</p>
          <p style="color:#888; font-size:13px;">SafeClaim Support</p>
        </div>
      </div>
    </body>
    </html>
  `,


  // 2. Creazione sinistro → assicuratore
  sinistroAssicuratore: (targa: string, descrizione: string, sinistroId: string) => `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width:600px; margin:0 auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#2c3e50; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">SafeClaim Admin</h1>
        </div>
        <div style="padding:24px;">
          <h2>Nuova Pratica Ricevuta</h2>
          <p>È stato aperto un nuovo sinistro che richiede la tua attenzione.</p>
          <div style="background:#f1f3f4; padding:15px; border-radius:5px; margin:20px 0;">
            <p><strong>ID Sinistro:</strong> #${sinistroId}</p>
            <p><strong>Targa:</strong> ${targa}</p>
            <p><strong>Descrizione:</strong> ${descrizione}</p>
          </div>
          <p style="color:#888; font-size:13px;">SafeClaim Support</p>
        </div>
      </div>
    </body>
    </html>
  `,


  // 3. Invio credenziali → nuovo automobilista
  credenziali: (nome: string, email: string, password: string) => `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width:600px; margin:0 auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#1a73e8; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">SafeClaim — Benvenuto 🛡️</h1>
        </div>
        <div style="padding:24px;">
          <h2>Ciao ${nome},</h2>
          <p>Il tuo account SafeClaim è stato creato con successo. Ecco le tue credenziali di accesso:</p>
          <div style="background:#f0f4ff; border-left:4px solid #1a73e8; padding:15px; margin:20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password temporanea:</strong> <code style="background:#e8eaf6; padding:2px 6px; border-radius:3px;">${password}</code></p>
          </div>
          <p style="color:#c0392b;"><strong>Ti consigliamo di cambiare la password al primo accesso.</strong></p>
          <p style="color:#888; font-size:13px;">SafeClaim Support</p>
        </div>
      </div>
    </body>
    </html>
  `,


  // 4. Assegnazione sinistro → perito
  assegnazionePratica: (nomePratica: string, sinistroId: string, targa: string, descrizione: string) => `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width:600px; margin:0 auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#8e44ad; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">SafeClaim — Nuova Assegnazione</h1>
        </div>
        <div style="padding:24px;">
          <h2>Ti è stata assegnata una nuova pratica</h2>
          <p>Accedi alla tua dashboard per prendere in carico il caso.</p>
          <div style="background:#f9f0ff; border-left:4px solid #8e44ad; padding:15px; margin:20px 0;">
            <p><strong>Pratica:</strong> ${nomePratica}</p>
            <p><strong>ID Sinistro:</strong> #${sinistroId}</p>
            <p><strong>Targa:</strong> ${targa}</p>
            <p><strong>Descrizione:</strong> ${descrizione}</p>
          </div>
          <p style="color:#888; font-size:13px;">SafeClaim Support</p>
        </div>
      </div>
    </body>
    </html>
  `,


  // 5. Richiesta soccorso → automobilista che ha chiamato il soccorso
  soccorso: (targa: string, posizione: string, data: string) => `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width:600px; margin:0 auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#e74c3c; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">SafeClaim — Soccorso in Arrivo 🚨</h1>
        </div>
        <div style="padding:24px;">
          <h2>Richiesta di soccorso ricevuta</h2>
          <p>Abbiamo ricevuto la tua richiesta di soccorso. Il team è stato allertato.</p>
          <div style="background:#fff5f5; border-left:4px solid #e74c3c; padding:15px; margin:20px 0;">
            <p><strong>Targa:</strong> ${targa}</p>
            <p><strong>Posizione:</strong> ${posizione}</p>
            <p><strong>Orario richiesta:</strong> ${data}</p>
          </div>
          <p>Rimani vicino al veicolo. Il soccorso arriverà il prima possibile.</p>
          <p style="color:#888; font-size:13px;">SafeClaim Support</p>
        </div>
      </div>
    </body>
    </html>
  `,


  // 6. Assegnazione officina → officina
  assegnazioneOfficina: (sinistroId: string, targa: string, dataInizio: string, note: string) => `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width:600px; margin:0 auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#27ae60; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">SafeClaim — Nuovo Intervento 🔧</h1>
        </div>
        <div style="padding:24px;">
          <h2>Nuovo veicolo in arrivo</h2>
          <p>Vi è stato assegnato un intervento di riparazione dalla piattaforma SafeClaim.</p>
          <div style="background:#f0fff4; border-left:4px solid #27ae60; padding:15px; margin:20px 0;">
            <p><strong>ID Sinistro:</strong> #${sinistroId}</p>
            <p><strong>Targa veicolo:</strong> ${targa}</p>
            <p><strong>Data inizio lavori:</strong> ${dataInizio}</p>
            <p><strong>Note perito:</strong> ${note || 'Nessuna nota'}</p>
          </div>
          <p style="color:#888; font-size:13px;">SafeClaim Support</p>
        </div>
      </div>
    </body>
    </html>
  `,


  // 7. Chiusura pratica → assicuratore
  chiusuraPratica: (sinistroId: string, targa: string, stimaDanno: number, esito: string) => `
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width:600px; margin:0 auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        <div style="background:#2c3e50; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">SafeClaim — Pratica Conclusa</h1>
        </div>
        <div style="padding:24px;">
          <h2>Pratica pronta per la chiusura</h2>
          <p>Il perito ha completato la perizia. La pratica è pronta per la tua revisione finale.</p>
          <div style="background:#f1f3f4; padding:15px; border-radius:5px; margin:20px 0;">
            <p><strong>ID Sinistro:</strong> #${sinistroId}</p>
            <p><strong>Targa:</strong> ${targa}</p>
            <p><strong>Stima danno:</strong> €${stimaDanno.toFixed(2)}</p>
            <p><strong>Esito perizia:</strong> ${esito}</p>
          </div>
          <p style="color:#888; font-size:13px;">SafeClaim Support</p>
        </div>
      </div>
    </body>
    </html>
  `,
};


// ── Service ───────────────────────────────────────────────────────────────────


@Injectable({
  providedIn: 'root',
})
export class EmailService {


  // Porta 11000 → endpoint_5F_Mail.py
  private readonly baseUrl = '/api/mail/';


  constructor(private http: HttpClient) {}


  // ── Metodo base ─────────────────────────────────────────────────────────────


  private invia(destinatario: string, oggetto: string, messaggio: string): Observable<EmailResponse> {
    const payload: EmailPayload = { destinatario, oggetto, messaggio };
    return this.http.post<EmailResponse>(`${this.baseUrl}/invia-email`, payload);
  }


  // ── 1. Creazione sinistro (3 destinatari) ──────────────────────────────────
  //    Chiamata: POST /sinistro → dopo la risposta con mongo_id
  //    Automobilista: email di test (in prod: da Utente.email dell'utente loggato)
  //    Assicuratore:  email di test (in prod: GET /assicuratori → loop)
  //    Perito:        NON notificato qui, solo quando viene assegnato


  notificaNuovoSinistro(params: {
    nomeAutomobilista: string;
    targa: string;
    dataEvento: string;
    descrizione: string;
    sinistroId: string;
  }): void {
    // → Automobilista
    this.invia(
      TEST_EMAILS.automobilista,
      `SafeClaim — Sinistro registrato: ${params.targa}`,
      TEMPLATES.sinistroAutomobilista(
        params.nomeAutomobilista,
        params.targa,
        params.dataEvento,
        params.sinistroId
      )
    ).subscribe();


    // → Assicuratore
    this.invia(
      TEST_EMAILS.assicuratore,
      `SafeClaim — Nuovo sinistro: ${params.targa}`,
      TEMPLATES.sinistroAssicuratore(
        params.targa,
        params.descrizione,
        params.sinistroId
      )
    ).subscribe();


    // → Perito: non notificato qui, solo all'assegnazione
  }


  // ── 2. Invio credenziali → nuovo automobilista ─────────────────────────────
  //    Chiamata: dopo POST /registrazione → sul tap() in AuthService.signup()


  notificaCredenziali(params: {
    nome: string;
    email: string;         // email reale del nuovo utente
    password: string;
  }): Observable<EmailResponse> {
    // Qui usiamo l'email reale del nuovo utente, non quella di test
    // perché la abbiamo già dal form di registrazione
    return this.invia(
      params.email,
      'SafeClaim — Benvenuto! Le tue credenziali di accesso',
      TEMPLATES.credenziali(params.nome, params.email, params.password)
    );
  }


  // ── 3. Assegnazione perito a pratica ──────────────────────────────────────
  //    Chiamata: dopo PUT /pratica/:id/assegna
  //    Perito: email di test (in prod: GET /periti → trova perito per id → email)


  notificaAssegnazionePratica(params: {
    nomePratica: string;
    sinistroId: string;
    targa: string;
    descrizione: string;
  }): void {
    this.invia(
      TEST_EMAILS.perito,
      `SafeClaim — Nuova pratica assegnata: ${params.targa}`,
      TEMPLATES.assegnazionePratica(
        params.nomePratica,
        params.sinistroId,
        params.targa,
        params.descrizione
      )
    ).subscribe();
  }


  // ── 4. Richiesta soccorso ─────────────────────────────────────────────────
  //    Chiamata: dopo POST /soccorso
  //    Destinatario: responsabile soccorso (email di test dedicata)


  notificaSoccorso(params: {
    targa: string;
    posizione: string;    // indirizzo rilevato o "GPS: lat, lon"
    dataRichiesta: string;
  }): void {
    this.invia(
      TEST_EMAILS.soccorso,
      `SafeClaim — Richiesta soccorso: ${params.targa}`,
      TEMPLATES.soccorso(
        params.targa,
        params.posizione,
        params.dataRichiesta
      )
    ).subscribe();
  }


  // ── 5. Assegnazione officina ──────────────────────────────────────────────
  //    Chiamata: dopo POST /pratica/:id/intervento
  //    Officina: email di test (in prod: GET /officine/:id → email)


  notificaAssegnazioneOfficina(params: {
    sinistroId: string;
    targa: string;
    dataInizioLavori: string;
    notePerizia?: string;
  }): void {
    this.invia(
      TEST_EMAILS.officina,
      `SafeClaim — Nuovo intervento assegnato: ${params.targa}`,
      TEMPLATES.assegnazioneOfficina(
        params.sinistroId,
        params.targa,
        params.dataInizioLavori,
        params.notePerizia ?? ''
      )
    ).subscribe();
  }


  // ── 6. Chiusura pratica → assicuratore ───────────────────────────────────
  //    Chiamata: dopo che il perito registra il rimborso (POST /rimborso)
  //    Assicuratore: email di test (in prod: GET /assicuratori → loop)


  notificaChiusuraPratica(params: {
    sinistroId: string;
    targa: string;
    stimaDanno: number;
    esito: string;
  }): void {
    this.invia(
      TEST_EMAILS.assicuratore,
      `SafeClaim — Pratica pronta per chiusura: ${params.targa}`,
      TEMPLATES.chiusuraPratica(
        params.sinistroId,
        params.targa,
        params.stimaDanno,
        params.esito
      )
    ).subscribe();
  }
}
