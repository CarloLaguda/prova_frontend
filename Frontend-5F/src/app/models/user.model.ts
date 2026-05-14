export interface User {
  id?: number;
  nome: string;
  cognome: string;
  cf: string;
  email: string;
  password_hash: string;
  ruolo?: 'automobilista' | 'perito' | 'assicuratore';
  telefono?: string;           // ← aggiungi questa riga

  // Campi opzionali specifici per ruolo
  nome_compagnia?: string;
  id_compagnia?: number;
}