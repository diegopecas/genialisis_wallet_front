/**
 * Modelo: Movimiento - ACTUALIZADO CON SISTEMA DE CUENTAS
 * Ahora soporta: Ingresos, Gastos y Traslados entre cuentas
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
  tipo_movimiento: 'Ingreso' | 'Gasto' | 'Traslado';
  tipo_icono: string;
  valor: number;
  fecha: string;
  detalle?: string;
  notas?: string;
  creado_por_ia: boolean;
  
  // === CAMPOS DE CUENTAS ===
  // Para INGRESO/GASTO (tipo_mov_id 1 o 2)
  cuenta_id?: number;
  cuenta_nombre?: string;
  cuenta_icono?: string;
  
  // Para TRASLADO (tipo_mov_id 3)
  cuenta_origen_id?: number;
  cuenta_origen_nombre?: string;
  cuenta_origen_icono?: string;
  cuenta_destino_id?: number;
  cuenta_destino_nombre?: string;
  cuenta_destino_icono?: string;
  
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
  
  // === CAMPOS DE CUENTAS ===
  // Para INGRESO/GASTO: enviar cuenta_id
  cuenta_id?: number;
  
  // Para TRASLADO: enviar cuenta_origen_id + cuenta_destino_id
  cuenta_origen_id?: number;
  cuenta_destino_id?: number;
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

// Balance con campos obligatorios (no opcionales)
export interface Balance {
  total_ingresos: number;
  total_gastos: number;
  balance_neto: number;
  saldo_anterior: number;  // Ahora es obligatorio
  saldo_final: number;     // Ahora es obligatorio
}

export interface BalanceResponse {
  success: boolean;
  message: string;
  data: Balance;
}

export interface SaldoAnterior {
  fecha_corte: string;
  total_ingresos_acumulados: number;
  total_gastos_acumulados: number;
  saldo_anterior: number;
}

export interface SaldoAnteriorResponse {
  success: boolean;
  message: string;
  data: {
    saldo_mes_anterior: SaldoAnterior;
  };
}

export interface DetalleConcepto {
  concepto_id: number;
  concepto_nombre: string;
  concepto_icono: string;
  categoria_nombre: string;
  tipo_movimiento: 'Ingreso' | 'Gasto' | 'Traslado';
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

export interface EvolucionDia {
  dia: number;
  fecha: string;
  ingresos: number;
  gastos: number;
  balance: number;
  saldo_acumulado: number;
}

export interface EvolucionDiariaResponse {
  success: boolean;
  message: string;
  data: {
    saldo_inicial: number;
    datos: EvolucionDia[];
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
  tipo_movimiento: 'Ingreso' | 'Gasto' | 'Traslado';
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

// === ENUM PARA TIPOS DE MOVIMIENTO ===
export enum TipoMovimiento {
  INGRESO = 1,
  GASTO = 2,
  TRASLADO = 3
}