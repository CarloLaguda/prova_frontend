import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VeicoliService } from '../services/veicoli.service';
import { AuthService } from '../services/auth.service';
import { VeicoloItem } from '../veicolo-item/veicolo-item';
import { NuovoVeicoloComponent } from '../nuovo-veicolo/nuovo-veicolo';
import { DettagliVeicoloComponent } from '../dettagli-veicolo/dettagli-veicolo';
import { Veicolo } from '../models/veicolo.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-veicoli',
  standalone: true,
  imports: [CommonModule, VeicoloItem,FormsModule, NuovoVeicoloComponent, DettagliVeicoloComponent],
  templateUrl: './lista-veicoli.html',
  styleUrl: './lista-veicoli.css'
})
export class ListaVeicoli implements OnInit, OnDestroy {
  showNuovoVeicolo = false;
  veicoloSelezionato: Veicolo | null = null;
  searchVeicolo: string = '';

  private refreshInterval?: ReturnType<typeof setInterval>;
  private dataSub?: Subscription;

  constructor(
    public veicoliService: VeicoliService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;

    this.veicoliService.getVeicoliUtente(userId).subscribe();

    this.dataSub = this.veicoliService.veicoli$.subscribe(() => {
      this.cdr.detectChanges();
    });

    this.refreshInterval = setInterval(() => {
      this.veicoliService.getVeicoliUtente(userId).subscribe();
    }, 15000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
    this.dataSub?.unsubscribe();
  }

  tornaAllaDashboard(): void {
    this.router.navigate(['/automobilista']);
  }

  onVeicoloCreato(): void {
    const userId = this.auth.currentUser?.id;
     if (!userId) return;
    this.showNuovoVeicolo = false;
    this.veicoliService.getVeicoliUtente(userId).subscribe();
  }

  apriDettaglio(v: Veicolo): void {
    this.veicoloSelezionato = v;
  }

  chiudiDettaglio(): void {
    this.veicoloSelezionato = null;
  }
}