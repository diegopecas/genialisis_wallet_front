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
import { EditarMovimientoModalComponent } from '../editar-movimiento-modal/editar-movimiento-modal.component';
@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EditarMovimientoModalComponent],
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
  ingresosFiltrados: any[] = [];
  searchMovimientos: string = '';
  valorFormateado: string = '';
  
  // Variables para paginación
  limitePorPagina: number = 10;
  totalRegistrosCargados: number = 0;
  hayMasRegistros: boolean = true;

  // Variables para modal de edición
  movimientoAEditar: any = null;
  isModalEditarOpen: boolean = false;

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
    this.loading = true;
    
    this.movimientosService.getMovimientos(1, this.circuloId, undefined, undefined, this.limitePorPagina).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.ingresos = response.data.movimientos;
          this.ingresosFiltrados = [...this.ingresos];
          this.totalRegistrosCargados = this.ingresos.length;
          
          // LÓGICA CORREGIDA: Si trajo menos registros que el límite solicitado, no hay más
          this.hayMasRegistros = this.ingresos.length >= this.limitePorPagina;
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando ingresos:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Cargar más registros (incrementa el límite en 10)
   */
  cargarMasIngresos(): void {
    this.limitePorPagina += 10;
    this.cargarIngresos();
  }

  /**
   * Buscar/filtrar movimientos por concepto, categoría o detalle
   */
  buscarMovimientos(event: any): void {
    this.searchMovimientos = event.target.value.toLowerCase();

    if (this.searchMovimientos.trim() === '') {
      this.ingresosFiltrados = [...this.ingresos];
    } else {
      this.ingresosFiltrados = this.ingresos.filter(ingreso =>
        ingreso.concepto_nombre.toLowerCase().includes(this.searchMovimientos) ||
        ingreso.categoria_nombre.toLowerCase().includes(this.searchMovimientos) ||
        (ingreso.detalle && ingreso.detalle.toLowerCase().includes(this.searchMovimientos))
      );
    }
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

    // El detalle SIEMPRE es opcional - remover cualquier validador
    const detalleControl = this.ingresoForm.get('detalle');
    if (detalleControl) {
      detalleControl.clearValidators();
      detalleControl.setErrors(null);
      detalleControl.updateValueAndValidity();
    }
  }

  limpiarSeleccion(): void {
    this.conceptoSeleccionado = null;
    this.categoriaSeleccionada = '';
    this.searchTerm = '';
    this.conceptosFiltrados = [...this.todosLosConceptos];
    this.ingresoForm.patchValue({ concepto_id: '' });
    
    // Asegurar que detalle no tenga validadores
    const detalleControl = this.ingresoForm.get('detalle');
    if (detalleControl) {
      detalleControl.clearValidators();
      detalleControl.setErrors(null);
      detalleControl.updateValueAndValidity();
    }
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
              fecha: this.obtenerFechaLocal()
            });
            this.limpiarSeleccion();
            this.limpiarValorFormateado();
            
            // Resetear paginación al crear nuevo registro
            this.limitePorPagina = 10;
            this.hayMasRegistros = true;
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

  /**
   * Bloquear teclas no numéricas
   */
  validarTeclaNumero(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Permitir: backspace, delete, tab, escape, enter, punto decimal
    if ([46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
        // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (charCode === 65 && event.ctrlKey === true) ||
        (charCode === 67 && event.ctrlKey === true) ||
        (charCode === 86 && event.ctrlKey === true) ||
        (charCode === 88 && event.ctrlKey === true)) {
      return true;
    }
    // Asegurar que es un número
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Formatear valor del input - SOLO ACEPTA NÚMEROS
   */
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

  /**
   * Abrir modal de edición
   */
  abrirModalEditar(ingreso: any): void {
    this.movimientoAEditar = { ...ingreso };
    this.isModalEditarOpen = true;
  }

  /**
   * Cerrar modal de edición
   */
  cerrarModalEditar(): void {
    this.isModalEditarOpen = false;
    this.movimientoAEditar = null;
  }

  /**
   * Guardar cambios del movimiento editado
   */
  guardarCambios(formData: any): void {
    if (!this.movimientoAEditar) return;

    this.loading = true;

    this.movimientosService.update(this.movimientoAEditar.id, formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.cerrarModalEditar();
          
          // Resetear paginación
          this.limitePorPagina = 10;
          this.hayMasRegistros = true;
          this.cargarIngresos();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error actualizando ingreso:', error);
        this.loading = false;
      }
    });
  }
}