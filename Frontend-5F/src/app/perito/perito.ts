// ── Shared types ──────────────────────────────────────────────────────────────

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'van' | 'suv';

export interface Claim {
  id:               string;
  praticaId?:       string;
  code:             string;
  status:           'in_valutazione' | 'assegnato' | 'in_perizia' | 'chiuso' | 'in_attesa' | 'approvato';
  type:             string;
  location:         string;
  date:             string;
  time:             string;
  vehicle:          string;
  priority:         'alta' | 'media' | 'bassa';
  insuranceCompany: string;
  amount?:          number;
  month?:           number;
  year?:            number;
  /** ID alternativi per il filtro rifiuto/eliminazione (sinistro._id, pratica._id, ecc.) */
  _altIds?:         string[];
}

export interface Relazione {
  id?:              string;
  claimCode:        string;
  sinistroId?:      string;
  title:            string;
  vehicle:          string;
  tipoDanno:        string;
  estimatedDamage?: number;
  partiDanneggiate: string[];
  description:      string;
  conclusione:      string;
  status:           'Bozza' | 'Completata' | 'Inviata';
  createdAt?:       string;
}

export interface SinistroDettaglio {
  id:            string;
  targa?:        string;
  marca?:        string;
  modello?:      string;
  dataEvento?:   string;
  descrizione?:  string;
  luogo?:        string;
  tipoSinistro?: string;
  stimaDanno?:   number;
  stato?:        string;
  compagnia?:    string;
  immagini:      Array<{ url: string; public_id: string }>;
  analisiAi?: {
    testo?:       string;
    modello?:     string;
    stato:        'completata' | 'in_elaborazione' | 'errore' | 'non_avviata';
    dataAnalisi?: string;
    errore?:      string;
  };
}

export interface ArchivedEntry {
  claim:     Claim;
  relazione: Relazione;
}

export interface Toast {
  id:      number;
  message: string;
  sub:     string;
  claim?:  Claim;
}

// ── Component ──────────────────────────────────────────────────────────────────

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ClaimCardComponent } from '../claim-card/claim-card.component';
import { Perizie } from '../services/perizie.service';
import { AuthService } from '../services/auth.service';
import { timer, Subscription } from 'rxjs';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-perito',
  standalone: true,
  imports: [CommonModule, FormsModule, ClaimCardComponent],
  templateUrl: './perito.html',
  styleUrl: './perito.css',
})
export class Perito implements OnInit, OnDestroy {

  currentView: 'dashboard' | 'archivio' | 'relazioni' = 'dashboard';
  isClaimDetailOpen   = false;
  isRelazioneOpen     = false;
  isLoading           = true;
  isRelazioniLoading  = false;
  relazioneError      = '';

  selectedClaim:    Claim | null             = null;
  selectedSinistro: SinistroDettaglio | null = null;
  isLoadingSinistro = false;
  lightboxUrl:      string | null            = null;

  mapCoords: { lat: number; lng: number } | null = null;
  isGeocodingLocation = false;

  private aiPollInterval: any = null;

  claims:    Claim[] = [];
  allClaims: Claim[] = [];

  private rejectedClaimIds = new Set<string>();
  private deletedClaimIds  = new Set<string>();

  toasts: Toast[]      = [];
  private toastCounter = 0;
  private previousPendingCount = -1;
  private previousPendingIds   = new Set<string>();

  dashboardSearch = '';

  confirmActionClaim: { claim: Claim; action: 'accept' | 'reject' } | null = null;
  isProcessingAction = false;

  filterSearch   = '';
  filterStatus   = '';
  filterPriority = '';
  filterDateFrom = '';
  filterDateTo   = '';

  user = { full_name: '', id: '', email: '', phone: '', ruolo: '' };

  relazioni: Relazione[] = [];
  editingRelazione: Partial<Relazione> = { partiDanneggiate: [], status: 'Bozza' };
  customParte      = '';
  customTipoDanno  = '';
  relazioneSinistro: SinistroDettaglio | null = null;
  isLoadingRelazioneSinistro = false;

  tipiDanno = ['Collisione', 'Grandine', 'Furto', 'Incendio', 'Vandalismo', 'Altro'];
  partiDisponibili = [
    'Paraurti anteriore', 'Cofano', 'Parafango anteriore SX', 'Parafango anteriore DX',
    'Calandra', 'Griglia anteriore', 'Sottoparaurti anteriore',
    'Paraurti posteriore', 'Portellone', 'Parafango posteriore SX', 'Parafango posteriore DX',
    'Sottoparaurti posteriore',
    'Portiera anteriore SX', 'Portiera anteriore DX', 'Portiera posteriore SX', 'Portiera posteriore DX',
    'Fiancata SX', 'Fiancata DX', 'Brancardo SX', 'Brancardo DX', 'Montante SX', 'Montante DX',
    'Parabrezza', 'Lunotto', 'Vetro portiera SX', 'Vetro portiera DX',
    'Specchietto SX', 'Specchietto DX',
    'Tetto', 'Tetto apribile', 'Padiglione interno',
    'Faro anteriore SX', 'Faro anteriore DX', 'Fanale posteriore SX', 'Fanale posteriore DX',
    'Fendinebbia SX', 'Fendinebbia DX', 'Indicatore di direzione',
    'Cerchio anteriore SX', 'Cerchio anteriore DX', 'Cerchio posteriore SX', 'Cerchio posteriore DX',
    'Pneumatico anteriore SX', 'Pneumatico anteriore DX', 'Pneumatico posteriore SX', 'Pneumatico posteriore DX',
    'Telaio', 'Sospensioni anteriori', 'Sospensioni posteriori', 'Impianto frenante',
    'Impianto di scarico', 'Motore', 'Cambio', 'Radiatore', 'Serbatoio carburante',
    'Sedile anteriore SX', 'Sedile anteriore DX', 'Sedili posteriori', 'Plancia',
    'Volante', 'Airbag anteriori', 'Airbag laterali', 'Cruscotto',
    'Antenna', 'Targa anteriore', 'Targa posteriore', 'Modanature laterali',
  ];
  conclusioni = ['Riparabile', 'Danno totale', 'In valutazione', 'Frode sospetta'];

  confirmDeleteClaim:     Claim | null     = null;
  confirmDeleteRelazione: Relazione | null = null;

  private refreshSub?: Subscription;

  constructor(
    private perizie:   Perizie,
    private auth:      AuthService,
    private cdr:       ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.loadUser();
    this.loadClaims();
    this.loadRelazioni();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshSub = timer(45000, 45000).subscribe(() => { this.loadClaims(); });
  }

  ngOnDestroy(): void {
    this.stopAIPoll();
    this.refreshSub?.unsubscribe();
  }

  private showNewClaimToast(claim: Claim): void {
    const id = ++this.toastCounter;
    this.toasts = [...this.toasts, {
      id,
      message: 'Nuova pratica assegnata!',
      sub:     `${claim.code} · ${claim.vehicle}`,
      claim,
    }];
    this.cdr.detectChanges();
    setTimeout(() => this.dismissToast(id), 30000);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }

  openClaimFromToast(toast: Toast): void {
    this.dismissToast(toast.id);
    if (toast.claim) {
      this.setView('dashboard');
      this.openClaimDetail(toast.claim);
    }
  }

  get pendingClaims(): Claim[] {
    return this.allClaims.filter(c => c.status === 'assegnato').filter(c => this.matchesDashboardSearch(c));
  }

  get activeClaims(): Claim[] {
    return this.allClaims.filter(c => c.status !== 'assegnato' && c.status !== 'chiuso').filter(c => this.matchesDashboardSearch(c));
  }

  private matchesDashboardSearch(c: Claim): boolean {
    if (!this.dashboardSearch) return true;
    const q = this.dashboardSearch.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.vehicle.toLowerCase().includes(q) ||
           c.location.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) ||
           c.insuranceCompany.toLowerCase().includes(q);
  }

  get activeClaimsCount(): number {
    return this.allClaims.filter(c => c.status === 'in_perizia' || c.status === 'in_valutazione' || c.status === 'in_attesa').length;
  }

  get pendingClaimsCount(): number { return this.allClaims.filter(c => c.status === 'assegnato').length; }
  get totalArchiveAmount(): number { return this.relazioni.reduce((sum, r) => sum + (r.estimatedDamage ?? 0), 0); }
  get relazioniCount(): number { return this.relazioni.length; }

  private applyFilters(list: Claim[]): Claim[] {
    return list.filter(c => {
      const matchSearch = !this.filterSearch ||
        c.code.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        c.vehicle.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        c.location.toLowerCase().includes(this.filterSearch.toLowerCase());
      const matchStatus   = !this.filterStatus   || c.status   === this.filterStatus;
      const matchPriority = !this.filterPriority || c.priority === this.filterPriority;
      const parts = c.date?.split(' ');
      const mesi: Record<string, number> = {
        'gennaio':1,'febbraio':2,'marzo':3,'aprile':4,'maggio':5,'giugno':6,
        'luglio':7,'agosto':8,'settembre':9,'ottobre':10,'novembre':11,'dicembre':12,
      };
      const claimDate = parts?.length === 3
        ? new Date(+parts[2], (mesi[parts[1].toLowerCase()] ?? 1) - 1, +parts[0]) : null;
      const matchFrom = !this.filterDateFrom || !claimDate || claimDate >= new Date(this.filterDateFrom);
      const matchTo   = !this.filterDateTo   || !claimDate || claimDate <= new Date(this.filterDateTo);
      return matchSearch && matchStatus && matchPriority && matchFrom && matchTo;
    });
  }

  get filteredClaims(): Claim[] { return this.applyFilters(this.allClaims); }

  get archivedEntries(): ArchivedEntry[] {
    const entries: ArchivedEntry[] = [];
    for (const c of this.applyFilters(this.allClaims)) {
      const rel = this.getRelazioneForClaim(c);
      if (rel) entries.push({ claim: c, relazione: rel });
    }
    return entries;
  }

  private loadUser(): void {
    const u = this.auth.currentUser as any;
    if (!u) return;
    this.user = {
      full_name: `${u.nome ?? ''} ${u.cognome ?? ''}`.trim(),
      id: String(u.id ?? ''), email: u.email ?? '',
      phone: u.telefono ?? u.phone ?? '', ruolo: u.ruolo ?? '',
    };
  }

  private loadClaims(): void {
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? 'demo');
    this.perizie.getPratichePerito(peritoId).subscribe({
      next: (data) => { this.applyClaimsData(data.map(p => this.perizie.mapPraticaToClaimCard(p))); },
      error: () => {
        this.perizie.askTuttiSinistri().subscribe({
          next: (data: any) => {
            const lista = Array.isArray(data) ? data : (data.data ?? []);
            this.applyClaimsData(lista.map((s: any) => this.perizie.mapSinistreToClaim(s)));
          },
          error: () => { this.isLoading = false; this.cdr.detectChanges(); }
        });
      }
    });
  }

  /**
   * FIX: controlla sia id che _altIds per entrambi i set di esclusione.
   * Questo risolve il problema della pratica rifiutata che ricompare al refresh
   * perché il backend risponde con struttura diversa (sinistro non embedded).
   */
  private isExcluded(c: Claim, excludeSet: Set<string>): boolean {
    if (excludeSet.has(c.id)) return true;
    if (c._altIds) {
      for (const alt of c._altIds) { if (excludeSet.has(alt)) return true; }
    }
    return false;
  }

  private applyClaimsData(raw: Claim[]): void {
    const filtered = raw.filter(c =>
      !this.isExcluded(c, this.rejectedClaimIds) && !this.isExcluded(c, this.deletedClaimIds)
    );
    const pendingNow = filtered.filter(c => c.status === 'assegnato');

    if (this.previousPendingCount >= 0) {
      const newlyClaimed = pendingNow.filter(c => !this.previousPendingIds.has(c.id));
      newlyClaimed.forEach(c => this.showNewClaimToast(c));
    }

    this.previousPendingIds   = new Set(pendingNow.map(c => c.id));
    this.previousPendingCount = pendingNow.length;
    this.claims    = filtered;
    this.allClaims = [...filtered];
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private loadRelazioni(): void {
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');
    if (!peritoId) { this.isRelazioniLoading = false; return; }
    this.isRelazioniLoading = true;
    this.perizie.getRelazioniPerito(peritoId).subscribe({
      next: (data: any[]) => {
        this.relazioni = data.map(d => this.mapBackendToRelazione(d));
        this.isRelazioniLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.relazioni = []; this.isRelazioniLoading = false; this.cdr.detectChanges(); }
    });
  }

  private mapBackendToRelazione(d: any): Relazione {
    return {
      id:               String(d._id ?? d.id ?? ''),
      sinistroId:       String(d.sinistro_id ?? ''),
      claimCode:        d.claim_code ?? d.claimCode ?? '',
      title:            d.titolo ?? d.title ?? '',
      vehicle:          d.veicolo ?? d.vehicle ?? '',
      tipoDanno:        d.tipo_danno ?? d.tipoDanno ?? '',
      estimatedDamage:  d.stima_danno ?? d.estimatedDamage ?? undefined,
      partiDanneggiate: d.parti_danneggiate ?? d.partiDanneggiate ?? [],
      description:      d.descrizione ?? d.description ?? '',
      conclusione:      d.conclusione ?? '',
      status:           d.stato ?? d.status ?? 'Bozza',
      createdAt:        d.data_inserimento
        ? new Date(d.data_inserimento).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
        : undefined,
    };
  }

  setView(v: 'dashboard' | 'archivio' | 'relazioni'): void {
    this.currentView = v;
    if (v === 'relazioni' || v === 'archivio') this.loadRelazioni();
  }

  openAcceptReject(claim: Claim, action: 'accept' | 'reject'): void {
    this.confirmActionClaim = { claim, action };
  }

  cancelAcceptReject(): void {
    if (this.isProcessingAction) return;
    this.confirmActionClaim = null;
  }

  doAcceptReject(): void {
    if (!this.confirmActionClaim || this.isProcessingAction) return;
    const { claim, action } = this.confirmActionClaim;

    const idPerChiamata = claim.praticaId ?? claim.id;

    if (!idPerChiamata) {
      this.confirmActionClaim = null;
      this.isProcessingAction = false;
      this.cdr.detectChanges();
      return;
    }

    this.isProcessingAction = true;
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');

    const applyLocally = (fn: () => void) => {
      fn();
      this.confirmActionClaim = null;
      this.isProcessingAction = false;
      this.cdr.detectChanges();
    };

    if (action === 'accept') {
      this.perizie.accettaPratica(idPerChiamata, peritoId).subscribe({
        next:  () => applyLocally(() => this.updateClaimStatus(claim.id, 'in_perizia')),
        error: () => applyLocally(() => this.updateClaimStatus(claim.id, 'in_perizia')),
      });
    } else {
      this.rejectedClaimIds.add(claim.id);
      if (claim.praticaId) this.rejectedClaimIds.add(claim.praticaId);
      if (claim._altIds) { claim._altIds.forEach(alt => this.rejectedClaimIds.add(alt)); }

      this.perizie.rifiutaPratica(idPerChiamata, peritoId).subscribe({
        next:  () => applyLocally(() => this.removeClaimById(claim.id)),
        error: () => applyLocally(() => this.removeClaimById(claim.id)),
      });
    }
  }

  private updateClaimStatus(id: string, status: Claim['status']): void {
    const update = (list: Claim[]) => list.map(c => c.id === id ? { ...c, status } : c);
    this.allClaims = update(this.allClaims);
    this.claims    = update(this.claims);
    if (this.selectedClaim?.id === id) this.selectedClaim = { ...this.selectedClaim, status };
  }

  private removeClaimById(id: string): void {
    this.allClaims = this.allClaims.filter(c => c.id !== id);
    this.claims    = this.claims.filter(c => c.id !== id);
    if (this.selectedClaim?.id === id) this.closeClaimDetail();
  }

  hasRelazione(claim: Claim): boolean {
    return this.relazioni.some(r => r.sinistroId === claim.id || r.claimCode === claim.code);
  }

  getRelazioneForClaim(claim: Claim): Relazione | undefined {
    return this.relazioni.find(r => r.sinistroId === claim.id || r.claimCode === claim.code);
  }

  openArchivedEntry(entry: ArchivedEntry): void { this.openRelazioneDetail(entry.relazione); }

  openClaimDetail(c: Claim): void {
    this.selectedClaim     = c;
    this.isClaimDetailOpen = true;
    this.selectedSinistro  = null;
    this.mapCoords         = null;
    this.stopAIPoll();
    this.loadSinistroDetail(c.id);
  }

  closeClaimDetail(): void {
    this.isClaimDetailOpen   = false;
    this.selectedClaim       = null;
    this.selectedSinistro    = null;
    this.mapCoords           = null;
    this.isGeocodingLocation = false;
    this.stopAIPoll();
  }

  private loadSinistroDetail(sinistroId: string): void {
    this.isLoadingSinistro = true;
    this.perizie.getSinistro(sinistroId).subscribe({
      next: (data) => {
        const analisi = data.analisi_ai;
        this.selectedSinistro = {
          id: String(data._id ?? sinistroId), targa: data.targa, marca: data.marca, modello: data.modello,
          dataEvento: data.data_evento, descrizione: data.descrizione, luogo: data.luogo ?? data.indirizzo,
          tipoSinistro: data.tipo_sinistro, stimaDanno: data.stima_danno ?? data.importo, stato: data.stato,
          compagnia: data.compagnia_assicurativa ?? data.assicurazione,
          immagini: Array.isArray(data.immagini) ? data.immagini : [],
          analisiAi: analisi ? {
            testo: analisi.testo, modello: analisi.modello,
            stato: analisi.stato ?? 'non_avviata', dataAnalisi: analisi.data_analisi, errore: analisi.errore,
          } : { stato: 'non_avviata' },
        };
        this.isLoadingSinistro = false;
        const luogo = this.selectedSinistro.luogo ?? this.selectedClaim?.location;
        if (luogo && luogo !== 'N/D') this.geocodeLocation(luogo);
        if (this.selectedSinistro.analisiAi?.stato === 'in_elaborazione') this.startAIPoll(sinistroId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingSinistro = false;
        const luogo = this.selectedClaim?.location;
        if (luogo && luogo !== 'N/D') this.geocodeLocation(luogo);
        this.cdr.detectChanges();
      }
    });
  }

  private async geocodeLocation(address: string): Promise<void> {
    this.mapCoords = null; this.isGeocodingLocation = true; this.cdr.detectChanges();
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'it,en' } });
      if (res.ok) {
        const data: any[] = await res.json();
        if (data?.length > 0) this.mapCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) { console.warn('Geocoding failed:', e); }
    this.isGeocodingLocation = false; this.cdr.detectChanges();
  }

  getMapUrl(coords: { lat: number; lng: number }): SafeResourceUrl {
    const delta = 0.004;
    const bbox = `${coords.lng - delta},${coords.lat - delta},${coords.lng + delta},${coords.lat + delta}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`
    );
  }

  getOsmLink(coords: { lat: number; lng: number }): string {
    return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`;
  }

  private startAIPoll(sinistroId: string): void {
    let attempts = 0;
    this.aiPollInterval = setInterval(() => {
      attempts++;
      if (attempts > 12 || !this.isClaimDetailOpen) { this.stopAIPoll(); return; }
      this.perizie.getAnalisiAI(sinistroId).subscribe({
        next: (analisi) => {
          if (!this.selectedSinistro) return;
          this.selectedSinistro.analisiAi = {
            testo: analisi.testo, modello: analisi.modello,
            stato: analisi.stato ?? 'non_avviata', dataAnalisi: analisi.data_analisi, errore: analisi.errore,
          };
          if (analisi.stato !== 'in_elaborazione') this.stopAIPoll();
          this.cdr.detectChanges();
        }
      });
    }, 5000);
  }

  private stopAIPoll(): void {
    if (this.aiPollInterval) { clearInterval(this.aiPollInterval); this.aiPollInterval = null; }
  }

  openImage(url: string): void { this.lightboxUrl = url; }
  closeLightbox(): void        { this.lightboxUrl = null; }

  askDeleteClaim(c: Claim, event?: Event): void { event?.stopPropagation(); this.confirmDeleteClaim = c; }

  confirmDelete(): void {
    if (!this.confirmDeleteClaim) return;
    const claim = this.confirmDeleteClaim;
    this.deletedClaimIds.add(claim.id);
    if (claim._altIds) { claim._altIds.forEach(alt => this.deletedClaimIds.add(alt)); }
    this.removeClaimById(claim.id);
    this.confirmDeleteClaim = null;
    if (this.selectedClaim?.id === claim.id) this.closeClaimDetail();
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');
    this.perizie.eliminaPratica(claim.id, peritoId).subscribe({ next: () => {}, error: () => {} });
  }

  cancelDelete(): void { this.confirmDeleteClaim = null; }

  askDeleteRelazione(rel: Relazione, event?: Event): void { event?.stopPropagation(); this.confirmDeleteRelazione = rel; }

  confirmDeleteRel(): void {
    if (!this.confirmDeleteRelazione) return;
    const rel = this.confirmDeleteRelazione;
    if (rel.id) {
      this.perizie.eliminaRelazione(rel.id).subscribe({
        next:  () => { this.relazioni = this.relazioni.filter(r => r.id !== rel.id); this.confirmDeleteRelazione = null; this.cdr.detectChanges(); },
        error: () => { this.relazioni = this.relazioni.filter(r => r.id !== rel.id); this.confirmDeleteRelazione = null; this.cdr.detectChanges(); },
      });
    } else {
      this.relazioni = this.relazioni.filter(r => r !== rel);
      this.confirmDeleteRelazione = null;
    }
  }

  cancelDeleteRel(): void { this.confirmDeleteRelazione = null; }

  openNewRelazione(): void {
    this.editingRelazione = { partiDanneggiate: [], status: 'Bozza' };
    this.customParte = ''; this.customTipoDanno = ''; this.relazioneSinistro = null;
    this.relazioneError = ''; this.isRelazioneOpen = true;
  }

  openRelazioneFromClaim(c: Claim): void {
    this.editingRelazione = { claimCode: c.code, sinistroId: c.id, vehicle: c.vehicle, partiDanneggiate: [], status: 'Bozza' };
    this.customParte = ''; this.customTipoDanno = ''; this.relazioneError = '';
    if (this.selectedSinistro?.id === c.id) { this.relazioneSinistro = this.selectedSinistro; }
    else { this.loadSinistroForRelazione(c.id); }
    this.isClaimDetailOpen = false; this.isRelazioneOpen = true;
  }

  openRelazioneDetail(rel: Relazione): void {
    this.editingRelazione = { ...rel, partiDanneggiate: [...(rel.partiDanneggiate ?? [])] };
    if (rel.tipoDanno && !this.tipiDanno.includes(rel.tipoDanno)) {
      this.customTipoDanno = rel.tipoDanno; this.editingRelazione.tipoDanno = 'Altro';
    } else { this.customTipoDanno = ''; }
    this.customParte = ''; this.relazioneError = '';
    if (rel.sinistroId) this.loadSinistroForRelazione(rel.sinistroId);
    else this.relazioneSinistro = null;
    this.isRelazioneOpen = true;
  }

  closeRelazione(): void {
    this.isRelazioneOpen = false; this.relazioneError = '';
    this.customParte = ''; this.customTipoDanno = ''; this.relazioneSinistro = null;
  }

  private loadSinistroForRelazione(sinistroId: string): void {
    this.relazioneSinistro = null; this.isLoadingRelazioneSinistro = true; this.cdr.detectChanges();
    this.perizie.getSinistro(sinistroId).subscribe({
      next: (data) => {
        const analisi = data.analisi_ai;
        this.relazioneSinistro = {
          id: String(data._id ?? sinistroId), targa: data.targa, marca: data.marca, modello: data.modello,
          dataEvento: data.data_evento, descrizione: data.descrizione, luogo: data.luogo ?? data.indirizzo,
          tipoSinistro: data.tipo_sinistro, stimaDanno: data.stima_danno ?? data.importo, stato: data.stato,
          compagnia: data.compagnia_assicurativa ?? data.assicurazione,
          immagini: Array.isArray(data.immagini) ? data.immagini : [],
          analisiAi: analisi ? {
            testo: analisi.testo, modello: analisi.modello, stato: analisi.stato ?? 'non_avviata',
            dataAnalisi: analisi.data_analisi, errore: analisi.errore,
          } : { stato: 'non_avviata' },
        };
        this.isLoadingRelazioneSinistro = false; this.cdr.detectChanges();
      },
      error: () => { this.isLoadingRelazioneSinistro = false; this.cdr.detectChanges(); }
    });
  }

  get editingLinkedClaim(): Claim | null {
    if (!this.editingRelazione.claimCode) return null;
    return this.allClaims.find(c => c.code === this.editingRelazione.claimCode) ?? null;
  }

  saveRelazione(): void {
    this.relazioneError = '';
    const claim = this.allClaims.find(c => c.code === this.editingRelazione.claimCode);
    if (!claim) { this.relazioneError = 'Seleziona un sinistro valido prima di salvare.'; return; }
    if (this.editingRelazione.tipoDanno === 'Altro' && this.customTipoDanno?.trim()) {
      this.editingRelazione.tipoDanno = this.customTipoDanno.trim();
    }
    this.editingRelazione.sinistroId = claim.id;
    this.editingRelazione.vehicle    = claim.vehicle;
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');
    if (!peritoId) { this.relazioneError = 'Sessione scaduta. Rieffettua il login.'; return; }
    const sinistroId = this.editingRelazione.sinistroId!;
    const now = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

    if (this.editingRelazione.id) {
      this.perizie.aggiornaRelazione(sinistroId, peritoId, this.editingRelazione).subscribe({
        next: () => {
          const idx = this.relazioni.findIndex(r => r.id === this.editingRelazione.id);
          if (idx !== -1) {
            this.relazioni = [...this.relazioni.slice(0, idx), { ...(this.editingRelazione as Relazione) }, ...this.relazioni.slice(idx + 1)];
          }
          this.isRelazioneOpen = false; this.cdr.detectChanges();
        },
        error: (err) => { this.relazioneError = 'Errore durante il salvataggio. Riprova.'; console.error(err); }
      });
    } else {
      this.perizie.creaRelazione(sinistroId, peritoId, this.editingRelazione).subscribe({
        next: (res: any) => {
          const nuova: Relazione = { ...(this.editingRelazione as Relazione), id: res.id_perizia ?? String(Date.now()), status: 'Bozza', createdAt: now };
          this.relazioni = [...this.relazioni, nuova]; this.isRelazioneOpen = false; this.cdr.detectChanges();
        },
        error: (err) => { this.relazioneError = 'Errore durante il salvataggio. Riprova.'; console.error(err); }
      });
    }
  }

  addParte(p: string): void {
    if (!this.editingRelazione.partiDanneggiate) this.editingRelazione.partiDanneggiate = [];
    this.editingRelazione.partiDanneggiate = [...this.editingRelazione.partiDanneggiate, p];
  }

  removeParte(i: number): void {
    this.editingRelazione.partiDanneggiate = this.editingRelazione.partiDanneggiate?.filter((_, idx) => idx !== i);
  }

  addCustomParte(): void {
    const value = this.customParte?.trim();
    if (!value) return;
    if (!this.editingRelazione.partiDanneggiate) this.editingRelazione.partiDanneggiate = [];
    const exists = this.editingRelazione.partiDanneggiate.some(p => p.toLowerCase() === value.toLowerCase());
    if (!exists) this.editingRelazione.partiDanneggiate = [...this.editingRelazione.partiDanneggiate, value];
    this.customParte = '';
  }

  get isTipoDannoCustom(): boolean { return this.editingRelazione.tipoDanno === 'Altro'; }

  updateClaimPriority(claim: Claim, priority: 'alta' | 'media' | 'bassa'): void {
    if (!claim || claim.priority === priority) return;
    claim.priority = priority;
    const update = (list: Claim[]) => list.map(c => c.id === claim.id ? { ...c, priority } : c);
    this.claims = update(this.claims); this.allClaims = update(this.allClaims);
    if (this.selectedClaim?.id === claim.id) this.selectedClaim = { ...this.selectedClaim, priority };
    this.cdr.detectChanges();
  }

  exportRelazione(rel: Relazione, event?: Event): void {
    event?.stopPropagation();
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, margin = 20; let y = 0;
    doc.setFillColor(9, 99, 126); doc.rect(0, 0, W, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.text('SAFECLAIM', margin, 16);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text('Relazione Peritale', margin, 23);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(rel.title ?? 'Relazione', margin, 32);
    doc.setFontSize(8); doc.setTextColor(235, 244, 246); doc.text(rel.status.toUpperCase(), W - margin, 32, { align: 'right' });
    y = 50; doc.setTextColor(15, 23, 42);
    const section = (label: string) => {
      doc.setFillColor(241, 245, 249); doc.roundedRect(margin, y, W - margin * 2, 7, 1, 1, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), margin + 3, y + 4.8); y += 11; doc.setTextColor(15, 23, 42);
    };
    const row = (label: string, value: string) => {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139); doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(value, W - margin * 2 - 45); doc.text(lines, margin + 45, y); y += 6 * lines.length + 2;
    };
    section('Riferimento Sinistro');
    row('Codice Sinistro', rel.claimCode ?? '—'); row('Veicolo', rel.vehicle ?? '—');
    row('Data Redazione', rel.createdAt ?? new Date().toLocaleDateString('it-IT')); y += 4;
    section('Valutazione Danno');
    row('Tipo Danno', rel.tipoDanno ?? '—');
    row('Stima (€)', rel.estimatedDamage != null ? `€ ${rel.estimatedDamage.toLocaleString('it-IT')}` : '—');
    row('Parti Danneggiate', rel.partiDanneggiate?.join(', ') || '—'); y += 4;
    if (rel.description) {
      section('Descrizione Tecnica');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(rel.description, W - margin * 2); doc.text(lines, margin, y); y += 6 * lines.length + 6;
    }
    if (rel.conclusione) {
      section('Conclusione Peritale'); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      if (rel.conclusione === 'Danno totale') doc.setTextColor(220, 38, 38);
      else if (rel.conclusione === 'Riparabile') doc.setTextColor(5, 150, 105);
      else if (rel.conclusione === 'Frode sospetta') doc.setTextColor(217, 119, 6);
      else doc.setTextColor(9, 99, 126);
      doc.text(rel.conclusione, margin, y);
    }
    const pageH = 297;
    doc.setDrawColor(226, 232, 240); doc.line(margin, pageH - 20, W - margin, pageH - 20);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
    doc.text(`SafeClaim · Documento generato il ${new Date().toLocaleDateString('it-IT')}`, margin, pageH - 14);
    doc.text(rel.claimCode ?? '', W - margin, pageH - 14, { align: 'right' });
    doc.save(`Relazione_${rel.claimCode ?? 'perizia'}_${Date.now()}.pdf`);
  }

  resetFilters(): void {
    this.filterSearch = ''; this.filterStatus = ''; this.filterPriority = '';
    this.filterDateFrom = ''; this.filterDateTo = '';
  }

  getVehicleType(vehicle: string): VehicleType {
    const v = vehicle.toLowerCase();
    if (['ducati','yamaha','kawasaki','harley','honda cb','honda cbr','ktm','aprilia','triumph','bmw r','bmw gs','vespa','piaggio'].some(b => v.includes(b))) return 'motorcycle';
    if (['iveco','scania','man ','daf ','volvo fh','mercedes actros','mercedes arocs'].some(b => v.includes(b))) return 'truck';
    if (['transporter','transit','sprinter','ducato','master','jumper','vito','crafter','boxer','daily'].some(b => v.includes(b))) return 'van';
    if (['qashqai','tucson','sportage','tiguan','rav4','cr-v','x5','x3','xc60','discovery','defender','renegade','glc','gle','mokka','captur','kuga'].some(b => v.includes(b))) return 'suv';
    return 'car';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      in_valutazione: 'In Valutazione', assegnato: 'Da Accettare',
      in_perizia: 'In Corso', chiuso: 'Chiuso', in_attesa: 'In Attesa', approvato: 'Approvato',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      in_valutazione: 'bg-orange-100 text-orange-800 border-orange-300',
      assegnato:      'bg-amber-100 text-amber-800 border-amber-300',
      in_perizia:     'bg-teal-100 text-teal-800 border-teal-300',
      chiuso:         'bg-slate-100 text-slate-600 border-slate-300',
      in_attesa:      'bg-yellow-100 text-yellow-800 border-yellow-300',
      approvato:      'bg-green-100 text-green-800 border-green-300',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600 border-slate-300';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      alta: 'bg-red-100 text-red-700', media: 'bg-orange-100 text-orange-700', bassa: 'bg-green-100 text-green-700',
    };
    return map[priority] ?? '';
  }

  getRelazioneStatusClass(status: string): string {
    const map: Record<string, string> = {
      Bozza: 'bg-slate-200 text-slate-700', Completata: 'bg-green-100 text-green-800', Inviata: 'bg-teal-100 text-teal-800',
    };
    return map[status] ?? 'bg-slate-200 text-slate-700';
  }

  getConclusioneClass(c: string | undefined): string {
    switch (c) {
      case 'Danno totale':   return 'bg-red-100 text-red-800 border-red-200';
      case 'Riparabile':     return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Frode sospetta': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In valutazione': return 'bg-teal-100 text-teal-800 border-teal-200';
      default:               return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }

  formatDate(isoStr?: string): string {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return isoStr; }
  }
}