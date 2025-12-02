/**
 * AppComponent - ACTUALIZADO CON TAB TRASLADOS
 * Componente principal con header, tabs y router
 */

import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "./core/services/auth.service";
import {
  MovimientosService,
  PeriodoDisponible,
} from "./core/services/movimientos.service";
import { PeriodoService } from "./core/services/periodo.service";
import { Usuario, Circulo } from "./core/models/usuario.model";
import { LoadingSpinnerComponent } from "./shared/loading-spinner/loading-spinner.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingSpinnerComponent, FormsModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "Circle Finance";
  currentUser: Usuario | null = null;
  currentCirculo: Circulo | null = null;
  activeTab = "gastos";

  // Selectores de periodo
  anioSeleccionado: number = 0;
  mesSeleccionado: number = 0;
  periodosDisponibles: PeriodoDisponible[] = [];
  aniosDisponibles: number[] = [];
  mesesDisponibles: number[] = [];

  mesesNombres = [
    { valor: 1, nombre: "Enero" },
    { valor: 2, nombre: "Febrero" },
    { valor: 3, nombre: "Marzo" },
    { valor: 4, nombre: "Abril" },
    { valor: 5, nombre: "Mayo" },
    { valor: 6, nombre: "Junio" },
    { valor: 7, nombre: "Julio" },
    { valor: 8, nombre: "Agosto" },
    { valor: 9, nombre: "Septiembre" },
    { valor: 10, nombre: "Octubre" },
    { valor: 11, nombre: "Noviembre" },
    { valor: 12, nombre: "Diciembre" },
  ];

  constructor(
    private authService: AuthService,
    private movimientosService: MovimientosService,
    private periodoService: PeriodoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.currentCirculo = this.authService.getPrimerCirculo();

    // Establecer periodo actual (Colombia)
    this.establecerPeriodoActual();

    // Cargar periodos disponibles
    if (this.currentCirculo) {
      this.cargarPeriodosDisponibles();
    }
  }

  /**
   * Establecer año y mes actual en zona horaria de Colombia
   */
  private establecerPeriodoActual(): void {
    const now = new Date();
    const colombiaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Bogota" })
    );

    this.anioSeleccionado = colombiaTime.getFullYear();
    this.mesSeleccionado = colombiaTime.getMonth() + 1;

    // Inicializar arrays con el periodo actual como fallback
    this.aniosDisponibles = [this.anioSeleccionado];
    this.mesesDisponibles = [this.mesSeleccionado];

    // Notificar a los componentes hijos
    this.periodoService.setPeriodo(this.anioSeleccionado, this.mesSeleccionado);
  }

  /**
   * Cargar periodos disponibles desde el backend
   */
  cargarPeriodosDisponibles(): void {
    if (!this.currentCirculo) return;

    // Determinar tipo de movimiento según tab activo
    let tipoMovId: number | undefined = undefined;
    if (this.activeTab === "gastos") {
      tipoMovId = 2;
    } else if (this.activeTab === "ingresos") {
      tipoMovId = 1;
    } else if (this.activeTab === "traslados") {
      tipoMovId = 3; // ⬅️ NUEVO: Tipo 3 para traslados
    }
    // Para balance, no filtramos por tipo (undefined = todos)

    this.movimientosService
      .getPeriodosDisponibles(this.currentCirculo.id, tipoMovId)
      .subscribe({
        next: (response) => {
          if (
            response.success &&
            response.data &&
            response.data.periodos &&
            response.data.periodos.length > 0
          ) {
            this.periodosDisponibles = response.data.periodos;

            // Extraer años disponibles
            this.aniosDisponibles = this.periodosDisponibles.map((p) => p.anio);

            // CRÍTICO: Verificar si el periodo actual existe en los datos
            const periodoActualExiste = this.verificarPeriodoExiste(
              this.anioSeleccionado,
              this.mesSeleccionado
            );

            if (!periodoActualExiste) {
              // Si el periodo actual no tiene datos, usar el último periodo disponible
              this.usarUltimoPeriodoDisponible();
            } else {
              // El periodo actual existe, solo actualizar meses
              this.actualizarMesesDisponibles();
            }
          } else {
            this.usarPeriodoActualComoFallback();
          }
        },
        error: (error) => {
          console.error("Error cargando periodos disponibles:", error);
          // FALLBACK: En caso de error, usar periodo actual
          this.usarPeriodoActualComoFallback();
        },
      });
  }

  /**
   * Verificar si un periodo existe en los datos del backend
   */
  private verificarPeriodoExiste(anio: number, mes: number): boolean {
    const periodo = this.periodosDisponibles.find((p) => p.anio === anio);
    return periodo ? periodo.meses.includes(mes) : false;
  }

  /**
   * Usar el último periodo disponible (año más reciente, mes más reciente)
   */
  private usarUltimoPeriodoDisponible(): void {
    if (this.periodosDisponibles.length === 0) {
      this.usarPeriodoActualComoFallback();
      return;
    }

    // Los periodos vienen ordenados DESC (más reciente primero)
    const ultimoPeriodo = this.periodosDisponibles[0];

    // El último mes del último año
    const ultimoMes = Math.max(...ultimoPeriodo.meses);



    this.anioSeleccionado = ultimoPeriodo.anio;
    this.mesSeleccionado = ultimoMes;

    // Actualizar meses disponibles
    this.actualizarMesesDisponibles();

    // CRÍTICO: Notificar el cambio de periodo
    this.periodoService.setPeriodo(this.anioSeleccionado, this.mesSeleccionado);
  }

  /**
   * Usar periodo actual como fallback si no hay datos del backend
   */
  private usarPeriodoActualComoFallback(): void {
    this.aniosDisponibles = [this.anioSeleccionado];
    this.mesesDisponibles = [this.mesSeleccionado];

    this.periodosDisponibles = [
      {
        anio: this.anioSeleccionado,
        meses: [this.mesSeleccionado],
      },
    ];
  }

  /**
   * Actualizar meses disponibles según año seleccionado
   */
  actualizarMesesDisponibles(): void {
    const periodoEncontrado = this.periodosDisponibles.find(
      (p) => p.anio === this.anioSeleccionado
    );
    this.mesesDisponibles = periodoEncontrado ? periodoEncontrado.meses : [];
  }

  /**
   * Cambiar año seleccionado
   */
  onAnioChange(): void {
    this.actualizarMesesDisponibles();

    // Si el mes seleccionado no está disponible en el nuevo año, seleccionar el primero disponible
    if (
      !this.mesesDisponibles.includes(this.mesSeleccionado) &&
      this.mesesDisponibles.length > 0
    ) {
      this.mesSeleccionado = this.mesesDisponibles[0];
    }

    // Notificar cambio de periodo
    this.periodoService.setPeriodo(this.anioSeleccionado, this.mesSeleccionado);
  }

  /**
   * Cambiar mes seleccionado
   */
  onMesChange(): void {
    // Notificar cambio de periodo
    this.periodoService.setPeriodo(this.anioSeleccionado, this.mesSeleccionado);
  }

  /**
   * Obtener nombre del mes
   */
  getNombreMes(mes: number): string {
    const mesEncontrado = this.mesesNombres.find((m) => m.valor === mes);
    return mesEncontrado ? mesEncontrado.nombre : mes.toString();
  }

  /**
   * Cambiar tab activo
   * ACTUALIZADO: Ahora incluye tab "traslados"
   */
  changeTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);

    // Recargar periodos disponibles cuando cambia el tab
    if (tab === "gastos" || tab === "ingresos" || tab === "balance" || tab === "traslados") {
      this.cargarPeriodosDisponibles();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}