/**
 * cuenta.model.ts
 * Modelos e interfaces para el sistema de cuentas
 */

// ============================================================
// INTERFACES DE CUENTA
// ============================================================

export interface Cuenta {
  id: number;
  circulo_id: number;
  nombre: string;
  icono: string;
  color: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  saldo_actual: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCuentaRequest {
  circulo_id: number;
  nombre: string;
  icono?: string;
  color?: string;
  descripcion?: string;
  orden?: number;
}

export interface UpdateCuentaRequest {
  nombre?: string;
  icono?: string;
  color?: string;
  descripcion?: string;
  orden?: number;
}

// ============================================================
// INTERFACES DE RESPUESTAS API
// ============================================================

export interface CuentasResponse {
  success: boolean;
  message: string;
  data: {
    cuentas: Cuenta[];
    total: number;
  };
}

export interface CuentaResponse {
  success: boolean;
  message: string;
  data: Cuenta;
}

export interface SaldoCuentaResponse {
  success: boolean;
  message: string;
  data: {
    cuenta_id: number;
    nombre: string;
    saldo_actual: number;
  };
}

export interface ResumenSaldosResponse {
  success: boolean;
  message: string;
  data: {
    cuentas: Cuenta[];
    total_saldo: number;
    total_cuentas: number;
  };
}

// ============================================================
// TIPO DE MOVIMIENTO EXTENDIDO (para saber cómo manejar cuentas)
// ============================================================

export enum TipoMovimiento {
  INGRESO = 1,
  GASTO = 2,
  TRASLADO = 3
}
