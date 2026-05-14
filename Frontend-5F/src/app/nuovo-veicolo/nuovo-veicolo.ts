import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VeicoliService } from '../services/veicoli.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-nuovo-veicolo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuovo-veicolo.html',
  styleUrl: './nuovo-veicolo.css',
})
export class NuovoVeicoloComponent {
  @Output() created = new EventEmitter<any>();
  @Output() closed  = new EventEmitter<void>();

  // formData aggiornato con i nuovi campi
  formData = {
    targa: '',
    marca: '',
    modello: '',
    n_telaio: '',
    anno_immatricolazione: new Date().getFullYear()
  };

  loading      = false;
  errorMessage   = '';
  successMessage = '';

  constructor(
    private veicoliService: VeicoliService,
    private auth: AuthService
  ) {}

  protected targaValida(targa: string): boolean {
    return /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa.toUpperCase().trim());
  }

  submit(): void {
    this.errorMessage = '';

    // Validazione estesa ai nuovi campi
    if (!this.formData.targa.trim() || !this.formData.marca.trim() || 
        !this.formData.modello.trim() || !this.formData.n_telaio.trim()) {
      this.errorMessage = 'Compila tutti i campi obbligatori compreso il telaio.';
      return;
    }

    if (!this.targaValida(this.formData.targa)) {
      this.errorMessage = 'Formato targa non valido. Esempio: AB123CD';
      return;
    }

    this.loading = true;

    const payload = {
      ...this.formData,
      targa: this.formData.targa.toUpperCase().trim(),
      automobilista_id: this.auth.currentUser?.id // Risolve l'errore TS (2345)
    };

    this.veicoliService.createVeicolo(payload).subscribe({
      next: (res: any) => {
        this.loading        = false;
        this.successMessage = 'Veicolo aggiunto con successo!';
        this.created.emit(res);
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.loading      = false;
        if (err.status === 409) {
          this.errorMessage = 'Targa o numero telaio già esistenti.';
        } else {
          this.errorMessage = 'Errore durante il salvataggio. Riprova.';
        }
        console.error(err);
      }
    });
  }

  close(): void { this.closed.emit(); }
}