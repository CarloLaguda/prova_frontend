import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistenteService } from '../services/assistente.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-assistente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistente.component.html',
  styleUrls: ['./assistente.component.css'],
})
export class AssistenteComponent {
  open = false;
  query = '';
  loading = false;
  error = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Ciao! Sono SafeBot, l\'assistente virtuale SafeClaim. Chiedimi qualcosa e ti aiuto subito.',
    },
  ];

  constructor(
    private assistenteService: AssistenteService,
    private cdr: ChangeDetectorRef   // <-- aggiunto
  ) {}

  toggleOpen(): void {
    this.open = !this.open;
  }

  submitQuestion(): void {
    const domanda = this.query.trim();
    if (!domanda || this.loading) {
      return;
    }

    this.error = '';
    this.pushMessage('user', domanda);
    this.query = '';
    this.loading = true;
    this.cdr.detectChanges();   // <-- notifica Angular prima della chiamata HTTP

    this.assistenteService.chat(domanda).subscribe({
      next: (response) => {
        this.pushMessage('assistant', response.risposta || 'Mi dispiace, non ho una risposta disponibile al momento.');
        this.loading = false;
        this.cdr.detectChanges();   // <-- notifica Angular dopo la risposta
      },
      error: () => {
        this.loading = false;
        this.error = 'Errore di connessione al servizio assistente. Riprova più tardi.';
        this.cdr.detectChanges();   // <-- notifica Angular anche in caso di errore
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitQuestion();
    }
  }

  private pushMessage(role: ChatMessage['role'], text: string): void {
    this.messages.push({ role, text });
  }
}