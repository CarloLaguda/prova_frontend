import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { sinistro } from '../models/sinistro.model';
import { Sinistri } from '../services/sinistri.service';
import { CreaPraticaComponent } from '../crea-pratica/crea-pratica';
import { RichiestaSoccorsoComponent } from '../richiesta-soccorso/richiesta-soccorso';

@Component({
  selector: 'app-dettaglio-sinistro',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, CreaPraticaComponent, RichiestaSoccorsoComponent],
  templateUrl: './dettagli-sinistro.html',
  styleUrls: ['./dettagli-sinistro.css'],
})
export class DettaglioSinistroComponent implements OnInit {
  @Input() sinistro!: sinistro;
  @Output() closed = new EventEmitter<void>();
  @Input() ruolo: 'automobilista' | 'assicuratore' = 'automobilista';

  stati = ['APERTO', 'IN ANALISI', 'CHIUSO', 'in_perizia', 'in_riparazione', 'rimborso_proposto'];
  mostraCreaPratica = false;
  showSoccorso      = false;
  descrizioneEditabile = '';
  saving = false;
  saveError = '';
  saveSuccess = '';

  immagini: any[] = [];
  uploadingFiles: File[] = [];
  previewUrls: string[] = [];
  uploading = false;
  uploadError = '';
  uploadSuccess = '';

  // Google Maps
  center: google.maps.LatLngLiteral = { lat: 41.9028, lng: 12.4964 }; // Roma di default
  zoom = 12;
  markerOptions: google.maps.MarkerOptions = { draggable: false };
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    fullscreenControl: false,
    mapTypeControl: true,
    streetViewControl: false
  };

  get hasPosition(): boolean {
    return !!(this.sinistro?.geolocalizzazione || (this.sinistro?.latitudine && this.sinistro?.longitudine));
  }

  constructor(
    private sinistriService: Sinistri,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Accetta sia 'descrizione' (alias retrocompat) che 'descrizione_danno' (nuovo schema)
    this.descrizioneEditabile = this.sinistro?.descrizione ?? this.sinistro?.descrizione_danno ?? '';
    if (this.sinistro?.immagini?.length) {
      this.immagini = this.sinistro.immagini.map((img: any) => {
        if (typeof img === 'string') return img;
        if (img.secure_url) return img.secure_url;
        if (img.url) return img.url;
        if (img.public_id) return `https://res.cloudinary.com/dm6estjhs/image/upload/${img.public_id}`;
        return null;
      }).filter(Boolean);
    }

    // Imposta la mappa se posizione disponibile
    if (this.hasPosition) {
      const lat = this.sinistro.geolocalizzazione?.latitudine || this.sinistro.latitudine;
      const lng = this.sinistro.geolocalizzazione?.longitudine || this.sinistro.longitudine;
      if (lat !== undefined && lng !== undefined) {
        this.center = { lat, lng };
        this.zoom = 15;
      }
    }
  }

  get puoModificare(): boolean {
    const stato = (this.sinistro?.stato_sinistro ?? this.sinistro?.stato ?? '').toUpperCase();
    return this.ruolo === 'assicuratore' && (stato === 'APERTO' || stato === 'IN ANALISI');
  }

  cambiaStato(nuovoStato: string) {
    if (!this.puoModificare || this.sinistro.stato === nuovoStato) return;
    this.sinistro.stato = nuovoStato;
  }

  salvaSinistro(): void {
    if (!this.sinistro?._id) {
      this.saveError = 'Impossibile salvare il sinistro.';
      return;
    }

    this.saving = true;
    this.saveError = '';
    this.saveSuccess = '';

    const updateData: Partial<sinistro> = {
      descrizione: this.descrizioneEditabile,
      stato: this.sinistro.stato
    };

    this.sinistriService.aggiornaSinistro(this.sinistro._id, updateData).subscribe({
      next: () => {
        this.sinistro.descrizione = this.descrizioneEditabile;
        this.saveSuccess = 'Sinistro aggiornato con successo.';
        this.saving = false;
        this.close();
      },
      error: (err: any) => {
        console.error('Errore salvataggio sinistro:', err);
        this.saveError = 'Errore durante il salvataggio. Riprova.';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.uploadingFiles = files;
    this.previewUrls = [];
    this.uploadError = '';
    this.uploadSuccess = '';
    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
        loaded++;
        if (loaded === files.length) this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  inviaImmagini(): void {
    if (!this.uploadingFiles.length || !this.sinistro._id) return;
    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';
    this.cdr.detectChanges();
    this.sinistriService.uploadImmagini(this.sinistro._id, this.uploadingFiles).subscribe({
      next: () => {
        this.immagini = [...this.immagini, ...this.previewUrls];
        this.previewUrls = [];
        this.uploadingFiles = [];
        this.uploading = false;
        this.uploadSuccess = 'Immagini caricate!';
        this.cdr.detectChanges();
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.uploading = false;
        this.uploadError = 'Errore durante il caricamento. Riprova.';
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}