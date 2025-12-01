/**
 * MovimientosService
 * Servicio para CRUD de movimientos y consultas de balance
 * Compatible con versiones con y sin el endpoint de saldo anterior
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
   */
  create(data: CreateMovimientoRequest): Observable<MovimientoResponse> {
    return this.apiService.post<MovimientoResponse>('movimientos', data);
  }

  /**
   * Actualizar movimiento existente
   * 
   * @param id ID del movimiento a actualizar
   * @param data Datos a actualizar (todos opcionales excepto circulos_ids si se envía)
   */
  update(id: number, data: Partial<CreateMovimientoRequest>): Observable<MovimientoResponse> {
    return this.apiService.put<MovimientoResponse>(`movimientos/${id}`, data);
  }

  /**
   * Obtener movimientos con filtros
   * 
   * @param tipoMovId Tipo de movimiento (1=Ingreso, 2=Gasto, null=Todos)
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
   * @param tipoMovId Tipo de movimiento (1=Ingreso, 2=Gasto, null=Todos)
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