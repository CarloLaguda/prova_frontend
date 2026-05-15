import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pratica } from '../models/pratica.model';
import { Perizie } from '../services/perizie.service';
import { Sinistri } from '../services/sinistri.service';

@Component({
  selector: 'app-dettaglio-pratica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dettagli-pratica.html',
})
export class DettaglioPraticaComponent implements OnInit {
  @Input() pratica!: Pratica;
  @Output() closed = new EventEmitter<void>();

  perizia: any = null;
  loadingPerizia = false;

  immagini: string[] = [];
  loadingImmagini = false;
  immagineAperta: number | null = null;

  analisiAi: any = null;
  loadingAnalisi = false;

  // ── Rimborso ─────────────────────────────────────────────────────────────
  sinistroStato      = '';
  sinistroStimaDanno: number | null = null;
  loadingApprova     = false;
  approvaSuccesso    = '';
  approvaErrore      = '';

  constructor(
    private perizeService: Perizie,
    private sinistriService: Sinistri,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.caricaPerizia();
    this.caricaImmaginiEAnalisi();
  }

  /** Mostra il pannello di approvazione quando il perito ha inserito il rimborso */
  get mostraApprovaRimborso(): boolean {
    return (
      this.perizia?.stato === 'rimborso_inserito' ||
      this.sinistroStato  === 'rimborso_proposto'
    ) && !this.approvaSuccesso && this.sinistroStato !== 'rimborso_approvato';
  }

  private caricaPerizia(): void {
    if (!this.pratica.sinistro_id || !this.pratica.perito_id) return;
    this.loadingPerizia = true;
    this.perizeService.askPratica(this.pratica.sinistro_id, this.pratica.perito_id).subscribe({
      next: (data) => {
        this.perizia = data ?? null;
        this.loadingPerizia = false;
        this.cdr.detectChanges();
      },
      error: () => { this.perizia = null; this.loadingPerizia = false; },
    });
  }

  private caricaImmaginiEAnalisi(): void {
    if (!this.pratica.sinistro_id) return;
    this.loadingImmagini = true;
    this.loadingAnalisi  = true;

    this.sinistriService.getSinistroById(this.pratica.sinistro_id).subscribe({
      next: (sinistro) => {
        this.immagini           = (sinistro?.immagini ?? []).map((img: any) => img.url);
        this.analisiAi          = sinistro?.analisi_ai ?? null;
        this.sinistroStato      = (sinistro?.stato_sinistro ?? sinistro?.stato ?? '').toLowerCase();
        this.sinistroStimaDanno = sinistro?.preventivo?.costo_totale ?? sinistro?.stima_danno ?? null;
        this.loadingImmagini    = false;
        this.loadingAnalisi     = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.immagini  = [];
        this.analisiAi = null;
        this.loadingImmagini = false;
        this.loadingAnalisi  = false;
      },
    });
  }

  approvaRimborso(): void {
    if (!this.pratica.sinistro_id) return;
    this.loadingApprova = true;
    this.approvaErrore  = '';
    this.sinistriService.aggiornaSinistro(
      this.pratica.sinistro_id,
      { stato: 'rimborso_approvato' } as any
    ).subscribe({
      next: () => {
        this.loadingApprova  = false;
        this.approvaSuccesso = 'Rimborso approvato con successo!';
        this.sinistroStato   = 'rimborso_approvato';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadingApprova = false;
        this.approvaErrore  = err?.error?.error ?? "Errore durante l'approvazione. Riprova.";
        this.cdr.detectChanges();
      }
    });
  }

  apriImmagine(index: number): void { this.immagineAperta = index; }
  chiudiImmagine(): void            { this.immagineAperta = null;  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img-placeholder.png';
  }

  close(): void { this.closed.emit(); }
}