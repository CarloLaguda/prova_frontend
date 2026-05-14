export interface Pratica {
  // ─── Campi principali (nuovo schema Proto_Intervento_SC) ─────────────────
  _id?: string;
  sinistro_id: string;
  perito_id?: string | null;
  officina_id?: number | null;
  veicolo_targa?: string;
  stato: string;
  tipo_intervento?: string;            // nuovo nome (ex tipo_danno)
  descrizione_lavori?: string;         // nuovo nome (ex descrizione)
  ricambi_utilizzati?: Array<{         // nuovo nome (ex parti_danneggiate)
    nome: string;
    codice?: string;
    costo?: number;
  }>;
  manodopera_ore?: number | null;
  note_tecnico?: string;               // nuovo nome (ex note_tecniche)
  foto_prima?: string[];
  foto_dopo?: string[];
  data_inizio?: string | null;
  data_fine?: string | null;

  // ─── Alias retrocompatibilità ─────────────────────────────────────────────
  titolo?: string;
  tipo_danno?: string;                 // alias di tipo_intervento
  descrizione?: string;                // alias di descrizione_lavori
  stima_danno?: number;
  parti_danneggiate?: string[];        // alias di ricambi_utilizzati
  conclusione?: string;
  veicolo?: string;
  claim_code?: string;
  note_tecniche?: string;              // alias di note_tecnico
  note_perito?: string;
  documenti?: string[];

  // ─── Campi comuni ─────────────────────────────────────────────────────────
  data_inserimento?: Date | string;
  data_aggiornamento?: Date | string;
  sinistro?: any;                      // oggetto sinistro embedded (vista perito)
}
