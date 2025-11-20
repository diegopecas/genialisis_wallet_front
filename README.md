# 🚀 CIRCLE FINANCE - FRONTEND ANGULAR

Frontend de Circle Finance desarrollado en Angular 17+ con Standalone Components.

---

## 📋 Requisitos

- Node.js 18+ 
- npm 9+
- Angular CLI 17+

---

## 🔧 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar URL del Backend

Editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9999'  // Tu backend PHP
};
```

### 3. Iniciar servidor de desarrollo

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en: `http://localhost:4200`

---

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- Login con email/password
- JWT persistente en localStorage
- Guard para proteger rutas
- Interceptor HTTP para agregar token automáticamente
- Sesión siempre activa (30 días)

### ✅ Ingresos
- Formulario reactivo con validaciones
- Selección de conceptos visuales (radio buttons)
- Campo detalle condicional (si concepto lo requiere)
- Listado de últimos 10 ingresos
- Eliminar ingresos con confirmación

### ✅ Gastos
- Formulario reactivo con validaciones
- Selección de conceptos visuales
- Campo detalle condicional
- Listado de últimos 10 gastos
- Eliminar gastos con confirmación

### ✅ Balance
- Filtros por año y mes
- Cards de resumen (Ingresos, Gastos, Balance Neto)
- Gráfico de evolución mensual (Chart.js)
- Detalle por concepto (ingresos y gastos separados)

---

## 📁 Estructura del Proyecto

```
src/app/
├── core/
│   ├── services/
│   │   ├── api.service.ts              # Servicio base HTTP
│   │   ├── auth.service.ts             # Autenticación y JWT
│   │   ├── conceptos.service.ts        # Gestión de conceptos
│   │   └── movimientos.service.ts      # CRUD movimientos
│   ├── guards/
│   │   └── auth.guard.ts               # Protección de rutas
│   ├── interceptors/
│   │   └── auth.interceptor.ts         # Interceptor JWT
│   └── models/
│       ├── usuario.model.ts
│       ├── concepto.model.ts
│       └── movimiento.model.ts
├── features/
│   ├── login/
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.scss
│   ├── ingresos/
│   │   ├── ingresos.component.ts
│   │   ├── ingresos.component.html
│   │   └── ingresos.component.scss
│   ├── gastos/
│   │   ├── gastos.component.ts
│   │   ├── gastos.component.html
│   │   └── gastos.component.scss
│   └── balance/
│       ├── balance.component.ts
│       ├── balance.component.html
│       └── balance.component.scss
├── app.component.ts                    # Componente principal
├── app.config.ts                       # Configuración app
└── app.routes.ts                       # Rutas
```

---

## 🎨 Diseño

El diseño replica **exactamente** el prototipo HTML proporcionado:

- ✅ Variables CSS del prototipo
- ✅ Fuente Inter (Google Fonts)
- ✅ Mismos colores y gradientes
- ✅ Animaciones (fadeIn, slideIn)
- ✅ Cards con sombras
- ✅ Formularios con estilos visuales
- ✅ Header con gradiente naranja
- ✅ Tabs sticky

---

## 🔑 Credenciales de Prueba

**Usuario:**
- Email: `diego@lumen.com`
- Password: `123456`

---

## 📱 INSTALAR COMO APP MÓVIL (PWA)

Circle Finance puede instalarse como una app nativa en tu celular.

**Ver guía completa**: [PWA-SETUP.md](PWA-SETUP.md)

### Pasos rápidos:

1. Generar iconos (ver `src/assets/icons/README.md`)
2. Build: `ng build --configuration production`
3. Desplegar en servidor con HTTPS (Firebase/Netlify/Vercel)
4. Abrir en celular y seleccionar "Instalar app"

✅ La app funcionará como nativa con icono en pantalla de inicio!

---

## 📦 Dependencias Principales

```json
{
  "@angular/core": "^17.3.0",
  "@angular/router": "^17.3.0",
  "@angular/forms": "^17.3.0",
  "chart.js": "^4.4.0",
  "ng2-charts": "^6.0.1"
}
```

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm start               # Inicia servidor en http://localhost:4200

# Build
npm run build           # Build de producción en /dist

# Watch
npm run watch           # Build con watch mode
```

---

## 🔄 Flujo de la Aplicación

1. **Login** → Usuario ingresa credenciales
2. **Autenticación** → Backend valida y retorna JWT
3. **Almacenamiento** → Token se guarda en localStorage
4. **Navegación** → Guard protege rutas principales
5. **Peticiones** → Interceptor agrega token automáticamente
6. **Operaciones** → CRUD de movimientos con validaciones
7. **Visualización** → Balance y gráficos con Chart.js

---

## 🐛 Debugging

### Ver requests HTTP en consola

```typescript
// En cualquier componente
console.log('Response:', response);
```

### Verificar token JWT

```typescript
// En consola del navegador
localStorage.getItem('circle_finance_token');
```

### Limpiar sesión

```typescript
// En consola del navegador
localStorage.clear();
```

---

## ⚙️ Configuración Avanzada

### Cambiar puerto de desarrollo

```bash
ng serve --port 4300


```

### Build de producción

```bash
ng build --configuration production
```

Los archivos se generan en `/dist/circle-finance-front/`
npx http-server dist/circle-finance-front -p 4300
---

## 📊 Integración con Backend

El frontend consume los siguientes endpoints del backend PHP:

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/auth/login` | POST | Login |
| `/auth/me` | GET | Validar token |
| `/conceptos` | GET | Obtener conceptos |
| `/movimientos` | POST | Crear movimiento |
| `/movimientos` | GET | Listar movimientos |
| `/movimientos/{id}` | DELETE | Eliminar movimiento |
| `/movimientos/balance` | GET | Balance total |
| `/movimientos/balance/detalle` | GET | Balance por concepto |
| `/movimientos/evolucion` | GET | Evolución mensual |

---

## ✅ Checklist de Implementación Fase 1

- [x] Login con JWT
- [x] Sesión persistente (localStorage)
- [x] Guard de autenticación
- [x] Interceptor HTTP
- [x] Formulario de ingresos
- [x] Formulario de gastos
- [x] Listado de movimientos
- [x] Eliminar movimientos
- [x] Balance con filtros
- [x] Gráfico Chart.js
- [x] Detalle por concepto
- [x] Estilos del prototipo HTML
- [x] Responsive design

---

## 🎯 Próximos Pasos (Fases Futuras)

- ❌ Asistente IA (Fase 2)
- ❌ Configuración de círculos (Fase 2)
- ❌ Gestión de usuarios en círculos (Fase 2)
- ❌ Gestión de categorías y conceptos (Fase 2)

---

## 📞 Soporte

Para problemas o dudas:
1. Verificar que el backend esté corriendo
2. Verificar la URL del backend en `environment.ts`
3. Revisar la consola del navegador (F12)
4. Verificar que el usuario existe en la BD

---

**¡Frontend Angular listo para usar! 🎉**


## Estructurq
tree src /F > estructura_apps.txt
