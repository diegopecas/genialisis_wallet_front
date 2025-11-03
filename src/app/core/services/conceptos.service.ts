/**
 * ConceptosService
 * Servicio para obtener conceptos y categorías
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ConceptosResponse } from '../models/concepto.model';

@Injectable({
  providedIn: 'root'
})
export class ConceptosService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtener conceptos agrupados por categoría (con cache)
   * 
   * @param circuloId ID del círculo
   * @param tipoMovId Tipo de movimiento (1=Ingreso, 2=Gasto)
   */
  getConceptos(circuloId: number, tipoMovId: number): Observable<ConceptosResponse> {
    // Intentar obtener desde cache primero
    const cacheKey = tipoMovId === 1 ? `conceptos_ingresos_${circuloId}` : `conceptos_gastos_${circuloId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      // Retornar datos desde cache
      return new Observable(observer => {
        observer.next({
          success: true,
          data: { categorias: JSON.parse(cached) },
          message: 'Conceptos desde cache'
        });
        observer.complete();
      });
    }
    
    // Si no hay cache, llamar al backend
    return this.apiService.get<ConceptosResponse>('conceptos', {
      circulo_id: circuloId,
      tipo_mov_id: tipoMovId
    });
  }

  /**
   * Alias para compatibilidad
   */
  getConceptosPorTipo(circuloId: number, tipoMovId: number): Observable<ConceptosResponse> {
    return this.getConceptos(circuloId, tipoMovId);
  }
}
