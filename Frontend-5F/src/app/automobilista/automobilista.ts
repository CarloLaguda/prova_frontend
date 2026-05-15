import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timer, Subscription } from 'rxjs';

import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { RichiestaSoccorsoComponent } from '../richiesta-soccorso/richiesta-soccorso';
import { sinistro } from '../models/sinistro.model';
import { User } from '../models/user.model';
import { Veicolo } from '../models/veicolo.model';

import { VeicoliService } from '../services/veicoli.service';
import { Sinistri } from '../services/sinistri.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-automobilista',
  standalone: true,
  imports: [CommonModule, NuovoSinistroComponent, DettaglioSinistroComponent, FormsModule, RichiestaSoccorsoComponent],
  templateUrl: './automobilista.html',
  styleUrl: './automobilista.css',
})
export class Automobilista implements OnInit, OnDestroy {
  showNewSinistro   = false;
  showSoccorso      = false;
  sinistri: sinistro[] = [];
  veicoli: Veicolo[]   = [];
  searchTerm = '';
  user?: User;
  sinistroSelezionato?: sinistro;

  private refreshSub?: Subscription;
  private dataSub = new Subscription();

  constructor(
    public auth: AuthService,
    public veicoliService: VeicoliService,
    private sinistriService: Sinistri,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;

    this.dataSub.add(
      this.sinistriService.sinistri$.subscribe((data: sinistro[]) => {
        this.sinistri = data;
        this.cdr.detectChanges();
      })
    );

    this.dataSub.add(
      this.veicoliService.veicoli$.subscribe((data: Veicolo[]) => {
        this.veicoli = data;
        this.cdr.detectChanges();
      })
    );

    this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    this.refreshSub = timer(0, 45000).subscribe(() => this.caricaDati());
  }

  caricaDati(): void {
    const userId = this.auth.currentUser?.id;
    if (userId) {
      this.veicoliService.askVeicoliUtente(userId);
      this.sinistriService.askSinistri(userId);
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.dataSub.unsubscribe();
  }

  get sinistriFiltrati(): sinistro[] {
    if (!this.searchTerm.trim()) return this.sinistri;
    const search = this.searchTerm.toLowerCase();
    return this.sinistri.filter(s =>
      (s.targa?.toLowerCase().includes(search)) ||
      (s.descrizione?.toLowerCase().includes(search)) ||
      (s.stato?.toLowerCase().includes(search))
    );
  }

  /** Sinistri con rimborso in attesa o già approvato */
  get sinistriConRimborso(): sinistro[] {
    return this.sinistri.filter(s => {
      const stato = (s.stato_sinistro ?? s.stato ?? '').toLowerCase();
      return stato === 'rimborso_proposto' || stato === 'rimborso_approvato';
    });
  }

  /** Somma degli importi di rimborso approvati */
  get totaleRimborsiApprovati(): number {
    return this.sinistri
      .filter(s => (s.stato_sinistro ?? s.stato ?? '').toLowerCase() === 'rimborso_approvato')
      .reduce((sum, s) => {
        const importo = (s as any).preventivo?.costo_totale ?? (s as any).stima_danno ?? 0;
        return sum + (Number(importo) || 0);
      }, 0);
  }

  /** Importo di rimborso del sinistro (preventivo o stima_danno) */
  importoRimborso(s: sinistro): number {
    return (s as any).preventivo?.costo_totale ?? (s as any).stima_danno ?? 0;
  }

  openDettaglio(s: sinistro): void    { this.sinistroSelezionato = s; }
  closeDettaglio(): void              { this.sinistroSelezionato = undefined; }
  onCreated(): void                   { this.caricaDati(); this.closeNewSinistro(); }
  openNewSinistro(): void             { this.showNewSinistro = true; }
  closeNewSinistro(): void            { this.showNewSinistro = false; }
  openSoccorso(): void                { this.showSoccorso = true; }
  closeSoccorso(): void               { this.showSoccorso = false; }
  vaiAVeicoli(): void                 { this.router.navigate(['/veicoli']); }
}