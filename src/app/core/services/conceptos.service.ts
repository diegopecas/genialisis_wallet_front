/**
 * ConceptosService - ACTUALIZADO para soportar Traslados
 * Servicio para obtener conceptos y categorías
 */

import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
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
   * @param tipoMovId Tipo de movimiento (1=Ingreso, 2=Gasto, 3=Traslado)
   */
  getConceptos(circuloId: number, tipoMovId: number): Observable<ConceptosResponse> {
    // Generar clave de cache según tipo
    let cacheKey: string;
    if (tipoMovId === 1) {
      cacheKey = `conceptos_ingresos_${circuloId}`;
    } else if (tipoMovId === 2) {
      cacheKey = `conceptos_gastos_${circuloId}`;
    } else if (tipoMovId === 3) {
      cacheKey = `conceptos_traslados_${circuloId}`;
    } else {
      cacheKey = `conceptos_${tipoMovId}_${circuloId}`;
    }
    
    // Intentar obtener desde cache primero
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
    
    // Si no hay cache, llamar al backend y guardar en cache
    return this.apiService.get<ConceptosResponse>('conceptos', {
      circulo_id: circuloId,
      tipo_mov_id: tipoMovId
    }).pipe(
      tap((response) => {
        if (response.success && response.data.categorias) {
          // Guardar en cache
          localStorage.setItem(cacheKey, JSON.stringify(response.data.categorias));
        }
      })
    );
  }

  /**
   * Limpiar cache de conceptos
   * Útil cuando se crean/actualizan conceptos
   */
  clearCache(circuloId?: number) {
    if (circuloId) {
      localStorage.removeItem(`conceptos_ingresos_${circuloId}`);
      localStorage.removeItem(`conceptos_gastos_${circuloId}`);
      localStorage.removeItem(`conceptos_traslados_${circuloId}`);
    } else {
      // Limpiar todos los conceptos
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('conceptos_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * Alias para compatibilidad
   */
  getConceptosPorTipo(circuloId: number, tipoMovId: number): Observable<ConceptosResponse> {
    return this.getConceptos(circuloId, tipoMovId);
  }
}