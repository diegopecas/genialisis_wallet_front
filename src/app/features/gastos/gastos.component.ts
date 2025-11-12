/**
 * GastosComponent
 * Registro de gastos con UI optimizada para móvil
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ConceptosService } from '../../core/services/conceptos.service';
import { MovimientosService } from '../../core/services/movimientos.service';
import { Categoria, Concepto } from '../../core/models/concepto.model';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.scss']
})
export class GastosComponent implements OnInit {
  gastoForm: FormGroup;
  categorias: Categoria[] = [];
  conceptosFiltrados: { categoria: string; concepto: Concepto }[] = [];
  todosLosConceptos: { categoria: string; concepto: Concepto }[] = [];
  conceptoSeleccionado: Concepto | null = null;
  categoriaSeleccionada: string = '';
  searchTerm: string = '';
  loading = false;
  circuloId: number = 0;
  gastos: any[] = [];
  valorFormateado: string = '';
  
  // Variables para paginación
  limitePorPagina: number = 10;
  totalRegistrosCargados: number = 0;
  hayMasRegistros: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private conceptosService: ConceptosService,
    private movimientosService: MovimientosService
  ) {
    const circulo = this.authService.getPrimerCirculo();
    this.circuloId = circulo?.id || 0;

    this.gastoForm = this.fb.group({
      valor: ['', [Validators.required, Validators.min(1)]],
      detalle: [''],
      concepto_id: ['', Validators.required],
      fecha: [this.obtenerFechaLocal(), Validators.required]
    });
  }

  /**
   * Obtiene la fecha actual en zona horaria de Colombia
   * Usa el timezone correcto para evitar problemas de adelanto de fecha
   */
  private obtenerFechaLocal(): string {
    const now = new Date();
    // Crear fecha en zona horaria de Colombia (America/Bogota)
    const colombiaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));

    const year = colombiaTime.getFullYear();
    const month = String(colombiaTime.getMonth() + 1).padStart(2, '0');
    const day = String(colombiaTime.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.cargarConceptos();
    this.cargarGastos();
  }

  cargarConceptos(): void {
    this.loading = true;
    this.conceptosService.getConceptos(this.circuloId, 2).subscribe({
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

  cargarGastos(): void {
    this.movimientosService.getMovimientos(2, this.circuloId, undefined, undefined, this.limitePorPagina).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.gastos = response.data.movimientos;
          this.totalRegistrosCargados = this.gastos.length;
          
          // Si trajo menos registros que el límite, no hay más
          this.hayMasRegistros = this.gastos.length === this.limitePorPagina;
        }
      },
      error: (error: any) => console.error('Error cargando gastos:', error)
    });
  }

  /**
   * Cargar más registros (incrementa el límite en 10)
   */
  cargarMasGastos(): void {
    this.limitePorPagina += 10;
    this.cargarGastos();
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
    this.gastoForm.patchValue({ concepto_id: item.concepto.id });

    // El detalle SIEMPRE es opcional
    this.gastoForm.get('detalle')?.clearValidators();
    this.gastoForm.get('detalle')?.updateValueAndValidity();
  }

  limpiarSeleccion(): void {
    this.conceptoSeleccionado = null;
    this.categoriaSeleccionada = '';
    this.searchTerm = '';
    this.conceptosFiltrados = [...this.todosLosConceptos];
    this.gastoForm.patchValue({ concepto_id: '' });
    this.gastoForm.get('detalle')?.clearValidators();
    this.gastoForm.get('detalle')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.gastoForm.valid) {
      this.loading = true;

      const formData = {
        ...this.gastoForm.value,
        circulos_ids: [this.circuloId]
      };

      this.movimientosService.create(formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.gastoForm.reset({
              fecha: this.obtenerFechaLocal()
            });
            this.limpiarSeleccion();
            this.limpiarValorFormateado();
            
            // Resetear paginación al crear nuevo registro
            this.limitePorPagina = 10;
            this.cargarGastos();
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error creando gasto:', error);
          this.loading = false;
        }
      });
    }
  }

  eliminarGasto(id: number): void {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      this.movimientosService.delete(id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cargarGastos();
          }
        },
        error: (error: any) => console.error('Error eliminando gasto:', error)
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

  /**
   * Formatear valor del input - SOLO ACEPTA NÚMEROS
   */
  formatearValorInput(event: any): void {
    let valor = event.target.value.replace(/\D/g, ''); // Solo dígitos
    
    if (valor === '') {
      this.valorFormateado = '';
      this.gastoForm.patchValue({ valor: '' });
      return;
    }

    // Formatear con separador de miles
    this.valorFormateado = Number(valor).toLocaleString('es-CO');
    
    // Actualizar el valor real en el formulario (sin formato)
    this.gastoForm.patchValue({ valor: Number(valor) }, { emitEvent: false });
  }

  limpiarValorFormateado(): void {
    this.valorFormateado = '';
  }
}