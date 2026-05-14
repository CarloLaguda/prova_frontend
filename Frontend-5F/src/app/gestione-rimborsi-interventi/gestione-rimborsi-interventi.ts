import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Perizie } from '../services/perizie.service';
import { AuthService } from '../services/auth.service';
import { timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-gestione-rimborsi-interventi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestione-rimborsi-interventi.html',
  styleUrl: './gestione-rimborsi-interventi.css',
})
export class GestioneRimborsiInterventi implements OnInit, OnDestroy {

  vistaAttiva: 'rimborsi' | 'interventi' = 'rimborsi';
  searchTerm = '';

  pratiche: any[] = [];
  loadingPratiche = false;

  praticaSelezionataRimborso: any = null;
  rimborsoForm = { stima_danno: null as number | null, esito: '' };
  loadingRimborso  = false;
  rimborsoErrore   = '';
  rimborsoSuccesso = '';

  esitiDisponibili = [
    'Approvato',
    'Approvato parzialmente',
    'Rifiutato',
    'In valutazione',
    'Sospeso per frode',
  ];

  praticaSelezionataIntervento: any = null;
  interventoForm = { id_officina: '', data_inizio_lavori: '' };
  loadingIntervento  = false;
  interventoErrore   = '';
  interventoSuccesso = '';

  private refreshSub?: Subscription;
  private peritoId = '';

  constructor(
    private perizie: Perizie,
    private auth:    AuthService,
    private router:  Router,
    private cdr:     ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const u = this.auth.currentUser as any;
    this.peritoId = String(u?.id ?? '');

    const oggi = new Date();
    const y = oggi.getFullYear();
    const m = String(oggi.getMonth() + 1).padStart(2, '0');
    const d = String(oggi.getDate()).padStart(2, '0');
    this.interventoForm.data_inizio_lavori = `${y}-${m}-${d}`;

    this.caricaPratiche();
    this.refreshSub = timer(15000, 15000).subscribe(() => this.caricaPratiche());
  }

  ngOnDestroy(): void { this.refreshSub?.unsubscribe(); }

  caricaPratiche(): void {
    if (!this.peritoId) return;
    this.loadingPratiche = true;
    this.perizie.getPratichePerito(this.peritoId).subscribe({
      next: (data: any[]) => {
        this.pratiche = data;
        this.loadingPratiche = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingPratiche = false; this.cdr.detectChanges(); }
    });
  }

  get praticheFiltrate(): any[] {
    const q = this.searchTerm.toLowerCase().trim();
    if (!q) return this.pratiche;
    return this.pratiche.filter(p =>
      (p.titolo      ?? '').toLowerCase().includes(q) ||
      (p.stato       ?? '').toLowerCase().includes(q) ||
      (p.sinistro_id ?? '').toLowerCase().includes(q)
    );
  }

  apriRimborso(p: any, event: Event): void {
    event.stopPropagation();
    this.praticaSelezionataRimborso = p;
    this.rimborsoForm    = { stima_danno: p.stima_danno ?? null, esito: p.esito ?? '' };
    this.rimborsoErrore  = '';
    this.rimborsoSuccesso = '';
  }

  chiudiRimborso(): void {
    this.praticaSelezionataRimborso = null;
    this.rimborsoErrore   = '';
    this.rimborsoSuccesso = '';
  }

  inviaRimborso(): void {
    if (!this.rimborsoForm.stima_danno || !this.rimborsoForm.esito) {
      this.rimborsoErrore = 'Compila tutti i campi obbligatori.';
      return;
    }
    const p = this.praticaSelezionataRimborso;
    const periziaid = p?.perizia_id ?? p?._id;
    if (!p?.sinistro_id || !periziaid) {
      this.rimborsoErrore = 'Dati pratica mancanti.';
      return;
    }
    this.loadingRimborso = true;
    this.rimborsoErrore  = '';

    this.perizie.askRimborso(
      p.sinistro_id,
      this.peritoId,
      periziaid,
      { stima_danno: this.rimborsoForm.stima_danno!, esito: this.rimborsoForm.esito }
    ).subscribe({
      next: () => {
        this.loadingRimborso  = false;
        this.rimborsoSuccesso = 'Rimborso registrato con successo!';
        this.caricaPratiche();
        this.cdr.detectChanges();
        setTimeout(() => this.chiudiRimborso(), 1500);
      },
      error: (err: any) => {
        this.loadingRimborso = false;
        this.rimborsoErrore  = err.error?.error ?? 'Errore durante il salvataggio. Riprova.';
        this.cdr.detectChanges();
      }
    });
  }

  apriIntervento(p: any, event: Event): void {
    event.stopPropagation();
    this.praticaSelezionataIntervento = p;
    this.interventoForm = {
      id_officina:        p.id_officina ?? '',
      data_inizio_lavori: this.interventoForm.data_inizio_lavori,
    };
    this.interventoErrore   = '';
    this.interventoSuccesso = '';
  }

  chiudiIntervento(): void {
    this.praticaSelezionataIntervento = null;
    this.interventoErrore   = '';
    this.interventoSuccesso = '';
  }

  inviaIntervento(): void {
    if (!this.interventoForm.id_officina.trim()) {
      this.interventoErrore = "Inserisci l'ID officina.";
      return;
    }
    const p = this.praticaSelezionataIntervento;
    const periziaid = p?.perizia_id ?? p?._id;
    if (!p?.sinistro_id || !periziaid) {
      this.interventoErrore = 'Dati pratica mancanti.';
      return;
    }
    this.loadingIntervento = true;
    this.interventoErrore  = '';

    this.perizie.askIntervento(
      p.sinistro_id,
      this.peritoId,
      periziaid,
      {
        id_officina:        this.interventoForm.id_officina.trim(),
        data_inizio_lavori: this.interventoForm.data_inizio_lavori,
      }
    ).subscribe({
      next: () => {
        this.loadingIntervento  = false;
        this.interventoSuccesso = 'Intervento assegnato con successo!';
        this.caricaPratiche();
        this.cdr.detectChanges();
        setTimeout(() => this.chiudiIntervento(), 1500);
      },
      error: (err: any) => {
        this.loadingIntervento = false;
        this.interventoErrore  = err.error?.error ?? 'Errore durante il salvataggio. Riprova.';
        this.cdr.detectChanges();
      }
    });
  }

  tornaAlPerito(): void { this.router.navigate(['/perito']); }

  getStatoClass(stato: string): string {
    const map: Record<string, string> = {
      'in_perizia':        'bg-teal-50 text-teal-700 border-teal-200',
      'rimborso_inserito': 'bg-green-50 text-green-700 border-green-200',
      'rimborso_proposto': 'bg-blue-50 text-blue-700 border-blue-200',
      'inviata_officina':  'bg-purple-50 text-purple-700 border-purple-200',
      'in_riparazione':    'bg-orange-50 text-orange-700 border-orange-200',
      'aperto':            'bg-amber-50 text-amber-700 border-amber-200',
    };
    return map[stato?.toLowerCase()] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  }

  getStatoLabel(stato: string): string {
    const map: Record<string, string> = {
      'in_perizia':        'In Perizia',
      'rimborso_inserito': 'Rimborso Inserito',
      'rimborso_proposto': 'Rimborso Proposto',
      'inviata_officina':  'Inviata Officina',
      'in_riparazione':    'In Riparazione',
      'aperto':            'Aperto',
    };
    return map[stato?.toLowerCase()] ?? stato ?? 'N/D';
  }
}