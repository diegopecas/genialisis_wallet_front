/**
 * App Routes - ACTUALIZADO CON TRASLADOS
 * Configuración de rutas de la aplicación
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { IngresosComponent } from './features/ingresos/ingresos.component';
import { GastosComponent } from './features/gastos/gastos.component';
import { BalanceComponent } from './features/balance/balance.component';
import { TrasladosComponent } from './features/traslados/traslados.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'gastos',
        pathMatch: 'full'
      },
      {
        path: 'ingresos',
        component: IngresosComponent
      },
      {
        path: 'gastos',
        component: GastosComponent
      },
      {
        path: 'balance',
        component: BalanceComponent
      },
      {
        path: 'traslados',
        component: TrasladosComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];