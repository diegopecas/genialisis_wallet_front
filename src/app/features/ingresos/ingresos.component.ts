/**
 * IngresosComponent
 * Registro de ingresos con UI optimizada para móvil
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ConceptosService } from '../../core/services/conceptos.service';
import { MovimientosService } from '../../core/services/movimientos.service';
import { Categoria, Concepto } from '../../core/models/concepto.model';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.scss']
})
export class IngresosComponent implements OnInit {
  ingresoForm: FormGroup;
  categorias: Categoria[] = [];
  conceptosFiltrados: { categoria: string; concepto: Concepto }[] = [];
  todosLosConceptos: { categoria: string; concepto: Concepto }[] = [];
  conceptoSeleccionado: Concepto | null = null;
  categoriaSeleccionada: string = '';
  searchTerm: string = '';
  loading = false;
  circuloId: number = 0;
  ingresos: any[] = [];
  valorFormateado: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private conceptosService: ConceptosService,
    private movimientosService: MovimientosService
  ) {
    const circulo = this.authService.getPrimerCirculo();
    this.circuloId = circulo?.id || 0;

    this.ingresoForm = this.fb.group({
      valor: ['', [Validators.required, Validators.min(1)]],
      detalle: [''],
      concepto_id: ['', Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarConceptos();
    this.cargarIngresos();
  }

  cargarConceptos(): void {
    this.loading = true;
    this.conceptosService.getConceptos(this.circuloId, 1).subscribe({
      next: (response) => {
        if (response.success) {
          this.categorias = response.data.categorias;

          // Crear lista plana de conceptos con categoría
          this.todosLosConceptos = [];
          this.categorias.forEach(cat => {
            cat.conceptos.forEach(concepto => {
              this.todosLosConceptos.push({
                categoria: cat.nombre,
                concepto: concepto
              });
            });
          });

          this.conceptosFiltrados = [...this.todosLosConceptos];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando conceptos:', error);
        this.loading = false;
      }
    });
  }

  cargarIngresos(): void {
    this.movimientosService.getMovimientos(1, this.circuloId, undefined, undefined, 10).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.ingresos = response.data.movimientos;
        }
      },
      error: (error: any) => console.error('Error cargando ingresos:', error)
    });
  }

  buscarConceptos(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();

    if (this.searchTerm.trim() === '') {
      this.conceptosFiltrados = [...this.todosLosConceptos];
    } else {
      this.conceptosFiltrados = this.todosLosConceptos.filter(item =>
        item.concepto.nombre.toLowerCase().includes(this.searchTerm) ||
        item.categoria.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  seleccionarConcepto(item: { categoria: string; concepto: Concepto }): void {
    this.conceptoSeleccionado = item.concepto;
    this.categoriaSeleccionada = item.categoria;
    this.ingresoForm.patchValue({ concepto_id: item.concepto.id });

    // El detalle siempre será opcional
    this.ingresoForm.get('detalle')?.clearValidators();
    this.ingresoForm.get('detalle')?.updateValueAndValidity();
  }

  limpiarSeleccion(): void {
    this.conceptoSeleccionado = null;
    this.categoriaSeleccionada = '';
    this.searchTerm = '';
    this.conceptosFiltrados = [...this.todosLosConceptos];
    this.ingresoForm.patchValue({ concepto_id: '' });
    this.ingresoForm.get('detalle')?.clearValidators();
    this.ingresoForm.get('detalle')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.ingresoForm.valid) {
      this.loading = true;

      const formData = {
        ...this.ingresoForm.value,
        circulos_ids: [this.circuloId]
      };

      this.movimientosService.create(formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.ingresoForm.reset({
              fecha: new Date().toISOString().split('T')[0]
            });
            this.limpiarSeleccion();
            this.limpiarValorFormateado();
            this.cargarIngresos();
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error creando ingreso:', error);
          this.loading = false;
        }
      });
    }
  }

  eliminarIngreso(id: number): void {
    if (confirm('¿Estás seguro de eliminar este ingreso?')) {
      this.movimientosService.delete(id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cargarIngresos();
          }
        },
        error: (error: any) => console.error('Error eliminando ingreso:', error)
      });
    }
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  get requiereDetalle(): boolean {
    return this.conceptoSeleccionado?.requiere_detalle || false;
  }

  formatearValorInput(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Solo dígitos
    
    if (valor === '') {
      this.valorFormateado = '';
      this.ingresoForm.patchValue({ valor: '' });
      return;
    }

    // Formatear con separador de miles
    this.valorFormateado = Number(valor).toLocaleString('es-CO');
    
    // Actualizar el valor real en el formulario (sin formato)
    this.ingresoForm.patchValue({ valor: Number(valor) }, { emitEvent: false });
  }

  limpiarValorFormateado(): void {
    this.valorFormateado = '';
  }
}