import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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

  constructor(
    private perizeService: Perizie,
    private sinistriService: Sinistri
  ) {}

  ngOnInit(): void {
    this.caricaPerizia();
    this.caricaImmaginiEAnalisi();
  }

  private caricaPerizia(): void {
    if (!this.pratica.sinistro_id || !this.pratica.perito_id) return;
    this.loadingPerizia = true;
    this.perizeService.askPratica(this.pratica.sinistro_id, this.pratica.perito_id).subscribe({
      next: (data) => { this.perizia = data ?? null; this.loadingPerizia = false; },
      error: ()     => { this.perizia = null;         this.loadingPerizia = false; },
    });
  }

  private caricaImmaginiEAnalisi(): void {
    if (!this.pratica.sinistro_id) return;
    this.loadingImmagini = true;
    this.loadingAnalisi  = true;

    this.sinistriService.getSinistroById(this.pratica.sinistro_id).subscribe({
      next: (sinistro) => {
        this.immagini  = (sinistro?.immagini ?? []).map((img: any) => img.url);
        this.analisiAi = sinistro?.analisi_ai ?? null;
        this.loadingImmagini = false;
        this.loadingAnalisi  = false;
      },
      error: () => {
        this.immagini  = [];
        this.analisiAi = null;
        this.loadingImmagini = false;
        this.loadingAnalisi  = false;
      },
    });
  }

  apriImmagine(index: number): void { this.immagineAperta = index; }
  chiudiImmagine(): void            { this.immagineAperta = null;  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img-placeholder.png';
  }

  close(): void { this.closed.emit(); }
}