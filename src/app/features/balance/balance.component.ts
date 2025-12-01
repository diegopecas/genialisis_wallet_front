/**
 * BalanceComponent
 * Balance con saldo anterior acumulado correctamente
 * NUEVA FUNCIONALIDAD: Mostrar movimientos en modal al hacer clic
 * ACTUALIZADO: Usa selectores globales del header vía PeriodoService
 */

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { MovimientosService } from '../../core/services/movimientos.service';
import { PeriodoService } from '../../core/services/periodo.service';
import { MovimientosModalComponent } from '../movimientos-modal/movimientos-modal.component';
import {
  Balance,
  DetalleConcepto,
  EvolucionMes,
  TotalPorDia,
  TotalPorCategoria,
  GraficoCategoria,
  SaldoAnterior,
  Movimiento
} from '../../core/models/movimiento.model';

Chart.register(...registerables);

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, MovimientosModalComponent],
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss']
})
export class BalanceComponent implements OnInit, AfterViewInit {

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBarrasCanvas') chartBarrasCanvas!: ElementRef<HTMLCanvasElement>;

  balance: Balance = { 
    total_ingresos: 0, 
    total_gastos: 0, 
    balance_neto: 0,
    saldo_anterior: 0,
    saldo_final: 0
  };
  saldoAnteriorData: SaldoAnterior | null = null;
  detalleIngresos: DetalleConcepto[] = [];
  detalleGastos: DetalleConcepto[] = [];
  totalesPorDia: TotalPorDia[] = [];
  categoriaIngresos: TotalPorCategoria[] = [];
  categoriaGastos: TotalPorCategoria[] = [];
  
  // Array de movimientos del período
  movimientosPeriodo: Movimiento[] = [];
  
  // Control del modal
  modalMovimientos: Movimiento[] = [];
  modalTitulo: string = '';
  modalSubtitulo: string = '';
  isModalOpen: boolean = false;
  
  // Control de acordeón de secciones
  expandirResumen: boolean = true;
  expandirTotalesDia: boolean = false;
  expandirCategoria: boolean = false;
  expandirDetalle: boolean = false;
  expandirGraficoEvolucion: boolean = false;
  expandirGraficoCategoria: boolean = false;
  
  loading = false;
  circuloId: number = 0;
  chart: Chart | null = null;
  chartBarras: Chart | null = null;
  datosGraficoCategoria: GraficoCategoria[] = [];
  datosEvolucion: EvolucionMes[] = [];
  periodoTextoCalculado: string = '';
  
  // Periodo actual (viene del servicio compartido)
  anio: number = 0;
  mes: number = 0;
  
  meses = [
    { value: 1, nombre: 'Enero' },
    { value: 2, nombre: 'Febrero' },
    { value: 3, nombre: 'Marzo' },
    { value: 4, nombre: 'Abril' },
    { value: 5, nombre: 'Mayo' },
    { value: 6, nombre: 'Junio' },
    { value: 7, nombre: 'Julio' },
    { value: 8, nombre: 'Agosto' },
    { value: 9, nombre: 'Septiembre' },
    { value: 10, nombre: 'Octubre' },
    { value: 11, nombre: 'Noviembre' },
    { value: 12, nombre: 'Diciembre' }
  ];

  constructor(
    private authService: AuthService,
    private movimientosService: MovimientosService,
    private periodoService: PeriodoService
  ) {
    const circulo = this.authService.getPrimerCirculo();
    this.circuloId = circulo?.id || 0;
  }

  ngOnInit(): void {
    // Suscribirse a cambios de periodo desde el header
    this.periodoService.periodo$.subscribe(periodo => {
      if (periodo.anio !== 0 && periodo.mes !== 0) {
        this.anio = periodo.anio;
        this.mes = periodo.mes;
        this.cargarDatos();
      }
    });
  }

  ngAfterViewInit(): void {
    // El gráfico se creará cuando se cargue la evolución
  }

  cargarDatos(): void {
    this.loading = true;
    const anio = this.anio;
    const mes = this.mes;

    // Inicializar arrays por si las respuestas fallan
    this.totalesPorDia = [];
    this.categoriaIngresos = [];
    this.categoriaGastos = [];
    this.detalleIngresos = [];
    this.detalleGastos = [];
    this.datosGraficoCategoria = [];
    this.saldoAnteriorData = null;
    this.movimientosPeriodo = [];

    // IMPORTANTE: Cargar saldo anterior y balance en paralelo
    Promise.all([
      // Cargar saldo anterior
      new Promise<void>((resolve) => {
        this.movimientosService.getSaldoAnterior(this.circuloId, anio, mes).subscribe({
          next: (response) => {
            if (response?.data?.saldo_mes_anterior) {
              this.saldoAnteriorData = response.data.saldo_mes_anterior;
              this.balance.saldo_anterior = this.saldoAnteriorData.saldo_anterior || 0;
            } else {
              this.balance.saldo_anterior = 0;
            }
            resolve();
          },
          error: (error) => {
            console.log('Nota: El endpoint de saldo anterior no está disponible');
            this.balance.saldo_anterior = 0;
            resolve();
          }
        });
      }),
      // Cargar balance del período
      new Promise<void>((resolve) => {
        this.movimientosService.getBalance(this.circuloId, anio, mes).subscribe({
          next: (response) => {
            const balanceData = response?.data || { 
              total_ingresos: 0, 
              total_gastos: 0, 
              balance_neto: 0 
            };
            
            this.balance.total_ingresos = balanceData.total_ingresos;
            this.balance.total_gastos = balanceData.total_gastos;
            this.balance.balance_neto = balanceData.balance_neto;
            resolve();
          },
          error: (error) => {
            console.error('Error cargando balance:', error);
            this.balance.total_ingresos = 0;
            this.balance.total_gastos = 0;
            this.balance.balance_neto = 0;
            resolve();
          }
        });
      })
    ]).then(() => {
      // Calcular saldo final después de que ambas promesas se resuelvan
      this.balance.saldo_final = (+this.balance.saldo_anterior) + (+this.balance.balance_neto);
      
    });

    // NUEVO: Cargar TODOS los movimientos del período (sin límite)
    this.movimientosService.getMovimientos(
      undefined, // tipo_mov_id (undefined = todos)
      this.circuloId,
      anio,
      mes,
      0 // limit = 0 significa SIN LÍMITE
    ).subscribe({
      next: (response) => {
        this.movimientosPeriodo = response?.data?.movimientos || [];
        console.log(`Movimientos cargados: ${this.movimientosPeriodo.length}`);
      },
      error: (error) => {
        console.error('Error cargando movimientos:', error);
        this.movimientosPeriodo = [];
      }
    });

    // Cargar totales por día
    this.movimientosService.getTotalesPorDia(this.circuloId, anio, mes).subscribe({
      next: (response) => {
        this.totalesPorDia = response?.data?.totales || [];
      },
      error: (error) => {
        console.error('Error cargando totales por día:', error);
        this.totalesPorDia = [];
      }
    });

    // Cargar totales por categoría
    this.movimientosService.getTotalesPorCategoria(this.circuloId, anio, mes).subscribe({
      next: (response) => {
        const totales = response?.data?.totales || [];
        this.categoriaIngresos = totales.filter(t => t.tipo_movimiento === 'Ingreso') || [];
        this.categoriaGastos = totales.filter(t => t.tipo_movimiento === 'Gasto') || [];
      },
      error: (error) => {
        console.error('Error cargando totales por categoría:', error);
        this.categoriaIngresos = [];
        this.categoriaGastos = [];
      }
    });

    // Cargar detalle por concepto
    this.movimientosService.getBalanceDetallado(this.circuloId, anio, mes).subscribe({
      next: (response) => {
        const detalle = response?.data?.detalle || [];
        this.detalleIngresos = detalle.filter(d => d.tipo_movimiento === 'Ingreso') || [];
        this.detalleGastos = detalle.filter(d => d.tipo_movimiento === 'Gasto') || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando detalle:', error);
        this.detalleIngresos = [];
        this.detalleGastos = [];
        this.loading = false;
      }
    });
    
    // Cargar datos para gráfico de barras por categoría
    this.movimientosService.getGraficoCategoria(this.circuloId, anio, mes).subscribe({
      next: (response: any) => {
        this.datosGraficoCategoria = response?.data?.categorias || [];
        // Solo crear el gráfico si está expandido
        if (this.expandirGraficoCategoria && this.datosGraficoCategoria && this.datosGraficoCategoria.length > 0) {
          setTimeout(() => this.actualizarGraficoBarras(), 200);
        }
      },
      error: (error: any) => {
        console.error('Error cargando gráfico categoría:', error);
        this.datosGraficoCategoria = [];
      }
    });
    
    // Cargar evolución (solo si no hay mes seleccionado)
    if (!mes) {
      this.cargarEvolucion(anio);
    }

    // Precalcular texto del período
    if (mes) {
      const mesNombre = this.meses.find(m => m.value === mes)?.nombre || '';
      this.periodoTextoCalculado = `${mesNombre} ${anio}`;
    } else {
      this.periodoTextoCalculado = `Año ${anio}`;
    }
  }

  // ========================================
  // NUEVOS MÉTODOS PARA MODAL
  // ========================================

  /**
   * Mostrar movimientos por fecha
   */
  mostrarMovimientosPorFecha(fecha: string): void {
    this.modalMovimientos = this.movimientosPeriodo.filter(m => m.fecha === fecha);
    this.modalTitulo = 'Movimientos del día';
    this.modalSubtitulo = this.formatearFecha(fecha);
    this.isModalOpen = true;
  }

  /**
   * Mostrar movimientos por categoría
   */
  mostrarMovimientosPorCategoria(categoriaNombre: string, tipo: 'Ingreso' | 'Gasto'): void {
    this.modalMovimientos = this.movimientosPeriodo.filter(
      m => m.categoria_nombre === categoriaNombre && m.tipo_movimiento === tipo
    );
    this.modalTitulo = `${tipo}s - ${categoriaNombre}`;
    this.modalSubtitulo = `${this.modalMovimientos.length} movimiento(s)`;
    this.isModalOpen = true;
  }

  /**
   * Mostrar movimientos por concepto
   */
  mostrarMovimientosPorConcepto(conceptoNombre: string, tipo: 'Ingreso' | 'Gasto'): void {
    this.modalMovimientos = this.movimientosPeriodo.filter(
      m => m.concepto_nombre === conceptoNombre && m.tipo_movimiento === tipo
    );
    this.modalTitulo = `${tipo}s - ${conceptoNombre}`;
    this.modalSubtitulo = `${this.modalMovimientos.length} movimiento(s)`;
    this.isModalOpen = true;
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.isModalOpen = false;
    this.modalMovimientos = [];
    this.modalTitulo = '';
    this.modalSubtitulo = '';
  }

  /**
   * Formatear fecha para mostrar
   */
  private formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // ========================================
  // MÉTODOS EXISTENTES (sin cambios)
  // ========================================
  
  actualizarGraficoBarras(): void {
    if (!this.datosGraficoCategoria || this.datosGraficoCategoria.length === 0) {
      return;
    }
    
    const labels = this.datosGraficoCategoria.map(c => c.categoria_nombre);
    const ingresos = this.datosGraficoCategoria.map(c => c.total_ingresos);
    const gastos = this.datosGraficoCategoria.map(c => c.total_gastos);

    // Destruir gráfico anterior si existe
    if (this.chartBarras) {
      this.chartBarras.destroy();
    }

    setTimeout(() => {
      if (this.chartBarrasCanvas && this.chartBarrasCanvas.nativeElement) {
        const ctx = this.chartBarrasCanvas.nativeElement.getContext('2d');

        if (ctx) {
          this.chartBarras = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Ingresos',
                  data: ingresos,
                  backgroundColor: 'rgba(76, 175, 80, 0.8)',
                  borderColor: '#4caf50',
                  borderWidth: 1
                },
                {
                  label: 'Gastos',
                  data: gastos,
                  backgroundColor: 'rgba(244, 67, 54, 0.8)',
                  borderColor: '#f44336',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      const value = context.parsed.y;
                      if (value === null || value === undefined) {
                        return label + '$0';
                      }
                      if (value >= 1000000) {
                        label += '$' + (value / 1000000).toFixed(1) + 'M';
                      } else if (value >= 1000) {
                        label += '$' + (value / 1000).toFixed(0) + 'K';
                      } else {
                        label += '$' + value.toLocaleString('es-CO');
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                x: {
                  display: true
                },
                y: {
                  display: true,
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => {
                      const numValue = Number(value);
                      if (numValue >= 1000000) {
                        return '$' + (numValue / 1000000).toFixed(1) + 'M';
                      } else if (numValue >= 1000) {
                        return '$' + (numValue / 1000).toFixed(0) + 'K';
                      }
                      return '$' + numValue.toLocaleString('es-CO');
                    }
                  }
                }
              }
            }
          });
        }
      }
    }, 100);
  }
  
  cargarEvolucion(anio: number): void {
    this.movimientosService.getEvolucion(this.circuloId, anio).subscribe({
      next: (response) => {
        this.datosEvolucion = response?.data?.datos || [];
        // Solo crear el gráfico si está expandido
        if (this.expandirGraficoEvolucion && this.datosEvolucion.length > 0) {
          this.actualizarGrafico(this.datosEvolucion);
        }
      },
      error: (error) => {
        console.error('Error cargando evolución:', error);
        this.datosEvolucion = [];
      }
    });
  }

  actualizarGrafico(datos: EvolucionMes[]): void {
    if (!datos || datos.length === 0) {
      return;
    }
    
    const labels = datos.map(d => d.mes_nombre);
    const ingresos = datos.map(d => d.ingresos);
    const gastos = datos.map(d => d.gastos);

    // Destruir gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    // Esperar a que el canvas esté disponible
    setTimeout(() => {
      if (this.chartCanvas && this.chartCanvas.nativeElement) {
        const ctx = this.chartCanvas.nativeElement.getContext('2d');

        if (ctx) {
          this.chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [
                {
                  data: ingresos,
                  label: 'Ingresos',
                  borderColor: '#4caf50',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6
                },
                {
                  data: gastos,
                  label: 'Gastos',
                  borderColor: '#f44336',
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: (context) => {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      const value = context.parsed.y;
                      if (value === null || value === undefined) {
                        return label + '$0';
                      }
                      if (value >= 1000000) {
                        label += '$' + (value / 1000000).toFixed(1) + 'M';
                      } else if (value >= 1000) {
                        label += '$' + (value / 1000).toFixed(0) + 'K';
                      } else {
                        label += '$' + value.toLocaleString('es-CO');
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                x: {
                  display: true
                },
                y: {
                  display: true,
                  ticks: {
                    callback: (value) => {
                      const numValue = Number(value);
                      if (numValue >= 1000000) {
                        return '$' + (numValue / 1000000).toFixed(1) + 'M';
                      } else if (numValue >= 1000) {
                        return '$' + (numValue / 1000).toFixed(0) + 'K';
                      }
                      return '$' + numValue.toLocaleString('es-CO');
                    }
                  }
                }
              }
            }
          });
        }
      }
    }, 100);
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  get mostrarGrafico(): boolean {
    return !this.mes;
  }

  // Getter que retorna propiedad precalculada
  get periodoTexto(): string {
    return this.periodoTextoCalculado;
  }

  // ========================================
  // MÉTODOS TOGGLE PARA ACORDEÓN
  // ========================================
  toggleResumen(): void {
    this.expandirResumen = !this.expandirResumen;
  }

  toggleTotalesDia(): void {
    this.expandirTotalesDia = !this.expandirTotalesDia;
  }

  toggleCategoria(): void {
    this.expandirCategoria = !this.expandirCategoria;
  }

  toggleDetalle(): void {
    this.expandirDetalle = !this.expandirDetalle;
  }

  toggleGraficoEvolucion(): void {
    this.expandirGraficoEvolucion = !this.expandirGraficoEvolucion;
    // Si se expande
    if (this.expandirGraficoEvolucion && !this.mes) {
      // Si ya hay datos, recrear el gráfico
      if (this.datosEvolucion && this.datosEvolucion.length > 0) {
        setTimeout(() => this.actualizarGrafico(this.datosEvolucion), 100);
      } else {
        // Si no hay datos, cargarlos
        setTimeout(() => this.cargarEvolucion(this.anio), 100);
      }
    }
  }

  toggleGraficoCategoria(): void {
    this.expandirGraficoCategoria = !this.expandirGraficoCategoria;
    // Si se expande y hay datos, recrear el gráfico
    if (this.expandirGraficoCategoria && this.datosGraficoCategoria && this.datosGraficoCategoria.length > 0) {
      setTimeout(() => this.actualizarGraficoBarras(), 100);
    }
  }
}