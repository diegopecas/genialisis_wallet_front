/**
 * MovimientosModalComponent
 * Modal reutilizable para mostrar lista de movimientos filtrados
 * ACTUALIZADO: Con búsqueda y separación de ingresos/gastos
 */

import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Movimiento } from "../../core/models/movimiento.model";

@Component({
  selector: "app-movimientos-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./movimientos-modal.component.html",
  styleUrls: ["./movimientos-modal.component.scss"],
})
export class MovimientosModalComponent implements OnChanges {
  @Input() movimientos: Movimiento[] = [];
  @Input() titulo: string = "Movimientos";
  @Input() subtitulo: string = "";
  @Input() isOpen: boolean = false;
  @Input() cuentaId: number | null = null; // NUEVO: ID de la cuenta actual

  @Output() close = new EventEmitter<void>();

  // NUEVO: Para búsqueda
  busqueda: string = "";

  // NUEVO: Movimientos filtrados por búsqueda
  movimientosFiltrados: Movimiento[] = [];

  // NUEVO: Agrupados por tipo
  ingresos: Movimiento[] = [];
  gastos: Movimiento[] = [];
  traslados: Movimiento[] = []; // NUEVO: Traslados

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["movimientos"] || changes["isOpen"]) {
      this.busqueda = ""; // Reset búsqueda al abrir
      this.aplicarFiltros();
    }
  }

  onClose(): void {
    this.busqueda = "";
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    // Cerrar solo si el clic es directamente en el overlay, no en el contenido
    if ((event.target as HTMLElement).classList.contains("modal-overlay")) {
      this.onClose();
    }
  }

  /**
   * Aplicar filtros de búsqueda y agrupar
   */
  aplicarFiltros(): void {
    // Filtrar por búsqueda
    if (this.busqueda.trim() === "") {
      this.movimientosFiltrados = [...this.movimientos];
    } else {
      const busquedaLower = this.busqueda.toLowerCase();
      this.movimientosFiltrados = this.movimientos.filter(
        (m) =>
          m.concepto_nombre.toLowerCase().includes(busquedaLower) ||
          m.categoria_nombre.toLowerCase().includes(busquedaLower) ||
          (m.detalle && m.detalle.toLowerCase().includes(busquedaLower)) ||
          (m.cuenta_origen_nombre && m.cuenta_origen_nombre.toLowerCase().includes(busquedaLower)) ||
          (m.cuenta_destino_nombre && m.cuenta_destino_nombre.toLowerCase().includes(busquedaLower))
      );
    }

    // Separar ingresos, gastos y traslados
    this.ingresos = this.movimientosFiltrados.filter(
      (m) => m.tipo_movimiento === "Ingreso"
    );
    this.gastos = this.movimientosFiltrados.filter(
      (m) => m.tipo_movimiento === "Gasto"
    );
    this.traslados = this.movimientosFiltrados.filter(
      (m) => m.tipo_movimiento === "Traslado"
    );
  }

  /**
   * Handler del input de búsqueda
   */
  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  /**
   * Limpiar búsqueda
   */
  limpiarBusqueda(): void {
    this.busqueda = "";
    this.aplicarFiltros();
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);
  }

  getTipoClase(tipo: string): string {
    return tipo === "Ingreso" ? "ingreso" : "gasto";
  }

  get totalIngresos(): number {
    return this.ingresos.reduce((sum, m) => sum + (+m.valor || 0), 0);
  }

  get totalGastos(): number {
    return this.gastos.reduce((sum, m) => sum + (+m.valor || 0), 0);
  }

  get totalTraslados(): number {
    return this.traslados.reduce((sum, m) => sum + (+m.valor || 0), 0);
  }

  /**
   * Determinar si un traslado es de ENTRADA para la cuenta actual
   * - Entrada: cuando la cuenta actual es cuenta_destino
   * - Salida: cuando la cuenta actual es cuenta_origen
   */
  esEntrada(movimiento: Movimiento): boolean {
    if (!this.cuentaId) return false;
    return movimiento.cuenta_destino_id === this.cuentaId;
  }
}