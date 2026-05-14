import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { Polizza } from '../models/polizza.model';
import { AssistenteComponent } from '../assistente/assistente.component';
import { PolizzeService } from '../services/polizze.service';
import { VeicoliService } from '../services/veicoli.service';
import { Veicolo } from '../models/veicolo.model';

export type UserRole = 'perito' | 'automobilista' | 'assicuratore';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, AssistenteComponent],
  templateUrl: './base.html',
  styleUrl: './base.css',
})
export class Base implements OnInit {
  sidebarOpen = false;
  isAuthPage = false;

  // --- Edit profilo ---
  editMode = false;
  editForm: Partial<User> = {};
  savingProfile = false;
  saveMessage = '';
  saveError = '';

  // --- Cambia password ---
  passwordAttuale  = '';
  nuovaPassword    = '';
  confermaPassword = '';
  showPasswordSection   = false;
  showPasswordAttuale   = false;
  showNuovaPassword     = false;
  showConfermaPassword  = false;

  // --- Polizze nella sidebar (solo automobilista) ---
  polizze: Polizza[] = [];
  veicoli: Veicolo[] = [];
  polizzeLoading = false;

  private readonly validRoles = ['perito', 'automobilista', 'assicuratore'];

  get currentRole(): UserRole | '' {
    const role = (this.auth.currentUser?.ruolo ?? localStorage.getItem('userRole') ?? '').toLowerCase();
    if (this.validRoles.includes(role)) return role as UserRole;
    if (role === 'assicurazione') return 'assicuratore';
    return '';
  }

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    public auth: AuthService,
    private polizzeService: PolizzeService,
    private veicoliService: VeicoliService
  ) {}

  ngOnInit(): void {
    this.isAuthPage = this.checkAuthPage(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.isAuthPage = this.checkAuthPage(e.urlAfterRedirects || e.url);
        this.cdr.detectChanges();
      });

    const savedRole = localStorage.getItem('userRole');
    if (!savedRole) {
      this.router.navigate(['/signin']);
      this.cdr.detectChanges();
      return;
    }
  }

  get user() { return this.auth.currentUser; }

  get initials(): string {
    const u = this.user;
    if (!u) return '?';
    return ((u.nome?.charAt(0) ?? '') + (u.cognome?.charAt(0) ?? '')).toUpperCase() || '?';
  }

  get roleLabel(): string {
    const map: Record<string, string> = {
      perito: 'Perito',
      automobilista: 'Automobilista',
      assicuratore: 'Assicuratore',
      assicurazione: 'Assicuratore',
    };
    return map[this.currentRole] ?? this.currentRole;
  }

  private get actualRole(): string {
    return this.auth.currentUser?.ruolo ?? localStorage.getItem('userRole') ?? '';
  }

  get showAssistente(): boolean {
    return !this.isAuthPage && this.actualRole === 'automobilista';
  }

  get isAutomobilista(): boolean {
    return this.actualRole === 'automobilista';
  }

  /** Polizze con il veicolo associato già risolto */
  get polizzeConVeicolo(): { polizza: Polizza; veicolo: Veicolo | undefined }[] {
    return this.polizze.map(p => ({
      polizza: p,
      veicolo: this.veicoli.find(v => v.id === p.veicolo_id)
    }));
  }

  isPolizzaAttiva(p: Polizza): boolean {
    return new Date(p.data_scadenza) >= new Date();
  }

  giorniAllaScadenza(p: Polizza): number {
    return Math.ceil((new Date(p.data_scadenza).getTime() - Date.now()) / 86400000);
  }

  private checkAuthPage(url: string): boolean {
    return ['/signin', '/signup'].some(r => url.startsWith(r));
  }

  openSidebar(): void {
    this.sidebarOpen = true;
    this.resetEdit();
    if (this.isAutomobilista) this.caricaContrattiSidebar();
  }

  private caricaContrattiSidebar(): void {
    const userId = this.auth.currentUser?.id;
  if (!userId) return;
  this.polizzeLoading = true;
  this.polizze = [];
  this.polizzeService.getPolizzeUtente(userId).subscribe({
    next: (polizze) => {
      this.polizze = polizze;
      this.polizzeLoading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.polizzeLoading = false;
      this.cdr.detectChanges();
    }
  });
  }

  closeSidebar(): void { this.sidebarOpen = false; this.resetEdit(); }

  enterEditMode(): void {
    if (!this.user) return;
    // Solo email è modificabile; nome/cognome sono read-only
    this.editForm = { email: this.user.email };
    this.editMode = true;
    this.saveMessage     = '';
    this.saveError       = '';
    this.passwordAttuale  = '';
    this.nuovaPassword    = '';
    this.confermaPassword = '';
    this.showPasswordSection = false;
  }

  cancelEdit(): void { this.resetEdit(); }

  private resetEdit(): void {
    this.editMode = false;
    this.editForm = {};
    this.saveError = '';
    this.passwordAttuale      = '';
    this.nuovaPassword        = '';
    this.confermaPassword     = '';
    this.showPasswordSection  = false;
    this.showPasswordAttuale  = false;
    this.showNuovaPassword    = false;
    this.showConfermaPassword = false;
  }

  saveProfile(): void {
    if (!this.user?.id) return;

    // Validazione password se la sezione è aperta
    if (this.showPasswordSection) {
      if (!this.passwordAttuale) {
        this.saveError = 'Inserisci la password attuale per cambiarla.';
        return;
      }
      if (!this.nuovaPassword) {
        this.saveError = 'Inserisci la nuova password.';
        return;
      }
      if (this.nuovaPassword !== this.confermaPassword) {
        this.saveError = 'Le nuove password non coincidono.';
        return;
      }
    }

    this.savingProfile = true;
    this.saveMessage   = '';
    this.saveError     = '';

    this.auth.updateUser(this.user.id, this.editForm).subscribe({
      next: (res: any) => {
        if (res?.status !== 'success') {
          this.savingProfile = false;
          this.saveError = res?.error || res?.message || 'Impossibile aggiornare il profilo';
          this.cdr.detectChanges();
          return;
        }

        // Se la sezione password è aperta, cambia anche la password
        if (this.showPasswordSection && this.nuovaPassword) {
          this.auth.cambiaPassword(this.user!.id!, this.passwordAttuale, this.nuovaPassword).subscribe({
            next: () => {
              this.savingProfile = false;
              this.saveMessage   = 'Profilo e password aggiornati con successo!';
              this.editMode      = false;
              this.resetEdit();
              this.cdr.detectChanges();
              setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3500);
            },
            error: (err) => {
              this.savingProfile = false;
              this.saveError = err?.error?.error || err?.error?.message || 'Errore durante il cambio password';
              this.cdr.detectChanges();
            },
          });
        } else {
          this.savingProfile = false;
          this.saveMessage   = 'Profilo aggiornato con successo!';
          this.editMode      = false;
          this.cdr.detectChanges();
          setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
        }
      },
      error: (err) => {
        this.savingProfile = false;
        this.saveError = err?.error?.error || err?.error?.message || 'Errore di connessione al server';
        this.cdr.detectChanges();
      },
    });
  }

  goHome(): void { window.location.reload(); }

  logout(): void {
    this.auth.logout();
    localStorage.clear();
    this.router.navigate(['/signin']);
    this.closeSidebar();
  }
}