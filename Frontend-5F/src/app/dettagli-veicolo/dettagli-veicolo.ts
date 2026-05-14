import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Veicolo } from '../models/veicolo.model';

@Component({
  selector: 'app-dettagli-veicolo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dettagli-veicolo.html',
  styleUrl: './dettagli-veicolo.css',
})
export class DettagliVeicoloComponent {
  @Input() veicolo!: Veicolo;
  @Output() closed = new EventEmitter<void>();

  close(): void { this.closed.emit(); }
}