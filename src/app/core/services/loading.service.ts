/**
 * LoadingService
 * Servicio para controlar el estado global de loading
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Mostrar loading
   */
  show(): void {
    this.requestCount++;
    this.loadingSubject.next(true);
  }

  /**
   * Ocultar loading
   */
  hide(): void {
    this.requestCount--;
    
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Obtener estado actual
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Resetear contador (útil en caso de errores)
   */
  reset(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }
}
