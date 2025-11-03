/**
 * BalanceComponent
 * Balance con filtros, estadísticas y gráfico de evolución
 */

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { MovimientosService } from '../../core/services/movimientos.service';
import { Balance, DetalleConcepto, EvolucionMes } from '../../core/models/movimiento.model';

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
  
  filtrosForm: FormGroup;
  balance: Balance = { total_ingresos: 0, total_gastos: 0, balance_neto: 0 };
  detalleIngresos: DetalleConcepto[] = [];
  detalleGastos: DetalleConcepto[] = [];
  loading = false;
  circuloId: number = 0;
  chart: Chart | null = null;

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

    const anioActual = new Date().getFullYear();
    this.anios = [anioActual, anioActual - 1, anioActual - 2];

    this.filtrosForm = this.fb.group({
      anio: [anioActual],
      mes: [null]
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

    // Cargar balance
    this.movimientosService.getBalance(this.circuloId, anio, mes).subscribe({
      next: (response) => {
        this.balance = response.data;
      },
      error: (error) => {
        console.error('Error cargando balance:', error);
      }
    });

    // Cargar detalle
    this.movimientosService.getBalanceDetallado(this.circuloId, anio, mes).subscribe({
      next: (response) => {
        const detalle = response.data.detalle;
        this.detalleIngresos = detalle.filter(d => d.tipo_movimiento === 'Ingreso');
        this.detalleGastos = detalle.filter(d => d.tipo_movimiento === 'Gasto');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando detalle:', error);
        this.loading = false;
      }
    });

    // Cargar evolución (solo si no hay mes seleccionado)
    if (!mes) {
      this.cargarEvolucion(anio);
    }
  }

  cargarEvolucion(anio: number): void {
    this.movimientosService.getEvolucion(this.circuloId, anio).subscribe({
      next: (response) => {
        const datos = response.data.datos;
        this.actualizarGrafico(datos);
      },
      error: (error) => {
        console.error('Error cargando evolución:', error);
      }
    });
  }

  actualizarGrafico(datos: EvolucionMes[]): void {
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
}
