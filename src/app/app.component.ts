/**
 * AppComponent
 * Componente principal con header, tabs y router
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Usuario, Circulo } from './core/models/usuario.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Circle Finance';
  currentUser: Usuario | null = null;
  currentCirculo: Circulo | null = null;
  activeTab = 'ingresos';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.currentCirculo = this.authService.getPrimerCirculo();
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
