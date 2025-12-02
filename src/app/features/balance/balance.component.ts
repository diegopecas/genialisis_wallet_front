/**
 * BalanceComponent - CON SECCIÓN DE CUENTAS (CORREGIDO)
 * Balance con totales por cuenta y modal de movimientos
 */

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { MovimientosService } from '../../core/services/movimientos.service';
import { CuentasService } from '../../core/services/cuentas.service';
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

// NUEVO: Interfaz para totales por cuenta
interface TotalPorCuenta {
  cuenta_id: number;
  cuenta_nombre: string;
  cuenta_icono: string;
  saldo_actual: number;
  total_ingresos: number;        // Solo tipo 1 (ingresos puros)
  total_gastos: number;          // Solo tipo 2 (gastos puros)
  traslados_entrada: number;     // Solo tipo 3 cuenta_destino
  traslados_salida: number;      // Solo tipo 3 cuenta_origen
  cantidad_movimientos: number;
}

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
  
  // NUEVO: Totales por cuenta
  totalesPorCuenta: TotalPorCuenta[] = [];
  
  // Array de movimientos del período
  movimientosPeriodo: Movimiento[] = [];
  
  // Control del modal
  modalMovimientos: Movimiento[] = [];
  modalTitulo: string = '';
  modalSubtitulo: string = '';
  modalCuentaId: number | null = null; // NUEVO: ID de la cuenta del modal
  isModalOpen: boolean = false;
  
  // Control de acordeón de secciones
  expandirResumen: boolean = true;
  expandirTotalesDia: boolean = false;
  expandirCategoria: boolean = false;
  expandirDetalle: boolean = false;
  expandirGraficoEvolucion: boolean = false;
  expandirGraficoCategoria: boolean = false;
  expandirCuentas: boolean = false; // NUEVO
  
  loading = false;
  circuloId: number = 0;
  chart: Chart | null = null;
  chartBarras: Chart | null = null;
  datosGraficoCategoria: GraficoCategoria[] = [];
  datosEvolucion: any[] = [];
  periodoTextoCalculado: string = '';
  
  // Periodo actual
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
    private cuentasService: CuentasService, // NUEVO
    private periodoService: PeriodoService
  ) {
    const circulo = this.authService.getPrimerCirculo();
    this.circuloId = circulo?.id || 0;
  }

  ngOnInit(): void {
    this.periodoService.periodo$.subscribe(periodo => {
      if (periodo.anio !== 0 && periodo.mes !== 0) {
        this.anio = periodo.anio;
        this.mes = periodo.mes;
        this.cargarDatos(this.anio, this.mes);
      }
    });
  }

  ngAfterViewInit(): void {
    // Gráficos se crean cuando se expanden
  }

  get periodoTexto(): string {
    return this.periodoTextoCalculado || '';
  }

  get mostrarGrafico(): boolean {
    return this.datosEvolucion && this.datosEvolucion.length > 0;
  }

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
    if (this.expandirGraficoEvolucion && this.datosEvolucion && this.datosEvolucion.length > 0) {
      setTimeout(() => this.actualizarGrafico(), 200);
    }
  }

  toggleGraficoCategoria(): void {
    this.expandirGraficoCategoria = !this.expandirGraficoCategoria;
    if (this.expandirGraficoCategoria && this.datosGraficoCategoria && this.datosGraficoCategoria.length > 0) {
      setTimeout(() => this.actualizarGraficoBarras(), 200);
    }
  }

  // NUEVO: Toggle para cuentas
  toggleCuentas(): void {
    this.expandirCuentas = !this.expandirCuentas;
  }

  cargarDatos(anio: number, mes?: number): void {
    this.loading = true;

    // Resetear datos
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
            if (response?.data) {
              const data = response.data as any;
              this.saldoAnteriorData = {
                saldo_anterior: data.saldo_anterior || 0,
                total_ingresos_acumulados: data.total_ingresos || 0,
                total_gastos_acumulados: data.total_gastos || 0,
                fecha_corte: data.periodo_hasta || ''
              };
              this.balance.saldo_anterior = this.saldoAnteriorData.saldo_anterior;
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
        // NUEVO: Calcular totales por cuenta
        this.calcularTotalesPorCuenta();
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
        this.categoriaIngresos = totales.filter((t: any) => t.tipo_movimiento === 'Ingreso') || [];
        this.categoriaGastos = totales.filter((t: any) => t.tipo_movimiento === 'Gasto') || [];
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
        this.detalleIngresos = detalle.filter((d: any) => d.tipo_movimiento === 'Ingreso') || [];
        this.detalleGastos = detalle.filter((d: any) => d.tipo_movimiento === 'Gasto') || [];
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

  // NUEVO: Calcular totales por cuenta desde los movimientos
  private calcularTotalesPorCuenta(): void {
    console.log('🔍 === INICIANDO CÁLCULO DE TOTALES POR CUENTA ===');
    console.log('📦 Movimientos del período:', this.movimientosPeriodo.length);
    
    const cuentasMap = new Map<number, TotalPorCuenta>();

    this.movimientosPeriodo.forEach((mov, index) => {
      // IMPORTANTE: Convertir valor a número (puede venir como string o number)
      const valor = typeof mov.valor === 'string' ? parseFloat(mov.valor) : (mov.valor || 0);
      

      // Para ingresos y gastos PUROS (sin traslados)
      if (mov.cuenta_id) {
        if (!cuentasMap.has(mov.cuenta_id)) {
          cuentasMap.set(mov.cuenta_id, {
            cuenta_id: mov.cuenta_id,
            cuenta_nombre: mov.cuenta_nombre || 'Sin nombre',
            cuenta_icono: mov.cuenta_icono || '💳',
            saldo_actual: 0,
            total_ingresos: 0,
            total_gastos: 0,
            traslados_entrada: 0,
            traslados_salida: 0,
            cantidad_movimientos: 0
          });
          console.log(`  ✅ Nueva cuenta creada: ${mov.cuenta_nombre}`);
        }

        const cuenta = cuentasMap.get(mov.cuenta_id)!;
        cuenta.cantidad_movimientos++;

        if (mov.tipo_movimiento === 'Ingreso') {
          cuenta.total_ingresos += valor;
          console.log(`  💰 Ingreso PURO: +$${valor} → ${mov.cuenta_nombre}`);
        } else if (mov.tipo_movimiento === 'Gasto') {
          cuenta.total_gastos += valor;
          console.log(`  💸 Gasto PURO: -$${valor} → ${mov.cuenta_nombre}`);
        }
      }

      // Para traslados ORIGEN (sale dinero)
      if (mov.cuenta_origen_id) {
        console.log(`  🔄 Traslado detectado - ORIGEN`);
        if (!cuentasMap.has(mov.cuenta_origen_id)) {
          cuentasMap.set(mov.cuenta_origen_id, {
            cuenta_id: mov.cuenta_origen_id,
            cuenta_nombre: mov.cuenta_origen_nombre || 'Sin nombre',
            cuenta_icono: mov.cuenta_origen_icono || '💳',
            saldo_actual: 0,
            total_ingresos: 0,
            total_gastos: 0,
            traslados_entrada: 0,
            traslados_salida: 0,
            cantidad_movimientos: 0
          });
          console.log(`  ✅ Nueva cuenta creada (origen): ${mov.cuenta_origen_nombre}`);
        }
        const cuentaOrigen = cuentasMap.get(mov.cuenta_origen_id)!;
        cuentaOrigen.cantidad_movimientos++;
        cuentaOrigen.traslados_salida += valor; // Traslado SALE de esta cuenta
        console.log(`  ↘️ Traslado SALIDA: -$${valor} de ${mov.cuenta_origen_nombre}`);
      }

      // Para traslados DESTINO (entra dinero)
      if (mov.cuenta_destino_id) {
        console.log(`  🔄 Traslado detectado - DESTINO`);
        if (!cuentasMap.has(mov.cuenta_destino_id)) {
          cuentasMap.set(mov.cuenta_destino_id, {
            cuenta_id: mov.cuenta_destino_id,
            cuenta_nombre: mov.cuenta_destino_nombre || 'Sin nombre',
            cuenta_icono: mov.cuenta_destino_icono || '💳',
            saldo_actual: 0,
            total_ingresos: 0,
            total_gastos: 0,
            traslados_entrada: 0,
            traslados_salida: 0,
            cantidad_movimientos: 0
          });
          console.log(`  ✅ Nueva cuenta creada (destino): ${mov.cuenta_destino_nombre}`);
        }
        const cuentaDestino = cuentasMap.get(mov.cuenta_destino_id)!;
        cuentaDestino.cantidad_movimientos++;
        cuentaDestino.traslados_entrada += valor; // Traslado ENTRA a esta cuenta
        console.log(`  ↗️ Traslado ENTRADA: +$${valor} a ${mov.cuenta_destino_nombre}`);
      }
    });

    console.log('\n📊 === RESUMEN DE CUENTAS PROCESADAS ===');
    console.log('Total de cuentas:', cuentasMap.size);
    
    // CALCULAR SALDO ACTUAL para cada cuenta
    Array.from(cuentasMap.values()).forEach(cuenta => {
      // ✅ Fórmula: ingresos - gastos + traslados_entrada - traslados_salida
      cuenta.saldo_actual = cuenta.total_ingresos 
                          - cuenta.total_gastos 
                          + cuenta.traslados_entrada 
                          - cuenta.traslados_salida;
      
      console.log(`  ${cuenta.cuenta_icono} ${cuenta.cuenta_nombre}:`, {
        movimientos: cuenta.cantidad_movimientos,
        ingresos: cuenta.total_ingresos,
        gastos: cuenta.total_gastos,
        traslados_entrada: cuenta.traslados_entrada,
        traslados_salida: cuenta.traslados_salida,
        saldo_calculado: cuenta.saldo_actual
      });
    });

    // Convertir a array y ordenar por saldo
    this.totalesPorCuenta = Array.from(cuentasMap.values())
      .sort((a, b) => b.saldo_actual - a.saldo_actual);
    
    console.log('\n✅ === RESULTADO FINAL ===');
    console.log('Totales por cuenta:', this.totalesPorCuenta);
  }

  // ========================================
  // MÉTODOS PARA MODAL
  // ========================================

  mostrarMovimientosPorFecha(fecha: string): void {
    this.modalMovimientos = this.movimientosPeriodo.filter(m => m.fecha === fecha);
    this.modalTitulo = 'Movimientos del día';
    this.modalSubtitulo = this.formatearFecha(fecha);
    this.isModalOpen = true;
  }

  mostrarMovimientosPorCategoria(categoriaNombre: string, tipo: 'Ingreso' | 'Gasto'): void {
    this.modalMovimientos = this.movimientosPeriodo.filter(
      m => m.categoria_nombre === categoriaNombre && m.tipo_movimiento === tipo
    );
    this.modalTitulo = `${tipo}s - ${categoriaNombre}`;
    this.modalSubtitulo = `${this.modalMovimientos.length} movimiento(s)`;
    this.isModalOpen = true;
  }

  mostrarMovimientosPorConcepto(conceptoNombre: string, tipo: 'Ingreso' | 'Gasto'): void {
    this.modalMovimientos = this.movimientosPeriodo.filter(
      m => m.concepto_nombre === conceptoNombre && m.tipo_movimiento === tipo
    );
    this.modalTitulo = `${tipo}s - ${conceptoNombre}`;
    this.modalSubtitulo = `${this.modalMovimientos.length} movimiento(s)`;
    this.isModalOpen = true;
  }

  // NUEVO: Mostrar movimientos por cuenta
  mostrarMovimientosPorCuenta(cuentaId: number, cuentaNombre: string): void {
    this.modalMovimientos = this.movimientosPeriodo.filter(m => 
      m.cuenta_id === cuentaId || 
      m.cuenta_origen_id === cuentaId || 
      m.cuenta_destino_id === cuentaId
    );
    this.modalTitulo = `Movimientos - ${cuentaNombre}`;
    this.modalSubtitulo = `${this.modalMovimientos.length} movimiento(s) en el período`;
    this.modalCuentaId = cuentaId; // NUEVO: Guardar ID de cuenta
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.modalMovimientos = [];
    this.modalTitulo = '';
    this.modalSubtitulo = '';
    this.modalCuentaId = null; // NUEVO: Limpiar ID de cuenta
  }

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
  // MÉTODOS DE GRÁFICOS
  // ========================================
  
  actualizarGraficoBarras(): void {
    if (!this.datosGraficoCategoria || this.datosGraficoCategoria.length === 0) {
      return;
    }
    
    const labels = this.datosGraficoCategoria.map(c => c.categoria_nombre);
    const ingresos = this.datosGraficoCategoria.map(c => c.total_ingresos);
    const gastos = this.datosGraficoCategoria.map(c => c.total_gastos);

    if (this.chartBarras) {
      this.chartBarras.destroy();
    }

    const ctx = this.chartBarrasCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresos,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          },
          {
            label: 'Gastos',
            data: gastos,
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
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
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return `${label}: ${this.formatearValor(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatearValorCorto(Number(value))
            }
          }
        }
      }
    };

    this.chartBarras = new Chart(ctx, config);
  }

  cargarEvolucion(anio: number): void {
    this.movimientosService.getEvolucion(this.circuloId, anio).subscribe({
      next: (response) => {
        this.datosEvolucion = response?.data?.datos || [];
        // Solo crear el gráfico si está expandido
        if (this.expandirGraficoEvolucion && this.datosEvolucion.length > 0) {
          this.actualizarGrafico();
        }
      },
      error: (error) => {
        console.error('Error cargando evolución:', error);
        this.datosEvolucion = [];
      }
    });
  }

  actualizarGrafico(): void {
    if (!this.datosEvolucion || this.datosEvolucion.length === 0) {
      return;
    }

    const labels = this.datosEvolucion.map((d: any) => this.meses.find(m => m.value === d.mes)?.nombre || '');
    const ingresos = this.datosEvolucion.map((d: any) => d.ingresos);
    const gastos = this.datosEvolucion.map((d: any) => d.gastos);
    const balances = this.datosEvolucion.map((d: any) => d.balance);

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresos,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3
          },
          {
            label: 'Gastos',
            data: gastos,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3
          },
          {
            label: 'Balance Neto',
            data: balances,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3
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
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return `${label}: ${this.formatearValor(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatearValorCorto(Number(value))
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  formatearValorCorto(valor: number): string {
    if (valor >= 1000000) {
      return `$${(valor / 1000000).toFixed(1)}M`;
    } else if (valor >= 1000) {
      return `$${(valor / 1000).toFixed(0)}K`;
    }
    return `$${valor}`;
  }
}