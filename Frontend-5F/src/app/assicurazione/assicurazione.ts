import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pratica } from '../models/pratica.model';
import { Polizza } from '../models/polizza.model';
import { DettaglioPraticaComponent } from '../dettagli-pratica/dettagli-pratica';
import { DettaglioPolizzaComponent } from '../dettagli-polizza/dettagli-polizza';
import { CreaPolizzaComponent } from '../crea-polizza/crea-polizza';
import { RegistraClienteComponent } from '../signup/signup';
import { timer, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PolizzeService } from '../services/polizze.service';
import { Sinistri } from '../services/sinistri.service';
import { EmailService } from '../services/mail.service';

@Component({
  selector: 'app-assicurazione',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DettaglioPraticaComponent,
    DettaglioPolizzaComponent,
    CreaPolizzaComponent,
    RegistraClienteComponent,
  ],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit, OnDestroy {
  activeTab: 'pratiche' | 'polizze' | 'clienti' = 'pratiche';

  pratiche: Pratica[] = [];
  polizze:  Polizza[] = [];
  clienti:  any[]     = [];
  periti:   any[]     = [];

  searchTerm = '';

  loadingPratiche = false;
  loadingPolizze  = false;

  praticaSelezionata: Pratica | null = null;
  polizzaSelezionata: Polizza | null = null;
  showNuovaPolizza = false;
  showNuovoCliente = false;

  praticaPerAssegna:   Pratica | null = null;
  peritoSelezionatoId = '';
  assegnando          = false;

  private refreshSubscription?: Subscription;

  constructor(
    private sinistri:       Sinistri,
    private polizzeService: PolizzeService,
    private cdr:            ChangeDetectorRef,
    private auth:           AuthService,
    private emailService:   EmailService,
  ) {}

  ngOnInit(): void {
    this.startAutoRefresh();
    this.caricaPeriti();
    this.caricaPratiche();
    this.caricaPolizze();
  }

  // ── Filtri ────────────────────────────────────────────────────────────────

  get praticheFiltrate(): Pratica[] {
    if (!this.searchTerm.trim()) return this.pratiche;
    const s = this.searchTerm.toLowerCase();
    return this.pratiche.filter(p =>
      (p.titolo?.toLowerCase()              || '').includes(s) ||
      (p.descrizione?.toLowerCase()         || '').includes(s) ||
      ((p as any).descrizione_lavori?.toLowerCase() || '').includes(s) ||
      (p.sinistro_id?.toLowerCase()         || '').includes(s) ||
      (p.stato?.toLowerCase()               || '').includes(s) ||
      (p.veicolo?.toLowerCase()             || '').includes(s) ||
      ((p as any).veicolo_targa?.toLowerCase()      || '').includes(s) ||
      (p.claim_code?.toLowerCase()          || '').includes(s) ||
      (p.tipo_danno?.toLowerCase()          || '').includes(s) ||
      ((p as any).tipo_intervento?.toLowerCase()    || '').includes(s) ||
      (this.getStatoLabel(p).toLowerCase().includes(s))        ||
      (this.getPeritoNome(p.perito_id).toLowerCase().includes(s))
    );
  }

  get polizzeFiltrate(): Polizza[] {
    if (!this.searchTerm.trim()) return this.polizze;
    const s = this.searchTerm.toLowerCase();
    return this.polizze.filter(p =>
      (p.n_polizza?.toLowerCase()              || '').includes(s) ||
      (p.compagnia_assicurativa?.toLowerCase() || '').includes(s) ||
      (p.tipo_copertura?.toLowerCase()         || '').includes(s)
    );
  }

  get countPraticheDaAssegnare(): number { return this.pratiche.filter(p => !p.perito_id).length; }
  get countPolizzeAttive():       number { return this.polizze.filter(pol => this.isPolizzaAttiva(pol)).length; }

  // ── Label / Badge ─────────────────────────────────────────────────────────

  getStatoLabel(p: Pratica): string {
    if (!p.perito_id) return 'Da Assegnare';
    const map: Record<string, string> = {
      'da_assegnare': 'Da Assegnare', 'assegnata': 'Assegnata',
      'in_perizia':   'In Perizia',   'in_attesa': 'In Attesa',
      'chiuso':       'Chiusa',       'concluso':  'Conclusa',
    };
    return map[p.stato?.toLowerCase() ?? ''] ?? p.stato ?? 'Assegnata';
  }

  getStatoBadgeClass(p: Pratica): string {
    if (!p.perito_id) return 'bg-amber-50 text-amber-600 border-amber-200';
    switch (p.stato?.toLowerCase() ?? '') {
      case 'in_perizia':              return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'chiuso': case 'concluso': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'in_attesa':               return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:                        return 'bg-[#EBF4F6] text-[#09637E] border-[#7AB2B2]';
    }
  }

  getPeritoNome(peritoId?: string | null): string {
    if (!peritoId) return 'Non assegnato';
    const perito = this.periti.find(p => String(p.id) === String(peritoId));
    return perito ? `${perito.nome} ${perito.cognome}` : `Perito #${peritoId}`;
  }

  // ── Navigazione ───────────────────────────────────────────────────────────

  setTab(tab: 'pratiche' | 'polizze' | 'clienti'): void {
    this.activeTab  = tab;
    this.searchTerm = '';
  }

  // ── Auto-refresh ──────────────────────────────────────────────────────────

  startAutoRefresh(): void {
    this.refreshSubscription = timer(0, 15000).subscribe(() => this.caricaPratiche());
  }

  // ── Caricamento dati ──────────────────────────────────────────────────────

  caricaPratiche(): void {
    this.loadingPratiche = true;
    this.sinistri.getPratiche().subscribe({
      next: (res: any) => {
        this.pratiche        = res.pratiche || [];
        this.loadingPratiche = false;
        this.cdr.detectChanges();
      },
      error: () => this.loadingPratiche = false
    });
  }

  caricaPolizze(): void {
    this.loadingPolizze = true;
    this.polizzeService.getPolizze().subscribe({
      next: (data: Polizza[]) => {
        this.polizze        = data;
        this.loadingPolizze = false;
        this.cdr.detectChanges();
      },
      error: () => this.loadingPolizze = false
    });
  }

  caricaPeriti(): void {
    this.sinistri.askTuttiPeriti().subscribe({
      next: (data: any) => {
        this.periti = Array.isArray(data) ? data : data?.periti ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  isPolizzaAttiva(pol: Polizza): boolean { return this.polizzeService.isAttiva(pol); }

  // ── Gestione cliente ──────────────────────────────────────────────────────

  apriNuovoCliente():   void { this.showNuovoCliente = true; }
  chiudiNuovoCliente(): void { this.showNuovoCliente = false; }
  onClienteRegistrato(cliente: any): void {
    this.clienti.unshift(cliente);
    this.chiudiNuovoCliente();
  }

  // ── Gestione polizza ──────────────────────────────────────────────────────

  apriNuovaPolizza():   void { this.showNuovaPolizza = true; }
  chiudiNuovaPolizza(): void { this.showNuovaPolizza = false; }
  onPolizzaCreata(_res: any): void { this.caricaPolizze(); this.chiudiNuovaPolizza(); }

  // ── Dettaglio polizza ─────────────────────────────────────────────────────

  apriDettaglioPolizza(pol: Polizza, event: Event): void {
    event.stopPropagation();
    this.polizzaSelezionata = pol;
  }
  chiudiDettaglioPolizza(): void { this.polizzaSelezionata = null; }

  // ── Dettaglio pratica ─────────────────────────────────────────────────────

  apriDettaglioPratica(p: Pratica): void { this.praticaSelezionata = p; }
  chiudiDettaglioPratica():         void { this.praticaSelezionata = null; }

  // ── Assegnazione perito ───────────────────────────────────────────────────

  apriAssegnaPerito(p: Pratica, event: Event): void {
    event.stopPropagation();
    this.praticaPerAssegna   = p;
    this.peritoSelezionatoId = '';
  }

  chiudiAssegnaPerito(): void { this.praticaPerAssegna = null; }

  confermAssegnaPerito(): void {
    if (!this.praticaPerAssegna?._id || !this.peritoSelezionatoId) return;

    // Snapshot prima della chiamata asincrona
    const pratica  = this.praticaPerAssegna;
    const peritoId = this.peritoSelezionatoId;

    this.assegnando = true;

    this.sinistri.assegnaPerito(pratica._id!, peritoId).subscribe({
      next: () => {
        this.assegnando = false;
        this.caricaPratiche();
        this.chiudiAssegnaPerito();

        // ── Notifica email al perito ──────────────────────────────────
        this.emailService.notificaAssegnazionePratica({
          nomePratica: pratica.titolo      ?? `Pratica #${pratica._id}`,
          sinistroId:  pratica.sinistro_id ?? '',
          targa:       pratica.veicolo     ?? 'N/D',
          descrizione: pratica.descrizione ?? '',
        });
        // ─────────────────────────────────────────────────────────────
      },
      error: () => { this.assegnando = false; }
    });
  }

  ngOnDestroy(): void { this.refreshSubscription?.unsubscribe(); }
}