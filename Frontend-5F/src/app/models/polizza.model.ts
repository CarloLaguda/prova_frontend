export interface Polizza {
  id?:                    number;   // PK MySQL, assente in fase di creazione
  n_polizza:              string;   // obbligatorio — POST & PUT
  compagnia_assicurativa?: string;  // opzionale
  data_inizio:            string;   // obbligatorio — formato 'YYYY-MM-DD'
  data_scadenza:          string;   // obbligatorio — formato 'YYYY-MM-DD', usato in PUT
  massimale?:             number;   // opzionale
  tipo_copertura?:        string;   // default 'RCA' lato backend
  veicolo_id:             number;   // obbligatorio — FK
  assicuratore_id?:       number;   // opzionale — FK, valorizzato dal component
}