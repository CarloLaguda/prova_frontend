import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sinistri } from '../services/sinistri.service';
import { VeicoliService } from '../services/veicoli.service';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/mail.service';
import { sinistro } from '../models/sinistro.model';


@Component({
  selector: 'app-nuovo-sinistro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuovo-sinistro.component.html',
  styleUrl: './nuovo-sinistro.component.css',
})
export class NuovoSinistroComponent implements OnInit {
  @Output() created = new EventEmitter<any>();
  @Output() closed  = new EventEmitter<void>();


  formData = {
    targa: '',
    data_evento: '',
    descrizione: '',
    luogo: '',
    geolocalizzazione: { latitudine: 0, longitudine: 0 }
  };
  maxDate        = '';
  loading        = false;
  errorMessage   = '';
  warningMessage = '';
  successMessage = '';


  constructor(
    private sinistriService: Sinistri,
    public  veicoliService:  VeicoliService,
    private auth:            AuthService,
    private emailService:    EmailService,
  ) {}


  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;
    if (userId) this.veicoliService.getVeicoliUtente(userId).subscribe();


    const oggi   = new Date();
    const anno   = oggi.getFullYear();
    const mese   = String(oggi.getMonth() + 1).padStart(2, '0');
    const giorno = String(oggi.getDate()).padStart(2, '0');
    this.maxDate = `${anno}-${mese}-${giorno}`;
    this.formData.data_evento = this.maxDate;
  }


  selectVehicle(targa: string): void {
    this.formData.targa = targa;
    this.errorMessage   = '';
  }


  private getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalizzazione non supportata dal browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error)    => reject(new Error('Impossibile ottenere la posizione: ' + error.message)),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }


  async submit(): Promise<void> {
    if (!this.formData.targa || !this.formData.data_evento || !this.formData.descrizione) {
      this.errorMessage = 'Compila tutti i campi obbligatori.';
      return;
    }


    this.loading       = true;
    this.errorMessage  = '';
    this.warningMessage = '';


    let hasPosition = false;


    try {
      const position = await this.getCurrentPosition();
      this.formData.geolocalizzazione.latitudine  = position.lat;
      this.formData.geolocalizzazione.longitudine = position.lng;
      hasPosition = true;
    } catch {
      this.warningMessage = 'Posizione non disponibile: il sinistro verrà creato comunque.';
    }


    if (this.formData.data_evento > this.maxDate) {
      this.formData.data_evento = this.maxDate;
    }


    const payload: sinistro = {
      automobilista_id: this.auth.currentUser?.id || 0,
      targa:            this.formData.targa,
      data_evento:      new Date(this.formData.data_evento),
      descrizione:      this.formData.descrizione,
      luogo:            this.formData.luogo?.trim() || undefined,
      ...(hasPosition ? { geolocalizzazione: this.formData.geolocalizzazione } : {})
    };


    this.sinistriService.createSinistro(payload).subscribe({
      next: (res: any) => {
        this.loading        = false;
        this.successMessage = 'Sinistro e pratica creati con successo!';


        const sinistroId = res?.mongo_id ?? res?.id_mongo ?? '';
        const nome = `${this.auth.currentUser?.nome ?? ''} ${this.auth.currentUser?.cognome ?? ''}`.trim();


        // ── Notifica automobilista ─────────────────────────────────────
        this.emailService.notificaNuovoSinistro({
          nomeAutomobilista: nome,
          targa:             payload.targa,
          dataEvento:        this.formData.data_evento,
          descrizione:       payload.descrizione ?? '',
          sinistroId,
        });
        // ──────────────────────────────────────────────────────────────


        this.created.emit(res);
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.loading      = false;
        this.errorMessage = 'Errore durante il salvataggio. Riprova.';
        console.error('Errore salvataggio sinistro:', err);
      }
    });
  }


  close(): void { this.closed.emit(); }
}