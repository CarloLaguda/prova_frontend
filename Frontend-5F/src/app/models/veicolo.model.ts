export interface Veicolo {
  id: number;
  cf: string;
  marca: string;
  modello: string;
  targa: string;
  anno_immatricolazione: number;
  n_telaio?: string;
}