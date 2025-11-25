/**
 * MovimientosModalComponent
 * Modal reutilizable para mostrar lista de movimientos filtrados
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movimiento } from '../../core/models/movimiento.model';

@Component({
  selector: 'app-movimientos-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movimientos-modal.component.html',
  styleUrls: ['./movimientos-modal.component.scss']
})
export class MovimientosModalComponent {
  
  @Input() movimientos: Movimiento[] = [];
  @Input() titulo: string = 'Movimientos';
  @Input() subtitulo: string = '';
  @Input() isOpen: boolean = false;
  
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    // Cerrar solo si el clic es directamente en el overlay, no en el contenido
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  getTipoClase(tipo: string): string {
    return tipo === 'Ingreso' ? 'ingreso' : 'gasto';
  }
}
