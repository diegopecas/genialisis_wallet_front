/**
 * GastosComponent - CON SELECTOR DE CUENTAS
 * Registro de gastos con selección visual de cuenta
 */

import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { ConceptosService } from "../../core/services/conceptos.service";
import { MovimientosService } from "../../core/services/movimientos.service";
import { CuentasService } from "../../core/services/cuentas.service";
import { PeriodoService } from "../../core/services/periodo.service";
import { Categoria, Concepto } from "../../core/models/concepto.model";
import { Cuenta } from "../../core/models/cuenta.model";
import { EditarMovimientoModalComponent } from "../editar-movimiento-modal/editar-movimiento-modal.component";

@Component({
  selector: "app-gastos",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EditarMovimientoModalComponent,
  ],
  templateUrl: "./gastos.component.html",
  styleUrls: ["./gastos.component.scss"],
})
export class GastosComponent implements OnInit {
  gastoForm: FormGroup;
  categorias: Categoria[] = [];
  conceptosFiltrados: { categoria: string; concepto: Concepto }[] = [];
  todosLosConceptos: { categoria: string; concepto: Concepto }[] = [];
  conceptoSeleccionado: Concepto | null = null;
  categoriaSeleccionada: string = "";
  searchTerm: string = "";
  loading = false;
  circuloId: number = 0;
  gastos: any[] = [];
  gastosFiltrados: any[] = [];
  searchMovimientos: string = "";
  valorFormateado: string = "";

  // NUEVO: Cuentas
  cuentas: Cuenta[] = [];

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

    this.gastoForm = this.fb.group({
      valor: ["", [Validators.required, Validators.min(1)]],
      detalle: [""],
      concepto_id: ["", Validators.required],
      cuenta_id: ["", Validators.required], // NUEVO
      fecha: [this.obtenerFechaLocal(), Validators.required],
    });
  }

  private obtenerFechaLocal(): string {
    const now = new Date();
    const colombiaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Bogota" })
    );
    const year = colombiaTime.getFullYear();
    const month = String(colombiaTime.getMonth() + 1).padStart(2, "0");
    const day = String(colombiaTime.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.cargarConceptos();
    this.cargarCuentas(); // NUEVO

    this.periodoService.periodo$.subscribe((periodo) => {
      if (periodo.anio !== 0 && periodo.mes !== 0) {
        this.anio = periodo.anio;
        this.mes = periodo.mes;
        this.limitePorPagina = 10;
        this.hayMasRegistros = true;
        this.cargarGastos();
      }
    });
  }

  // NUEVO: Cargar cuentas
  cargarCuentas(): void {
    this.cuentasService.getCuentas(this.circuloId).subscribe({
      next: (response) => {
        if (response.success) {
          this.cuentas = Array.isArray(response.data)
            ? response.data
            : response.data.cuentas || [];
        }
      },
      error: (error) => {
        console.error("Error cargando cuentas:", error);
      },
    });
  }

  // NUEVO: Seleccionar cuenta
  seleccionarCuenta(cuentaId: number): void {
    this.gastoForm.patchValue({ cuenta_id: cuentaId });
  }

  cargarConceptos(): void {
    this.loading = true;
    this.conceptosService.getConceptos(this.circuloId, 2).subscribe({
      next: (response) => {
        if (response.success) {
          this.categorias = response.data.categorias;
          this.todosLosConceptos = [];
          this.categorias.forEach((cat) => {
            cat.conceptos.forEach((concepto) => {
              this.todosLosConceptos.push({
                categoria: cat.nombre,
                concepto: concepto,
              });
            });
          });
          this.conceptosFiltrados = [...this.todosLosConceptos];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error("Error cargando conceptos:", error);
        this.loading = false;
      },
    });
  }

  cargarGastos(): void {
    this.loading = true;
    this.movimientosService
      .getMovimientos(
        2,
        this.circuloId,
        this.anio,
        this.mes,
        this.limitePorPagina
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.gastos = response.data.movimientos;
            this.gastosFiltrados = [...this.gastos];
            this.totalRegistrosCargados = this.gastos.length;
            this.hayMasRegistros = this.gastos.length >= this.limitePorPagina;
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error("Error cargando gastos:", error);
          this.loading = false;
        },
      });
  }

  cargarTodosDelPeriodo(): void {
    this.loading = true;
    this.movimientosService
      .getMovimientos(2, this.circuloId, this.anio, this.mes, 0)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.gastos = response.data.movimientos;
            this.gastosFiltrados = [...this.gastos];
            this.totalRegistrosCargados = this.gastos.length;
            this.hayMasRegistros = false;
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error("Error cargando gastos:", error);
          this.loading = false;
        },
      });
  }

  buscarMovimientos(event: any): void {
    this.searchMovimientos = event.target.value.toLowerCase();
    if (this.searchMovimientos.trim() === "") {
      this.gastosFiltrados = [...this.gastos];
    } else {
      this.gastosFiltrados = this.gastos.filter(
        (gasto) =>
          gasto.concepto_nombre
            .toLowerCase()
            .includes(this.searchMovimientos) ||
          gasto.categoria_nombre
            .toLowerCase()
            .includes(this.searchMovimientos) ||
          (gasto.detalle &&
            gasto.detalle.toLowerCase().includes(this.searchMovimientos)) ||
          (gasto.cuenta_nombre &&
            gasto.cuenta_nombre.toLowerCase().includes(this.searchMovimientos)) // ⬅️ NUEVA LÍNEA
      );
    }
  }

  buscarConceptos(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    if (this.searchTerm.trim() === "") {
      this.conceptosFiltrados = [...this.todosLosConceptos];
    } else {
      this.conceptosFiltrados = this.todosLosConceptos.filter(
        (item) =>
          item.concepto.nombre.toLowerCase().includes(this.searchTerm) ||
          item.categoria.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  seleccionarConcepto(item: { categoria: string; concepto: Concepto }): void {
    this.conceptoSeleccionado = item.concepto;
    this.categoriaSeleccionada = item.categoria;
    this.gastoForm.patchValue({ concepto_id: item.concepto.id });
    const detalleControl = this.gastoForm.get("detalle");
    if (detalleControl) {
      detalleControl.clearValidators();
      detalleControl.setErrors(null);
      detalleControl.markAsUntouched();
      detalleControl.updateValueAndValidity();
    }
    this.gastoForm.updateValueAndValidity();
  }

  limpiarSeleccion(): void {
    this.conceptoSeleccionado = null;
    this.categoriaSeleccionada = "";
    this.searchTerm = "";
    this.conceptosFiltrados = [...this.todosLosConceptos];
    this.gastoForm.patchValue({ concepto_id: "" });
    const detalleControl = this.gastoForm.get("detalle");
    if (detalleControl) {
      detalleControl.clearValidators();
      detalleControl.setErrors(null);
      detalleControl.markAsUntouched();
      detalleControl.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.gastoForm.valid) {
      this.loading = true;
      const formData = {
        ...this.gastoForm.value,
        circulos_ids: [this.circuloId],
      };
      this.movimientosService.create(formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.gastoForm.reset({
              fecha: this.obtenerFechaLocal(),
            });
            this.limpiarSeleccion();
            this.limpiarValorFormateado();
            this.limitePorPagina = 10;
            this.hayMasRegistros = true;
            this.cargarGastos();
            this.cargarCuentas(); // Actualizar saldos
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error("Error creando gasto:", error);
          this.loading = false;
        },
      });
    }
  }

  eliminarGasto(id: number): void {
    if (confirm("¿Estás seguro de eliminar este gasto?")) {
      this.movimientosService.delete(id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cargarGastos();
            this.cargarCuentas(); // Actualizar saldos
          }
        },
        error: (error: any) => console.error("Error eliminando gasto:", error),
      });
    }
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);
  }

  get requiereDetalle(): boolean {
    return this.conceptoSeleccionado?.requiere_detalle || false;
  }

  validarTeclaNumero(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (
      [46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
      (charCode === 65 && event.ctrlKey === true) ||
      (charCode === 67 && event.ctrlKey === true) ||
      (charCode === 86 && event.ctrlKey === true) ||
      (charCode === 88 && event.ctrlKey === true)
    ) {
      return true;
    }
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  formatearValorInput(event: any): void {
    let valor = event.target.value.replace(/\D/g, "");
    if (valor === "") {
      this.valorFormateado = "";
      this.gastoForm.patchValue({ valor: "" });
      return;
    }
    this.valorFormateado = Number(valor).toLocaleString("es-CO");
    this.gastoForm.patchValue({ valor: Number(valor) }, { emitEvent: false });
  }

  limpiarValorFormateado(): void {
    this.valorFormateado = "";
  }

  abrirModalEditar(gasto: any): void {
    this.movimientoAEditar = { ...gasto };
    this.isModalEditarOpen = true;
  }

  cerrarModalEditar(): void {
    this.isModalEditarOpen = false;
    this.movimientoAEditar = null;
  }

  guardarCambios(formData: any): void {
    if (!this.movimientoAEditar) return;
    this.loading = true;
    this.movimientosService
      .update(this.movimientoAEditar.id, formData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cerrarModalEditar();
            this.limitePorPagina = 10;
            this.hayMasRegistros = true;
            this.cargarGastos();
            this.cargarCuentas(); // Actualizar saldos
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error("Error actualizando gasto:", error);
          this.loading = false;
        },
      });
  }
}
