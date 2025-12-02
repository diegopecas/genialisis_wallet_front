/**
 * EditarMovimientoModalComponent
 * Modal para editar movimientos existentes
 */

import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ConceptosService } from '../../core/services/conceptos.service';
import { Categoria, Concepto } from '../../core/models/concepto.model';

@Component({
  selector: 'app-editar-movimiento-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './editar-movimiento-modal.component.html',
  styleUrls: ['./editar-movimiento-modal.component.scss']
})
export class EditarMovimientoModalComponent implements OnChanges {
  
  @Input() movimiento: any = null;
  @Input() isOpen: boolean = false;
  @Input() circuloId: number = 0;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  editarForm: FormGroup;
  categorias: Categoria[] = [];
  conceptosFiltrados: { categoria: string; concepto: Concepto }[] = [];
  todosLosConceptos: { categoria: string; concepto: Concepto }[] = [];
  conceptoSeleccionado: Concepto | null = null;
  categoriaSeleccionada: string = '';
  searchTerm: string = '';
  loading = false;
  valorFormateado: string = '';

  constructor(
    private fb: FormBuilder,
    private conceptosService: ConceptosService
  ) {
    this.editarForm = this.fb.group({
      concepto_id: ['', Validators.required],
      valor: ['', [Validators.required, Validators.min(1)]],
      fecha: ['', Validators.required],
      detalle: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['movimiento'] && this.movimiento) {
      this.cargarDatosMovimiento();
    }

    if (changes['isOpen'] && this.isOpen) {
      // Cargar conceptos del tipo de movimiento
      if (this.movimiento) {
        this.cargarConceptos(this.movimiento.tipo_mov_id);
      }
    }
  }

  cargarDatosMovimiento(): void {
    if (!this.movimiento) return;

    // NUEVO: Los traslados usan 'notas', otros movimientos usan 'detalle'
    const detalleONotas = this.movimiento.notas || this.movimiento.detalle || '';

    // Precargar datos del formulario
    this.editarForm.patchValue({
      concepto_id: this.movimiento.concepto_id,
      valor: this.movimiento.valor,
      fecha: this.movimiento.fecha,
      detalle: detalleONotas
    });

    // Formatear valor
    this.valorFormateado = Number(this.movimiento.valor).toLocaleString('es-CO');

    // Preseleccionar concepto
    this.conceptoSeleccionado = {
      id: this.movimiento.concepto_id,
      nombre: this.movimiento.concepto_nombre,
      icono: this.movimiento.concepto_icono,
      requiere_detalle: this.movimiento.concepto_requiere_detalle || false,
      es_real: this.movimiento.concepto_es_real || true
    } as Concepto;

    this.categoriaSeleccionada = this.movimiento.categoria_nombre;

    // Asegurar que detalle sea opcional
    const detalleControl = this.editarForm.get('detalle');
    if (detalleControl) {
      detalleControl.clearValidators();
      detalleControl.setErrors(null);
      detalleControl.updateValueAndValidity();
    }
  }

  cargarConceptos(tipoMovId: number): void {
    this.loading = true;
    this.conceptosService.getConceptos(this.circuloId, tipoMovId).subscribe({
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
    this.editarForm.patchValue({ concepto_id: item.concepto.id });

    // GARANTIZAR que detalle sea opcional
    const detalleControl = this.editarForm.get('detalle');
    if (detalleControl) {
      detalleControl.clearValidators();
      detalleControl.setErrors(null);
      detalleControl.markAsUntouched();
      detalleControl.updateValueAndValidity();
    }
    
    this.editarForm.updateValueAndValidity();
  }

  limpiarSeleccion(): void {
    this.conceptoSeleccionado = null;
    this.categoriaSeleccionada = '';
    this.searchTerm = '';
    this.conceptosFiltrados = [...this.todosLosConceptos];
    this.editarForm.patchValue({ concepto_id: '' });
    
    const detalleControl = this.editarForm.get('detalle');
    if (detalleControl) {
      detalleControl.clearValidators();
      detalleControl.setErrors(null);
      detalleControl.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.editarForm.valid) {
      const formData = {
        ...this.editarForm.value,
        circulos_ids: [this.circuloId]
      };

      // NUEVO: Si es un traslado, cambiar 'detalle' por 'notas'
      if (this.movimiento && this.movimiento.tipo_movimiento === 'Traslado') {
        formData.notas = formData.detalle;
        delete formData.detalle;
      }

      this.save.emit(formData);
    }
  }

  onClose(): void {
    this.searchTerm = '';
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
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
      this.editarForm.patchValue({ valor: '' });
      return;
    }

    this.valorFormateado = Number(valor).toLocaleString('es-CO');
    this.editarForm.patchValue({ valor: Number(valor) }, { emitEvent: false });
  }
}