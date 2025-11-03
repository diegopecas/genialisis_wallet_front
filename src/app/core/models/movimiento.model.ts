/**
 * Modelo: Movimiento
 */

export interface Movimiento {
  id: number;
  user_id: number;
  usuario_nombre: string;
  concepto_id: number;
  concepto_nombre: string;
  concepto_icono: string;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_color: string;
  tipo_mov_id: number;
  tipo_movimiento: 'Ingreso' | 'Gasto';
  tipo_icono: string;
  valor: number;
  fecha: string;
  detalle?: string;
  notas?: string;
  creado_por_ia: boolean;
  circulos_nombres: string;
  es_compartido: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateMovimientoRequest {
  concepto_id: number;
  valor: number;
  fecha: string;
  circulos_ids: number[];
  detalle?: string;
  notas?: string;
}

export interface MovimientosResponse {
  success: boolean;
  message: string;
  data: {
    movimientos: Movimiento[];
    total: number;
  };
}

export interface MovimientoResponse {
  success: boolean;
  message: string;
  data: Movimiento;
}

export interface Balance {
  total_ingresos: number;
  total_gastos: number;
  balance_neto: number;
}

export interface BalanceResponse {
  success: boolean;
  message: string;
  data: Balance;
}

export interface DetalleConcepto {
  concepto_id: number;
  concepto_nombre: string;
  concepto_icono: string;
  categoria_nombre: string;
  tipo_movimiento: 'Ingreso' | 'Gasto';
  total: number;
  cantidad: number;
}

export interface BalanceDetalladoResponse {
  success: boolean;
  message: string;
  data: {
    detalle: DetalleConcepto[];
  };
}

export interface EvolucionMes {
  mes: number;
  mes_nombre: string;
  ingresos: number;
  gastos: number;
}

export interface EvolucionResponse {
  success: boolean;
  message: string;
  data: {
    anio: number;
    datos: EvolucionMes[];
  };
}
export interface TotalPorDia {
  fecha: string;
  total_ingresos: number;
  total_gastos: number;
  cantidad_ingresos: number;
  cantidad_gastos: number;
}

export interface TotalesPorDiaResponse {
  success: boolean;
  message: string;
  data: {
    totales: TotalPorDia[];
  };
}

export interface TotalPorCategoria {
  categoria_id: number;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_color: string;
  tipo_movimiento: 'Ingreso' | 'Gasto';
  cantidad: number;
  total: number;
}

export interface TotalesPorCategoriaResponse {
  success: boolean;
  message: string;
  data: {
    totales: TotalPorCategoria[];
  };
}
export interface GraficoCategoria {
  categoria_id: number;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_color: string;
  total_ingresos: number;
  total_gastos: number;
}

export interface GraficoCategoriaResponse {
  success: boolean;
  message: string;
  data: {
    categorias: GraficoCategoria[];
  };
}