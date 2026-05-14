import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VeicoliService } from '../services/veicoli.service';
import { AuthService } from '../services/auth.service';
import { PolizzeService } from '../services/polizze.service';
import { Polizza } from '../models/polizza.model';

@Component({
  selector: 'app-crea-polizza',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crea-polizza.html',
  styleUrl: './crea-polizza.css',
})
export class CreaPolizzaComponent implements OnInit {
  @Output() created = new EventEmitter<any>();
  @Output() closed  = new EventEmitter<void>();

  formData: Partial<Polizza> = {
    tipo_copertura: 'RCA'
  };

  loading        = false;
  errorMessage   = '';
  successMessage = '';

  constructor(
    public  veicoliService: VeicoliService,
    private auth:           AuthService,
    private polizzeService: PolizzeService
  ) {}

  ngOnInit(): void {
    const currentUser = this.auth.currentUser;

    if (currentUser?.ruolo === 'assicuratore') {
      this.formData.compagnia_assicurativa = (currentUser as any).nome_compagnia || 'Compagnia non definita';
    }

    const userId = Number(currentUser?.id);
    if (currentUser?.ruolo === 'assicuratore') {
      this.veicoliService.askVeicoliAll();
    } else if (userId) {
      this.veicoliService.askVeicoliUtente(userId);
    }
  }

  submit(): void {
    if (!this.formData.n_polizza ||
        !this.formData.data_inizio ||
        !this.formData.data_scadenza ||
        !this.formData.veicolo_id ||
        this.formData.massimale == null ||
        !this.formData.tipo_copertura ||
        !this.formData.compagnia_assicurativa) {
      this.errorMessage = 'Compila tutti i campi obbligatori (*).';
      return;
    }

    this.loading      = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: any = {
      n_polizza:              this.formData.n_polizza!,
      compagnia_assicurativa: this.formData.compagnia_assicurativa || '',
      data_inizio:            this.formData.data_inizio!,
      data_scadenza:          this.formData.data_scadenza!,
      massimale:              this.formData.massimale ? Number(this.formData.massimale) : undefined,
      tipo_copertura:         this.formData.tipo_copertura ?? 'RCA',
      veicolo_id:             Number(this.formData.veicolo_id),
    };

    // Passa utente_id — il backend trova da solo l'assicuratore_id tramite JOIN
    if (this.auth.currentUser?.ruolo === 'assicuratore') {
      payload.utente_id = Number(this.auth.currentUser.id);
    }

    this.polizzeService.creaPolizza(payload).subscribe({
      next: (res: any) => {
        this.loading        = false;
        this.successMessage = '✅ Polizza creata con successo!';
        this.created.emit(res);
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.loading      = false;
        this.errorMessage = err.error?.error || 'Errore durante il salvataggio. Riprova più tardi.';
        console.error('Errore salvataggio polizza:', err);
      }
    });
  }

  close(): void { this.closed.emit(); }
}