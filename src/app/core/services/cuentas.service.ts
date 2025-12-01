/**
 * cuentas.service.ts
 * Servicio para gestión de cuentas financieras
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Cuenta,
  CuentasResponse,
  CuentaResponse,
  SaldoCuentaResponse,
  ResumenSaldosResponse,
  CreateCuentaRequest,
  UpdateCuentaRequest
} from '../models/cuenta.model';

@Injectable({
  providedIn: 'root'
})
export class CuentasService {

  constructor(private apiService: ApiService) { }

  /**
   * Obtener cuentas por círculo
   * 
   * @param circuloId ID del círculo
   */
  getCuentas(circuloId: number): Observable<CuentasResponse> {
    return this.apiService.get<CuentasResponse>('cuentas', { circulo_id: circuloId });
  }

  /**
   * Obtener cuenta por ID
   * 
   * @param id ID de la cuenta
   */
  getById(id: number): Observable<CuentaResponse> {
    return this.apiService.get<CuentaResponse>(`cuentas/${id}`);
  }

  /**
   * Obtener saldo de una cuenta
   * 
   * @param id ID de la cuenta
   */
  getSaldo(id: number): Observable<SaldoCuentaResponse> {
    return this.apiService.get<SaldoCuentaResponse>(`cuentas/${id}/saldo`);
  }

  /**
   * Obtener resumen de saldos por círculo
   * 
   * @param circuloId ID del círculo
   */
  getResumen(circuloId: number): Observable<ResumenSaldosResponse> {
    return this.apiService.get<ResumenSaldosResponse>('cuentas/resumen', { circulo_id: circuloId });
  }

  /**
   * Crear cuenta nueva
   * 
   * @param data Datos de la cuenta
   */
  create(data: CreateCuentaRequest): Observable<CuentaResponse> {
    return this.apiService.post<CuentaResponse>('cuentas', data);
  }

  /**
   * Actualizar cuenta existente
   * 
   * @param id ID de la cuenta
   * @param data Datos a actualizar
   */
  update(id: number, data: UpdateCuentaRequest): Observable<CuentaResponse> {
    return this.apiService.put<CuentaResponse>(`cuentas/${id}`, data);
  }

  /**
   * Eliminar cuenta (soft delete)
   * 
   * @param id ID de la cuenta
   */
  delete(id: number): Observable<any> {
    return this.apiService.delete(`cuentas/${id}`);
  }
}
