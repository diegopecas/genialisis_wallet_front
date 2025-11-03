/**
 * Modelo: Usuario
 */

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: Usuario;
    circulos: Circulo[];
    token: string;
  };
}

export interface Circulo {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  descripcion?: string;
  es_admin: boolean;
  created_at: string;
}
