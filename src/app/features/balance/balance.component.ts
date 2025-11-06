/**
 * BalanceComponent
 * Balance con saldo anterior acumulado correctamente
 */

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { MovimientosService } from '../../core/services/movimientos.service';
import {
  Balance,
  DetalleConcepto,
  EvolucionMes,
  TotalPorDia,
  TotalPorCategoria,
  GraficoCategoria,
  SaldoAnterior
} from '../../core/models/movimiento.model';

Chart.register(...registerables);

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss']
})
export class BalanceComponent implements OnInit, AfterViewInit {

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBarrasCanvas') chartBarrasCanvas!: ElementRef<HTMLCanvasElement>;

  filtrosForm!: FormGroup;
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
  loading = false;
  circuloId: number = 0;
  chart: Chart | null = null;
  chartBarras: Chart | null = null;
  datosGraficoCategoria: GraficoCategoria[] = [];
  anios: number[] = [];
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
    private fb: FormBuilder,
    private authService: AuthService,
    private movimientosService: MovimientosService
  ) {
    const circulo = this.authService.getPrimerCirculo();
    this.circuloId = circulo?.id || 0;

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // getMonth() retorna 0-11, necesitamos 1-12
    
    this.anios = [anioActual, anioActual - 1, anioActual - 2];

    // CAMBIO IMPORTANTE: Inicializar con el mes actual, no con null
    this.filtrosForm = this.fb.group({
      anio: [anioActual],
      mes: [mesActual]  // Cambiado de null a mesActual
    });
  }

  ngOnInit(): void {
    this.cargarDatos();

    this.filtrosForm.valueChanges.subscribe(() => {
      this.cargarDatos();
    });
  }

  ngAfterViewInit(): void {
    // El gráfico se creará cuando se cargue la evolución
  }

  cargarDatos(): void {
    this.loading = true;
    const anio = this.filtrosForm.value.anio;
    const mes = this.filtrosForm.value.mes;

    // Inicializar arrays por si las respuestas fallan
    this.totalesPorDia = [];
    this.categoriaIngresos = [];
    this.categoriaGastos = [];
    this.detalleIngresos = [];
    this.detalleGastos = [];
    this.datosGraficoCategoria = [];
    this.saldoAnteriorData = null;

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
        if (this.datosGraficoCategoria && this.datosGraficoCategoria.length > 0) {
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
  }
  
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
        const datos = response?.data?.datos || [];
        if (datos.length > 0) {
          this.actualizarGrafico(datos);
        }
      },
      error: (error) => {
        console.error('Error cargando evolución:', error);
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
    return !this.filtrosForm.value.mes;
  }

  get periodoTexto(): string {
    const anio = this.filtrosForm.value.anio;
    const mes = this.filtrosForm.value.mes;
    
    if (mes) {
      const mesNombre = this.meses.find(m => m.value === mes)?.nombre || '';
      return `${mesNombre} ${anio}`;
    }
    
    return `Año ${anio}`;
  }
}