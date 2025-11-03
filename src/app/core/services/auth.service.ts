/**
 * AuthService
 * Manejo de autenticación, login y gestión de token JWT
 */

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ConceptosService } from './conceptos.service';
import { Usuario, LoginRequest, LoginResponse, Circulo } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'circle_finance_token';
  private readonly USER_KEY = 'circle_finance_user';
  private readonly CIRCULOS_KEY = 'circle_finance_circulos';

  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromStorage());
  private circulosSubject = new BehaviorSubject<Circulo[]>(this.getCirculosFromStorage());

  public currentUser$ = this.currentUserSubject.asObservable();
  public circulos$ = this.circulosSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private conceptosService: ConceptosService
  ) {}

  /**
   * Login de usuario
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('auth/login', credentials).pipe(
      tap(response => {
        if (response.success) {
          this.setSession(response.data);
        }
      })
    );
  }

  /**
   * Logout
   */
  logout(): void {
    // Limpiar cache de conceptos
    const circulos = this.getCirculos();
    circulos.forEach(circulo => {
      localStorage.removeItem(`conceptos_ingresos_${circulo.id}`);
      localStorage.removeItem(`conceptos_gastos_${circulo.id}`);
    });
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.CIRCULOS_KEY);
    this.currentUserSubject.next(null);
    this.circulosSubject.next([]);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtener token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener círculos del usuario
   */
  getCirculos(): Circulo[] {
    return this.circulosSubject.value;
  }

  /**
   * Obtener primer círculo (para fase 1 que solo usa 1 círculo)
   */
  getPrimerCirculo(): Circulo | null {
    const circulos = this.getCirculos();
    return circulos.length > 0 ? circulos[0] : null;
  }

  /**
   * Guardar sesión en localStorage
   */
  private setSession(data: { user: Usuario; circulos: Circulo[]; token: string }): void {
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(this.CIRCULOS_KEY, JSON.stringify(data.circulos));
    
    this.currentUserSubject.next(data.user);
    this.circulosSubject.next(data.circulos);
    
    // Cachear conceptos si hay círculos
    if (data.circulos && data.circulos.length > 0) {
      this.cacheConceptos(data.circulos[0].id);
    }
  }

  /**
   * Cachear conceptos de ingresos y gastos en localStorage
   */
  private cacheConceptos(circuloId: number): void {
    // Cachear conceptos de ingresos (tipo 1)
    this.conceptosService.getConceptosPorTipo(circuloId, 1).subscribe({
      next: (response) => {
        if (response.success) {
          localStorage.setItem(`conceptos_ingresos_${circuloId}`, JSON.stringify(response.data.categorias));
        }
      },
      error: (err) => console.error('Error cacheando conceptos de ingresos:', err)
    });
    
    // Cachear conceptos de gastos (tipo 2)
    this.conceptosService.getConceptosPorTipo(circuloId, 2).subscribe({
      next: (response) => {
        if (response.success) {
          localStorage.setItem(`conceptos_gastos_${circuloId}`, JSON.stringify(response.data.categorias));
        }
      },
      error: (err) => console.error('Error cacheando conceptos de gastos:', err)
    });
  }

  /**
   * Obtener usuario desde localStorage
   */
  private getUserFromStorage(): Usuario | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Obtener círculos desde localStorage
   */
  private getCirculosFromStorage(): Circulo[] {
    const circulosJson = localStorage.getItem(this.CIRCULOS_KEY);
    return circulosJson ? JSON.parse(circulosJson) : [];
  }
}
