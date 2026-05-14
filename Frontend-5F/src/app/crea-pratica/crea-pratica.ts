import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { sinistro } from '../models/sinistro.model';
import { Pratica } from '../models/pratica.model';
import { Perizie } from '../services/perizie.service';

export interface Perito {
  id: number;
  nome: string;
  cognome: string;
}

@Component({
  selector: 'app-crea-pratica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crea-pratica.html',
})
export class CreaPraticaComponent implements OnInit {
  @Input() sinistro!: sinistro;
  @Output() closed = new EventEmitter<void>();
  @Output() praticaCreata = new EventEmitter<string>();

  periti: Perito[] = [];
  loadingPeriti = false;
  errorPeriti = '';

  peritoId = '';
  titolo = '';
  descrizione = '';

  loading = false;
  error = '';
  success = '';

  // ✅ Solo Perizie — Sinistri non serve qui
  constructor(private perizieService: Perizie) {}

  ngOnInit(): void {
    this.caricaPeriti();
  }

  caricaPeriti(): void {
    this.loadingPeriti = true;
    this.errorPeriti = '';

    this.perizieService.askTuttiPeriti().subscribe({
      next: (res: any) => {
        // ✅ Il backend risponde con { totale, periti: [] }
        // ma askTuttiPeriti è tipizzato any[] — gestiamo entrambi i casi
        this.periti = Array.isArray(res) ? res : (res.periti ?? []);
        this.loadingPeriti = false;
      },
      error: () => {
        this.loadingPeriti = false;
        this.errorPeriti = 'Impossibile caricare i periti. Riprova.';
      }
    });
  }

  get formValido(): boolean {
    return !!this.peritoId && !!this.titolo.trim() && !!this.descrizione.trim();
  }

  crea(): void {
    if (!this.formValido || !this.sinistro._id) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload: Partial<Pratica> = {
      titolo: this.titolo,
      descrizione: this.descrizione,
      stato: 'Bozza',
    };

    // ✅ Usa askCreaPerizia dal service Perizie
    this.perizieService.askCreaPerizia(this.sinistro._id, this.peritoId, payload)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.success = `Pratica creata con successo! ID: ${res.id_perizia}`;
          this.praticaCreata.emit(res.id_perizia);
          setTimeout(() => this.close(), 1800);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.error === 'Perito non trovato'
            ? 'Perito non trovato. Controlla la selezione.'
            : 'Errore durante la creazione della pratica. Riprova.';
        }
      });
  }

  close(): void {
    this.closed.emit();
  }
}