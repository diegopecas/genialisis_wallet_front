/**
 * cuentas.component.ts
 * Componente para gestionar cuentas (listar, crear, editar, eliminar)
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuentasService } from '../../core/services/cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { Cuenta, CreateCuentaRequest } from '../../core/models/cuenta.model';

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas.component.html',
  styleUrls: ['./cuentas.component.scss']
})
export class CuentasComponent implements OnInit {
  cuentas: Cuenta[] = [];
  circuloId: number = 0;
  loading = false;
  
  // Modo edición/creación
  modoEdicion = false;
  cuentaEditando: Cuenta | null = null;
  
  // Formulario
  formData = {
    nombre: '',
    icono: '💳',
    color: '#4CAF50',
    descripcion: '',
    orden: 0
  };

  // Iconos disponibles
  iconosDisponibles = ['💵', '💳', '🏦', '💜', '📱', '💰', '🏧', '💸', '🪙'];

  constructor(
    private cuentasService: CuentasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const circulo = this.authService.getPrimerCirculo();
    if (circulo) {
      this.circuloId = circulo.id;
      this.cargarCuentas();
    }
  }

  cargarCuentas(): void {
    this.loading = true;
    this.cuentasService.getCuentas(this.circuloId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cuentas = response.data.cuentas;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando cuentas:', error);
        this.loading = false;
        alert('Error al cargar cuentas');
      }
    });
  }

  abrirFormularioNueva(): void {
    this.modoEdicion = true;
    this.cuentaEditando = null;
    this.formData = {
      nombre: '',
      icono: '💳',
      color: '#4CAF50',
      descripcion: '',
      orden: this.cuentas.length
    };
  }

  editarCuenta(cuenta: Cuenta): void {
    this.modoEdicion = true;
    this.cuentaEditando = cuenta;
    this.formData = {
      nombre: cuenta.nombre,
      icono: cuenta.icono,
      color: cuenta.color,
      descripcion: cuenta.descripcion || '',
      orden: cuenta.orden
    };
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.cuentaEditando = null;
    this.formData = {
      nombre: '',
      icono: '💳',
      color: '#4CAF50',
      descripcion: '',
      orden: 0
    };
  }

  guardarCuenta(): void {
    if (!this.formData.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (this.cuentaEditando) {
      // ACTUALIZAR
      this.cuentasService.update(this.cuentaEditando.id, this.formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarCuentas();
            this.cancelarEdicion();
            alert('Cuenta actualizada exitosamente');
          }
        },
        error: (error) => {
          console.error('Error actualizando cuenta:', error);
          alert('Error al actualizar cuenta');
        }
      });
    } else {
      // CREAR
      const data: CreateCuentaRequest = {
        circulo_id: this.circuloId,
        ...this.formData
      };

      this.cuentasService.create(data).subscribe({
        next: (response) => {
          if (response.success) {
            this.cargarCuentas();
            this.cancelarEdicion();
            alert('Cuenta creada exitosamente');
          }
        },
        error: (error) => {
          console.error('Error creando cuenta:', error);
          alert('Error al crear cuenta');
        }
      });
    }
  }

  eliminarCuenta(cuenta: Cuenta): void {
    if (!confirm(`¿Estás seguro de eliminar la cuenta "${cuenta.nombre}"?`)) {
      return;
    }

    this.cuentasService.delete(cuenta.id).subscribe({
      next: () => {
        this.cargarCuentas();
        alert('Cuenta eliminada exitosamente');
      },
      error: (error) => {
        console.error('Error eliminando cuenta:', error);
        alert('Error al eliminar cuenta. Puede que tenga movimientos asociados.');
      }
    });
  }

  seleccionarIcono(icono: string): void {
    this.formData.icono = icono;
  }

  formatearSaldo(saldo: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(saldo);
  }
}
