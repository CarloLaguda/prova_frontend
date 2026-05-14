export interface Perizia {
  _id: string;
  sinistro_id: string;
  perito_id: string;
  data_perizia: string;
  ora_perizia: string;
  note_tecniche: string;
  documenti: string[];
  stato: string;
  stima_danno?: number;
  esito?: string;
  id_officina?: string;
  data_inserimento: Date;
}