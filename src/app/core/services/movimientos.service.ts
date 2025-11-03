/**
 * MovimientosService
 * Servicio para CRUD de movimientos y consultas de balance
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateMovimientoRequest,
  MovimientoResponse,
  MovimientosResponse,
  BalanceResponse,
  BalanceDetalladoResponse,
  EvolucionResponse
} from '../models/movimiento.model';

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {

  constructor(private apiService: ApiService) {}

  /**
   * Crear nuevo movimiento
   */
  create(data: CreateMovimientoRequest): Observable<MovimientoResponse> {
    return this.apiService.post<MovimientoResponse>('movimientos', data);
  }

  /**
   * Obtener movimientos con filtros
   * 
   * @param tipoMovId Tipo de movimiento (1=Ingreso, 2=Gasto, null=Todos)
   * @param circuloId ID del círculo (opcional)
   * @param anio Año (opcional)
   * @param mes Mes (opcional)
   * @param limit Límite de resultados (default: 10)
   */
  getMovimientos(
    tipoMovId?: number,
    circuloId?: number,
    anio?: number,
    mes?: number,
    limit: number = 10
  ): Observable<MovimientosResponse> {
    const params: any = { limit };
    
    if (tipoMovId) params.tipo_mov_id = tipoMovId;
    if (circuloId) params.circulo_id = circuloId;
    if (anio) params.anio = anio;
    if (mes) params.mes = mes;

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
}
