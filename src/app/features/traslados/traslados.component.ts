/**
 * TrasladosComponent - VERSIÓN MEJORADA
 * Traslados entre cuentas con UI visual y concepto automático
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ConceptosService } from '../../core/services/conceptos.service';
import { MovimientosService } from '../../core/services/movimientos.service';
import { CuentasService } from '../../core/services/cuentas.service';
import { PeriodoService } from '../../core/services/periodo.service';
import { Concepto } from '../../core/models/concepto.model';
import { Cuenta } from '../../core/models/cuenta.model';
import { EditarMovimientoModalComponent } from '../editar-movimiento-modal/editar-movimiento-modal.component';

@Component({
  selector: 'app-traslados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EditarMovimientoModalComponent],
  templateUrl: './traslados.component.html',
  styleUrls: ['./traslados.component.scss']
})
export class TrasladosComponent implements OnInit {
  trasladoForm: FormGroup;
  conceptoTraslado: Concepto | null = null; // Concepto automático
  cuentas: Cuenta[] = [];
  loading = false;
  circuloId: number = 0;
  traslados: any[] = [];
  trasladosFiltrados: any[] = [];
  searchMovimientos: string = '';
  valorFormateado: string = '';
  
  // Variables para paginación
  limitePorPagina: number = 10;
  totalRegistrosCargados: number = 0;
  hayMasRegistros: boolean = true;

  // Variables para modal de edición
  movimientoAEditar: any = null;
  isModalEditarOpen: boolean = false;

  // Periodo seleccionado
  anio: number = 0;
  mes: number = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private conceptosService: ConceptosService,
    private movimientosService: MovimientosService,
    private cuentasService: CuentasService,
    private periodoService: PeriodoService
  ) {
    const circulo = this.authService.getPrimerCirculo();
    this.circuloId = circulo?.id || 0;

    // Formulario SIN concepto_id (se asigna automáticamente)
    this.trasladoForm = this.fb.group({
      valor: ['', [Validators.required, Validators.min(1)]],
      cuenta_origen_id: ['', Validators.required],
      cuenta_destino_id: ['', Validators.required],
      notas: [''],
      fecha: [this.obtenerFechaLocal(), Validators.required]
    });
  }

  private obtenerFechaLocal(): string {
    const now = new Date();
    const colombiaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));

    const year = colombiaTime.getFullYear();
    const month = String(colombiaTime.getMonth() + 1).padStart(2, '0');
    const day = String(colombiaTime.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.cargarConceptoTraslado();
    this.cargarCuentas();
    
    this.periodoService.periodo$.subscribe(periodo => {
      if (periodo.anio !== 0 && periodo.mes !== 0) {
        this.anio = periodo.anio;
        this.mes = periodo.mes;
        
        this.limitePorPagina = 10;
        this.hayMasRegistros = true;
        this.cargarTraslados();
      }
    });
  }

  /**
   * Cargar el concepto de TRASLADO automáticamente
   * Solo carga el primero que encuentre de tipo 3
   */
  cargarConceptoTraslado(): void {
    console.log('🔍 Buscando conceptos de tipo TRASLADO (tipo_mov_id=3)...');
    
    this.conceptosService.getConceptos(this.circuloId, 3).subscribe({
      next: (response) => {
        console.log('📥 Respuesta de conceptos:', response);
        
        if (response.success && response.data.categorias.length > 0) {
          // Buscar en TODAS las categorías el primer concepto con tipo_mov_id = 3
          let conceptoEncontrado: Concepto | null = null;
          
          for (const categoria of response.data.categorias) {
            if (categoria.conceptos && categoria.conceptos.length > 0) {
              // Filtrar conceptos de tipo TRASLADO (tipo_mov_id = 3)
              const conceptosTraslado = categoria.conceptos.filter(c => c.tipo_mov_id === 3);
              
              if (conceptosTraslado.length > 0) {
                conceptoEncontrado = conceptosTraslado[0];
                console.log('✅ Concepto de traslado encontrado:', conceptoEncontrado);
                break;
              }
            }
          }
          
          if (conceptoEncontrado) {
            this.conceptoTraslado = conceptoEncontrado;
          } else {
            console.error('❌ No se encontró ningún concepto con tipo_mov_id = 3');
            alert('No se encontró ningún concepto de tipo "Traslado". Por favor crea uno en la base de datos.');
          }
        } else {
          console.error('❌ No hay categorías en la respuesta');
          alert('No se encontraron conceptos.');
        }
      },
      error: (error) => {
        console.error('❌ Error cargando conceptos:', error);
      }
    });
  }

  cargarCuentas(): void {
    this.cuentasService.getCuentas(this.circuloId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cuentas = Array.isArray(response.data) ? response.data : response.data.cuentas || [];
        }
      },
      error: (error) => {
        console.error('Error cargando cuentas:', error);
      }
    });
  }

  cargarTraslados(): void {
    this.loading = true;
    
    this.movimientosService.getMovimientos(3, this.circuloId, this.anio, this.mes, this.limitePorPagina).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.traslados = response.data.movimientos;
          this.trasladosFiltrados = [...this.traslados];
          this.totalRegistrosCargados = this.traslados.length;
          
          this.hayMasRegistros = this.traslados.length >= this.limitePorPagina;
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando traslados:', error);
        this.loading = false;
      }
    });
  }

  cargarTodosDelPeriodo(): void {
    this.loading = true;
    
    this.movimientosService.getMovimientos(3, this.circuloId, this.anio, this.mes, 0).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.traslados = response.data.movimientos;
          this.trasladosFiltrados = [...this.traslados];
          this.totalRegistrosCargados = this.traslados.length;
          this.hayMasRegistros = false;
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando traslados:', error);
        this.loading = false;
      }
    });
  }

  buscarMovimientos(event: any): void {
    this.searchMovimientos = event.target.value.toLowerCase();

    if (this.searchMovimientos.trim() === '') {
      this.trasladosFiltrados = [...this.traslados];
    } else {
      this.trasladosFiltrados = this.traslados.filter(traslado =>
        (traslado.cuenta_origen_nombre && traslado.cuenta_origen_nombre.toLowerCase().includes(this.searchMovimientos)) ||
        (traslado.cuenta_destino_nombre && traslado.cuenta_destino_nombre.toLowerCase().includes(this.searchMovimientos)) ||
        (traslado.notas && traslado.notas.toLowerCase().includes(this.searchMovimientos))
      );
    }
  }

  onSubmit(): void {
    // Validación 1: Formulario válido
    if (!this.trasladoForm.valid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Validación 2: Concepto existe
    if (!this.conceptoTraslado) {
      alert('No se pudo cargar el concepto de traslado. Verifica que existe un concepto de tipo "Traslado" en la base de datos.');
      return;
    }

    // Validación 3: Cuentas diferentes
    const cuentaOrigenId = this.trasladoForm.get('cuenta_origen_id')?.value;
    const cuentaDestinoId = this.trasladoForm.get('cuenta_destino_id')?.value;

    if (cuentaOrigenId === cuentaDestinoId) {
      alert('Las cuentas de origen y destino deben ser diferentes');
      return;
    }

    this.loading = true;

    const formData = {
      ...this.trasladoForm.value,
      concepto_id: this.conceptoTraslado.id,
      circulos_ids: [this.circuloId]
    };

    // LOG para debug
    console.log('📤 Enviando traslado:', formData);
    console.log('📝 Concepto usado:', this.conceptoTraslado);

    this.movimientosService.create(formData).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta exitosa:', response);
        if (response.success) {
          this.trasladoForm.reset({
            fecha: this.obtenerFechaLocal()
          });
          this.limpiarValorFormateado();
          
          this.limitePorPagina = 10;
          this.hayMasRegistros = true;
          this.cargarTraslados();
          this.cargarCuentas();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ ERROR COMPLETO:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        
        let mensajeError = 'Error al crear traslado.';
        
        if (error.error && error.error.message) {
          mensajeError += '\n\n' + error.error.message;
        }
        
        if (error.error && error.error.errors) {
          mensajeError += '\n\nDetalles:\n';
          Object.keys(error.error.errors).forEach(key => {
            mensajeError += `- ${key}: ${error.error.errors[key]}\n`;
          });
        }
        
        alert(mensajeError);
        this.loading = false;
      }
    });
  }

  eliminarTraslado(id: number): void {
    if (confirm('¿Estás seguro de eliminar este traslado?')) {
      this.movimientosService.delete(id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cargarTraslados();
            this.cargarCuentas();
          }
        },
        error: (error: any) => console.error('Error eliminando traslado:', error)
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

  validarTeclaNumero(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if ([46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
        (charCode === 65 && event.ctrlKey === true) ||
        (charCode === 67 && event.ctrlKey === true) ||
        (charCode === 86 && event.ctrlKey === true) ||
        (charCode === 88 && event.ctrlKey === true)) {
      return true;
    }
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  formatearValorInput(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor === '') {
      this.valorFormateado = '';
      this.trasladoForm.patchValue({ valor: '' });
      return;
    }

    this.valorFormateado = Number(valor).toLocaleString('es-CO');
    this.trasladoForm.patchValue({ valor: Number(valor) }, { emitEvent: false });
  }

  limpiarValorFormateado(): void {
    this.valorFormateado = '';
  }

  abrirModalEditar(traslado: any): void {
    this.movimientoAEditar = { ...traslado };
    this.isModalEditarOpen = true;
  }

  cerrarModalEditar(): void {
    this.isModalEditarOpen = false;
    this.movimientoAEditar = null;
  }

  guardarCambios(formData: any): void {
    if (!this.movimientoAEditar) return;

    this.loading = true;

    this.movimientosService.update(this.movimientoAEditar.id, formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.cerrarModalEditar();
          
          this.limitePorPagina = 10;
          this.hayMasRegistros = true;
          this.cargarTraslados();
          this.cargarCuentas();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error actualizando traslado:', error);
        this.loading = false;
      }
    });
  }

  getCuenta(cuentaId: number): Cuenta | undefined {
    return this.cuentas.find(c => c.id === cuentaId);
  }
}