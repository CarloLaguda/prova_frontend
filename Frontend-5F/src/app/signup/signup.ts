import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/mail.service';


@Component({
  selector: 'app-registra-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
})
export class RegistraClienteComponent implements OnInit {


  @Output() created = new EventEmitter<any>();
  @Output() closed  = new EventEmitter<void>();


  // ── stato wizard ──────────────────────────────────────────────────────────
  step: 1 | 2 | 3 = 1;
  loading    = false;
  errorMsg   = '';
  successMsg = '';


  readonly steps = [
    { label: 'Cliente', icon: 'bi-person'       },
    { label: 'Veicolo', icon: 'bi-car-front'    },
    { label: 'Polizza', icon: 'bi-shield-check' },
  ];


  // ── STEP 1: dati cliente ──────────────────────────────────────────────────
  nuovoCliente = {
    nome: '', cognome: '', cf: '', email: '', telefono: '', password: '',
  };
  showPassword = false;


  // ── STEP 2: dati veicolo ──────────────────────────────────────────────────
  formVeicolo = {
    targa: '', marca: '', modello: '', n_telaio: '',
    anno_immatricolazione: new Date().getFullYear(),
  };


  // ── STEP 3: dati polizza ──────────────────────────────────────────────────
  formPolizza: {
    n_polizza: string;
    compagnia_assicurativa: string;
    tipo_copertura: string;
    data_inizio: string;
    data_scadenza: string;
    massimale: number | null;
  } = {
    n_polizza: '', compagnia_assicurativa: '',
    tipo_copertura: 'RCA', data_inizio: '', data_scadenza: '', massimale: null,
  };


  constructor(
    private authService:  AuthService,
    private emailService: EmailService,
  ) {}


  ngOnInit(): void {
    this.formPolizza.data_inizio = new Date().toISOString().split('T')[0];


    const u = this.authService.currentUser;
    if (u?.ruolo === 'assicuratore') {
      this.formPolizza.compagnia_assicurativa = (u as any).nome_compagnia ?? '';
    }
  }


  // ── navigazione tra step ──────────────────────────────────────────────────


  avanti(): void {
    this.errorMsg = '';
    if      (this.step === 1) { if (this.validaCliente()) this.step = 2; }
    else if (this.step === 2) { if (this.validaVeicolo()) this.step = 3; }
    else if (this.step === 3) { if (this.validaPolizza()) this.completaRegistrazione(); }
  }


  indietro(): void { if (this.step > 1) this.step = (this.step - 1) as 1 | 2 | 3; }
  chiudi():   void { this.closed.emit(); }


  // ── validazioni locali ────────────────────────────────────────────────────


  private validaCliente(): boolean {
    const { nome, cognome, cf, email, telefono, password } = this.nuovoCliente;
    if (!nome.trim() || !cognome.trim())       { this.errorMsg = 'Nome e cognome sono obbligatori.'; return false; }
    if (cf.trim().length !== 16)               { this.errorMsg = 'Codice fiscale non valido (16 caratteri).'; return false; }
    if (!email.trim() || !email.includes('@')) { this.errorMsg = 'Email non valida.'; return false; }
    if (!telefono.trim())                      { this.errorMsg = 'Telefono obbligatorio.'; return false; }
    if (!password.trim())                      { this.errorMsg = 'Password temporanea obbligatoria.'; return false; }
    return true;
  }


  private validaVeicolo(): boolean {
    const { targa, marca, modello, n_telaio } = this.formVeicolo;
    if (!targa.trim() || !marca.trim() || !modello.trim() || !n_telaio.trim()) {
      this.errorMsg = 'Tutti i campi obbligatori del veicolo devono essere compilati.'; return false;
    }
    if (!this.targaValida(targa)) { this.errorMsg = 'Formato targa non valido. Esempio: AB123CD'; return false; }
    return true;
  }


  private validaPolizza(): boolean {
    const { n_polizza, compagnia_assicurativa, tipo_copertura, data_inizio, data_scadenza, massimale } = this.formPolizza;
    if (!n_polizza.trim())              { this.errorMsg = 'Il numero di polizza è obbligatorio.'; return false; }
    if (!compagnia_assicurativa.trim()) { this.errorMsg = 'La compagnia assicurativa è obbligatoria.'; return false; }
    if (!tipo_copertura)                { this.errorMsg = 'Seleziona un tipo di copertura.'; return false; }
    if (!data_inizio || !data_scadenza) { this.errorMsg = 'Le date di inizio e scadenza sono obbligatorie.'; return false; }
    if (data_scadenza <= data_inizio)   { this.errorMsg = 'La scadenza deve essere successiva alla data di inizio.'; return false; }
    if (!massimale || massimale <= 0)   { this.errorMsg = 'Il massimale deve essere un valore positivo.'; return false; }
    return true;
  }


  // ── registrazione completa ────────────────────────────────────────────────


  private completaRegistrazione(): void {
    this.loading  = true;
    this.errorMsg = '';


    // Salviamo la password in chiaro PRIMA della chiamata (il payload la invia come hash)
    const passwordInChiaro = this.nuovoCliente.password;
    const u = this.authService.currentUser;


    this.authService.registrazioneCompleta({
      utente: {
        nome:          this.nuovoCliente.nome,
        cognome:       this.nuovoCliente.cognome,
        cf:            this.nuovoCliente.cf,
        email:         this.nuovoCliente.email,
        telefono:      this.nuovoCliente.telefono,
        password_hash: this.nuovoCliente.password,
      },
      veicolo: {
        targa:                 this.formVeicolo.targa.toUpperCase().trim(),
        n_telaio:              this.formVeicolo.n_telaio,
        marca:                 this.formVeicolo.marca,
        modello:               this.formVeicolo.modello,
        anno_immatricolazione: this.formVeicolo.anno_immatricolazione,
      },
      polizza: {
        n_polizza:              this.formPolizza.n_polizza,
        compagnia_assicurativa: this.formPolizza.compagnia_assicurativa,
        tipo_copertura:         this.formPolizza.tipo_copertura,
        data_inizio:            this.formPolizza.data_inizio,
        data_scadenza:          this.formPolizza.data_scadenza,
        massimale:              Number(this.formPolizza.massimale),
        assicuratore_utente_id: u?.id,
      },
    }).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.loading    = false;
          this.successMsg = 'Registrazione completata con successo!';


          // ── Notifica credenziali al nuovo automobilista ─────────────────
          this.emailService.notificaCredenziali({
            nome:     this.nuovoCliente.nome,
            email:    this.nuovoCliente.email,   // email reale dal form, non quella di test
            password: passwordInChiaro,
          }).subscribe({
            next:  () => console.log('Email credenziali inviata a:', this.nuovoCliente.email),
            error: (err) => console.warn('Email credenziali non inviata:', err),
          });
          // ────────────────────────────────────────────────────────────────


          this.created.emit(res);
        });
      },
      error: (err) => {
        console.error('Errore registrazione-completa — status:', err.status);
        console.error('Errore registrazione-completa — body:', err.error);
        this.gestisciErrore(
          err.status === 409
            ? (err?.error?.error ?? 'Dato già esistente (email, CF, targa o numero polizza).')
            : (err?.error?.error ?? err?.error?.message ?? 'Errore durante la registrazione.')
        );
      },
    });
  }


  private gestisciErrore(msg: string): void {
    setTimeout(() => { this.loading = false; this.errorMsg = msg; });
  }


  // ── helper template ───────────────────────────────────────────────────────


  targaValida(targa: string): boolean {
    return /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(targa.toUpperCase().trim());
  }


  soloNumeri(event: KeyboardEvent): void {
    if (!/[0-9+\s]/.test(event.key)) event.preventDefault();
  }
}
