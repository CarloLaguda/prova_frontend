import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { VeicoliService } from '../services/veicoli.service';
import { Veicolo } from '../models/veicolo.model';

interface RichiestaSoccorso {
  id: number;
  id_automobilista: number;
  data_richiesta: string;
  stato: string;
}

@Component({
  selector: 'app-richiesta-soccorso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './richiesta-soccorso.html',
  styleUrl: './richiesta-soccorso.css',
})
export class RichiestaSoccorsoComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  private link = 'https://friendly-space-palm-tree-jjjxx4995v55hq9gw-7000.app.github.dev/';

  // Header espliciti per evitare problemi CORS con Codespaces
  private jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  // ── Veicoli ───────────────────────────────────────────────────────────────
  veicoli: Veicolo[] = [];
  targaSelezionata = '';

  // ── Posizione ─────────────────────────────────────────────────────────────
  lat: number | null = null;
  lon: number | null = null;
  indirizzoRilevato = '';
  geoLoading = false;
  geoErrore  = '';
  indirizzoManuale = '';

  // ── Form ──────────────────────────────────────────────────────────────────
  loading  = false;
  errore   = '';
  successo = '';

  // ── Storico ───────────────────────────────────────────────────────────────
  richieste: RichiestaSoccorso[] = [];
  loadingRichieste = false;

  constructor(
    private http:           HttpClient,
    private auth:           AuthService,
    private veicoliService: VeicoliService,
    private cdr:            ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;
    if (userId) {
      this.veicoliService.getVeicoliUtente(userId).subscribe({
        next: (data) => { this.veicoli = data; this.cdr.detectChanges(); }
      });
      this.caricaRichieste(userId);
    }
    this.rilievaPosizioneAuto();
  }

  // ── Geolocalizzazione ─────────────────────────────────────────────────────

  rilievaPosizioneAuto(): void {
    if (!navigator.geolocation) {
      this.geoErrore = 'Geolocalizzazione non supportata dal browser.';
      return;
    }
    this.geoLoading = true;
    this.geoErrore  = '';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        this.lat = pos.coords.latitude;
        this.lon = pos.coords.longitude;
        this.geoLoading = false;
        await this.geocodeInverso(this.lat, this.lon);
        this.cdr.detectChanges();
      },
      () => {
        this.geoLoading = false;
        this.geoErrore  = 'Impossibile rilevare la posizione. Verifica i permessi del browser.';
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private async geocodeInverso(lat: number, lon: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'it' } });
      if (res.ok) {
        const data = await res.json();
        this.indirizzoRilevato = data.display_name ?? '';
      }
    } catch {}
  }

  // ── Storico richieste ─────────────────────────────────────────────────────

  caricaRichieste(userId: number): void {
    this.loadingRichieste = true;
    this.http
      .get<RichiestaSoccorso[]>(`${this.link}soccorso/utente/${userId}`, {
        headers: this.jsonHeaders,
      })
      .subscribe({
        next: (data) => {
          this.richieste       = data;
          this.loadingRichieste = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[soccorso] Errore caricamento richieste:', err);
          this.loadingRichieste = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ── Invio richiesta ───────────────────────────────────────────────────────

  invia(): void {
    this.errore = '';

    if (!this.targaSelezionata) {
      this.errore = 'Seleziona un veicolo.';
      return;
    }

    if (this.lat === null && !this.indirizzoManuale?.trim()) {
      this.errore = 'Inserisci un indirizzo manuale se la geolocalizzazione non è disponibile.';
      return;
    }

    this.loading = true;

    // Il backend calcola data_richiesta da solo con datetime.now()
    // Non la inviamo per evitare conflitti di formato/timezone
    const payload: Record<string, unknown> = {
      targa:           this.targaSelezionata,
      orario_arrivo:   null,
      durata_soccorso: null,
      note:            '',
    };

    if (this.lat !== null)               payload['lat'] = this.lat;
    if (this.lon !== null)               payload['lon'] = this.lon;
    if (this.indirizzoManuale?.trim())   payload['via'] = this.indirizzoManuale.trim();

    this.http
      .post<any>(`${this.link}soccorso`, payload, { headers: this.jsonHeaders })
      .subscribe({
        next: () => {
          this.loading  = false;
          this.successo = 'Richiesta inviata! Il soccorso è in arrivo.';
          const userId = this.auth.currentUser?.id;
          if (userId) this.caricaRichieste(userId);
          this.cdr.detectChanges();
          setTimeout(() => this.close(), 2500);
        },
        error: (err) => {
          this.loading = false;
          console.error('[soccorso] Errore invio:', {
            status:     err.status,
            statusText: err.statusText,
            body:       err.error,
            url:        err.url,
          });
          // Messaggio leggibile in base al tipo di errore
          if (err.status === 0) {
            this.errore = 'Impossibile raggiungere il server. Controlla la connessione.';
          } else {
            this.errore = err.error?.error ?? err.error?.message ?? 'Errore durante l\'invio. Riprova.';
          }
          this.cdr.detectChanges();
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatOraRichiesta(dataString: string): string {
    try {
      let iso = dataString.replace(' ', 'T');
      if (!iso.includes('+') && !iso.endsWith('Z')) iso += 'Z';
      const date    = new Date(iso);
      const offsetH = new Date().getTimezoneOffset() / 60;
      date.setHours(date.getHours() - offsetH);
      const dd   = String(date.getDate()).padStart(2, '0');
      const mm   = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hh   = String(date.getHours()).padStart(2, '0');
      const min  = String(date.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return dataString;
    }
  }

  getStatoClass(stato: string): string {
    const map: Record<string, string> = {
      'in_attesa':  'bg-amber-50 text-amber-700 border-amber-200',
      'in_arrivo':  'bg-blue-50 text-blue-700 border-blue-200',
      'completato': 'bg-green-50 text-green-700 border-green-200',
      'annullato':  'bg-red-50 text-red-700 border-red-200',
    };
    return map[stato?.toLowerCase()] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  }

  close(): void { this.closed.emit(); }
}