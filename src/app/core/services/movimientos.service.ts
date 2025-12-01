/**
 * MovimientosService - ACTUALIZADO CON SISTEMA DE CUENTAS
 * Servicio para CRUD de movimientos y consultas de balance
 * Soporta: Ingresos, Gastos y Traslados entre cuentas
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  CreateMovimientoRequest,
  MovimientoResponse,
  MovimientosResponse,
  BalanceResponse,
  BalanceDetalladoResponse,
  EvolucionResponse,
  TotalesPorDiaResponse,
  TotalesPorCategoriaResponse,
  GraficoCategoriaResponse,
  SaldoAnteriorResponse
} from '../models/movimiento.model';

// Interface para periodos disponibles
export interface PeriodoDisponible {
  anio: number;
  meses: number[];
}

export interface PeriodosDisponiblesResponse {
  success: boolean;
  message: string;
  data: {
    periodos: PeriodoDisponible[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {

  constructor(private apiService: ApiService) { }

  /**
   * Crear nuevo movimiento
   * 
   * IMPORTANTE - Campos de cuentas según tipo:
   * 
   * Para INGRESO (tipo_mov_id=1):
   *   - Incluir: cuenta_id
   *   - NO incluir: cuenta_origen_id, cuenta_destino_id
   * 
   * Para GASTO (tipo_mov_id=2):
   *   - Incluir: cuenta_id
   *   - NO incluir: cuenta_origen_id, cuenta_destino_id
   * 
   * Para TRASLADO (tipo_mov_id=3):
   *   - Incluir: cuenta_origen_id, cuenta_destino_id
   *   - NO incluir: cuenta_id
   *   - Validar: cuenta_origen_id !== cuenta_destino_id
   */
  create(data: CreateMovimientoRequest): Observable<MovimientoResponse> {
    return this.apiService.post<MovimientoResponse>('movimientos', data);
  }

  /**
   * Actualizar movimiento existente
   * 
   * NOTA: Ahora permite actualizar cuentas
   * 
   * @param id ID del movimiento a actualizar
   * @param data Datos a actualizar (todos opcionales)
   */
  update(id: number, data: Partial<CreateMovimientoRequest>): Observable<MovimientoResponse> {
    return this.apiService.put<MovimientoResponse>(`movimientos/${id}`, data);
  }

  /**
   * Obtener movimientos con filtros
   * 
   * @param tipoMovId Tipo de movimiento (1=Ingreso, 2=Gasto, 3=Traslado, null=Todos)
   * @param circuloId ID del círculo (opcional)
   * @param anio Año (opcional)
   * @param mes Mes (opcional)
   * @param limit Límite de resultados (0 = sin límite, null = sin límite)
   */
  getMovimientos(
    tipoMovId?: number,
    circuloId?: number,
    anio?: number,
    mes?: number,
    limit?: number | null
  ): Observable<MovimientosResponse> {
    const params: any = {};

    if (tipoMovId) params.tipo_mov_id = tipoMovId;
    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;
    
    // Si limit es undefined, no lo enviamos (backend decide)
    // Si limit es 0 o null, significa "sin límite"
    if (limit !== undefined) {
      params.limit = limit === null ? 0 : limit;
    }

    return this.apiService.get<MovimientosResponse>('movimientos', params);
  }

  /**
   * Obtener movimiento por ID
   * 
   * NOTA: La respuesta incluye información de cuentas según tipo:
   * - Ingresos/Gastos: cuenta_id, cuenta_nombre, cuenta_icono
   * - Traslados: cuenta_origen_id, cuenta_origen_nombre, cuenta_origen_icono,
   *              cuenta_destino_id, cuenta_destino_nombre, cuenta_destino_icono
   */
  getById(id: number): Observable<MovimientoResponse> {
    return this.apiService.get<MovimientoResponse>(`movimientos/${id}`);
  }

  /**
   * Eliminar movimiento
   */
  delete(id: number): Observable<any> {
    return this.apiService.delete(`movimientos/${id}`);
  }

  /**
   * Obtener balance (totales)
   * 
   * NOTA: Los traslados NO afectan el balance
   * (solo se suman ingresos y gastos)
   */
  getBalance(
    circuloId?: number,
    anio?: number,
    mes?: number
  ): Observable<BalanceResponse> {
    const params: any = {};

    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;

    return this.apiService.get<BalanceResponse>('movimientos/balance', params);
  }

  /**
   * Obtener saldo del mes anterior
   * NOTA: Este método retorna un observable vacío si el endpoint no existe
   */
  getSaldoAnterior(
    circuloId?: number,
    anio?: number,
    mes?: number
  ): Observable<SaldoAnteriorResponse> {
    const params: any = {};
    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;

    return this.apiService.get<SaldoAnteriorResponse>('movimientos/saldo/anterior', params)
      .pipe(
        tap(response => {
        }),
        catchError((error) => {
          // IMPRIMIR EL ERROR REAL
          console.error("getSaldoAnterior - ERROR REAL:", error);
          console.error("Status:", error.status);
          console.error("Error body:", error.error);
          console.error("Message:", error.message);

          // Retornar respuesta por defecto
          return of({
            success: false,
            message: 'Endpoint no disponible',
            data: {
              saldo_mes_anterior: {
                fecha_corte: '',
                total_ingresos_acumulados: 0,
                total_gastos_acumulados: 0,
                saldo_anterior: 0
              }
            }
          });
        })
      );
  }

  /**
   * Obtener balance detallado por concepto
   */
  getBalanceDetallado(
    circuloId?: number,
    anio?: number,
    mes?: number
  ): Observable<BalanceDetalladoResponse> {
    const params: any = {};

    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;

    return this.apiService.get<BalanceDetalladoResponse>('movimientos/balance/detalle', params);
  }

  /**
   * Obtener evolución mensual (para gráfico)
   */
  getEvolucion(
    circuloId?: number,
    anio?: number
  ): Observable<EvolucionResponse> {
    const params: any = {};

    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;

    return this.apiService.get<EvolucionResponse>('movimientos/evolucion', params);
  }

  /**
   * Obtener totales agrupados por día
   */
  getTotalesPorDia(
    circuloId?: number,
    anio?: number,
    mes?: number
  ): Observable<TotalesPorDiaResponse> {
    const params: any = {};

    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;

    return this.apiService.get<TotalesPorDiaResponse>('movimientos/totales/dia', params);
  }

  /**
   * Obtener totales agrupados por categoría
   */
  getTotalesPorCategoria(
    circuloId?: number,
    anio?: number,
    mes?: number
  ): Observable<TotalesPorCategoriaResponse> {
    const params: any = {};

    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;

    return this.apiService.get<TotalesPorCategoriaResponse>('movimientos/totales/categoria', params);
  }

  /**
   * Obtener datos para gráfico de barras por categoría
   */
  getGraficoCategoria(
    circuloId: number,
    anio?: number,
    mes?: number
  ): Observable<GraficoCategoriaResponse> {
    const params: any = { circulo_id: circuloId };

    if (anio) params.anio = anio;
    if (mes) params.mes = mes;

    return this.apiService.get<GraficoCategoriaResponse>('movimientos/grafico/categoria', params);
  }

  /**
   * Obtener periodos disponibles (años y meses con registros)
   * 
   * @param circuloId ID del círculo (opcional)
   * @param tipoMovId Tipo de movimiento (1=Ingreso, 2=Gasto, 3=Traslado, null=Todos)
   */
  getPeriodosDisponibles(
    circuloId?: number,
    tipoMovId?: number
  ): Observable<PeriodosDisponiblesResponse> {
    const params: any = {};

    if (circuloId) params.circulo_id = circuloId;
    if (tipoMovId) params.tipo_mov_id = tipoMovId;

    return this.apiService.get<PeriodosDisponiblesResponse>('movimientos/periodos/disponibles', params);
  }
}