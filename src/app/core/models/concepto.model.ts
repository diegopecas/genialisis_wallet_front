/**
 * Modelo: Concepto y Categoría
 */

export interface Concepto {
  id: number;
  nombre: string;
  icono: string;
  es_real: boolean;
  requiere_detalle: boolean;
  descripcion?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  orden: number;
  conceptos: Concepto[];
}

export interface ConceptosResponse {
  success: boolean;
  message: string;
  data: {
    categorias: Categoria[];
  };
}
