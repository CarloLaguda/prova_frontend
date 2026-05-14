export interface sinistro {
  // ─── Campi principali (nuovo schema Proto_Sinistro_SC) ───────────────────
  automobilista_id: number;
  targa: string;
  data_sinistro?: Date | string;       // nuovo nome campo
  descrizione_danno?: string;          // nuovo nome campo
  stato_sinistro?: string;             // nuovo nome campo
  modello_veicolo?: string;
  cliente?: string;
  compagnia_assicurativa?: string;
  numero_sinistro?: string;
  telaio?: string;
  officina_id?: number | null;
  priorita?: 'bassa' | 'normale' | 'urgente' | string;
  attivo?: boolean;
  note?: string;
  contatto_cliente?: { telefono?: string; email?: string };
  preventivo?: {
    data?: string | null;
    costo_totale?: number | null;
    ore_manodopera?: number | null;
    giorni_previsti?: number | null;
    stato?: string;
    dettaglio_voci?: any[];
    fattura?: string | null;
  };

  // ─── Alias retrocompatibilità (il backend li restituisce entrambi) ────────
  data_evento?: Date | string;         // alias di data_sinistro
  descrizione?: string;                // alias di descrizione_danno
  stato?: string;                      // alias di stato_sinistro

  // ─── Campi comuni ─────────────────────────────────────────────────────────
  _id?: string;
  data_inserimento?: Date | string;
  data_assegnazione?: Date | string;
  immagini?: Array<string | { url: string; public_id: string }>;
  analisi_ai?: {
    stato?: string;
    testo?: string;
    modello?: string;
    data_analisi?: string;
    errore?: string;
  } | null;
  geolocalizzazione?: { latitudine: number; longitudine: number };
  latitudine?: number;
  longitudine?: number;
  luogo?: string;
  pratica_id?: string;
  perito_id?: string;
}
