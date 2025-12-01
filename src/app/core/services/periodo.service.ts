/**
 * PeriodoService
 * Servicio compartido para comunicar año y mes seleccionado entre componentes
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PeriodoSeleccionado {
  anio: number;
  mes: number;
}

@Injectable({
  providedIn: 'root'
})
export class PeriodoService {
  private periodoSubject = new BehaviorSubject<PeriodoSeleccionado>({ anio: 0, mes: 0 });
  public periodo$: Observable<PeriodoSeleccionado> = this.periodoSubject.asObservable();

  /**
   * Establecer el periodo actual
   */
  setPeriodo(anio: number, mes: number): void {
    this.periodoSubject.next({ anio, mes });
  }

  /**
   * Obtener el periodo actual
   */
  getPeriodo(): PeriodoSeleccionado {
    return this.periodoSubject.value;
  }
}