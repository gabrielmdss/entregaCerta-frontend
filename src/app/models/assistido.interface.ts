export interface Assistido {
  id: number;
  nome: string;
  documento: string;
  data_nascimento?: Date | string | null;
  imagem?: string | null;
  }