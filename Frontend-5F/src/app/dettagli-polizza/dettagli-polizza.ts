import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Polizza } from '../models/polizza.model';
import { PolizzeService } from '../services/polizze.service';
import { VeicoliService } from '../services/veicoli.service';

@Component({
  selector: 'app-dettaglio-polizza',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dettagli-polizza.html',
})
export class DettaglioPolizzaComponent {
  @Input() polizza!: Polizza;
  @Input() isAttiva = false;
  @Output() closed = new EventEmitter<void>();
  @Output() eliminata = new EventEmitter<void>();
  @Output() aggiornata = new EventEmitter<Polizza>();

  // Modal states
  showConfermaElimina = false;
  eliminando = false;
  eliminaErrore = '';

  showModifica = false;
  salvandoModifica = false;
  modificaErrore = '';
  modificaSuccesso = '';
  polizzaModifica: Partial<Polizza> = {};

  constructor(
    private polizzeService: PolizzeService,
    public veicoliService: VeicoliService
  ) {}

  // --- Getters ---

  /**
   * Recupera la targa del veicolo tramite ID
   */
  get targaVeicolo(): string {
    const veicolo = this.veicoliService.veicoli.find((v: any) => v.id === this.polizza.veicolo_id);
    return veicolo ? veicolo.targa : `#${this.polizza.veicolo_id}`;
  }

  /**
   * Calcola la percentuale di tempo trascorso
   */
  get progressPercentual(): number {
    if (!this.polizza.data_inizio || !this.polizza.data_scadenza) return 0;
    
    const inizio = new Date(this.polizza.data_inizio).getTime();
    const fine = new Date(this.polizza.data_scadenza).getTime();
    const oggi = new Date().getTime();

    if (oggi < inizio) return 0;
    if (oggi > fine) return 100;

    const totale = fine - inizio;
    const trascorso = oggi - inizio;
    return Math.round((trascorso / totale) * 100);
  }

  // --- Logica ---

  close(): void { this.closed.emit(); }

  private formattaData(data: any): string {
    if (!data) return '';
    const d = new Date(data);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }

  apriConfermaElimina(): void {
    this.showConfermaElimina = true;
    this.eliminaErrore = '';
  }

  chiudiConfermaElimina(): void {
    this.showConfermaElimina = false;
  }

  confermElimina(): void {
    if (!this.polizza.id) return;
    this.eliminando = true;
    this.polizzeService.eliminaPolizza(this.polizza.id).subscribe({
      next: () => {
        this.eliminando = false;
        this.eliminata.emit();
        this.closed.emit();
      },
      error: () => {
        this.eliminaErrore = "Errore durante l'eliminazione.";
        this.eliminando = false;
      }
    });
  }

  apriModifica(): void {
    this.polizzaModifica = { 
      ...this.polizza,
      data_inizio: this.formattaData(this.polizza.data_inizio),
      data_scadenza: this.formattaData(this.polizza.data_scadenza)
    };
    this.showModifica = true;
  }

  chiudiModifica(): void {
    this.showModifica = false;
    this.modificaErrore = '';
    this.modificaSuccesso = '';
  }

  salvaModifica(): void {
    if (!this.polizzaModifica.n_polizza || !this.polizzaModifica.data_inizio || !this.polizzaModifica.data_scadenza) {
      this.modificaErrore = 'Campi obbligatori mancanti.';
      return;
    }
    
    if (!this.polizza.id) return;
    this.salvandoModifica = true;

    const payload = {
      ...this.polizzaModifica,
      massimale: Number(this.polizzaModifica.massimale) || 0
    };

    this.polizzeService.aggiornaPolizza(this.polizza.id, payload).subscribe({
      next: () => {
        this.modificaSuccesso = 'Polizza aggiornata!';
        this.salvandoModifica = false;
        this.aggiornata.emit({ ...this.polizza, ...payload } as Polizza);
        setTimeout(() => this.chiudiModifica(), 1500);
      },
      error: (err) => {
        this.salvandoModifica = false;
        this.modificaErrore = err.error?.error || 'Errore nel salvataggio.';
      }
    });
  }
}