/**
 * AuthInterceptor
 * Interceptor HTTP para agregar el token JWT a todas las peticiones
 * VERSION CON LOGS PARA DEBUG
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si existe token, agregar header Authorization
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.warn('⚠️ NO HAY TOKEN - Request sin autenticación');
  }

  return next(req);
};