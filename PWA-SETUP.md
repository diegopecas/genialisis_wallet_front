# 📱 CIRCLE FINANCE - INSTALACIÓN COMO APP MÓVIL (PWA)

## 🎯 ¿Qué es una PWA?

Una **Progressive Web App (PWA)** permite usar Circle Finance como si fuera una app nativa:
- ✅ Icono en la pantalla de inicio
- ✅ Pantalla completa (sin barra del navegador)
- ✅ Funciona offline (caché inteligente)
- ✅ Notificaciones push (futuro)
- ✅ Actualizaciones automáticas

---

## 📋 REQUISITOS PREVIOS

### 1. Generar Iconos

Necesitas crear los iconos de la app. Sigue las instrucciones en:
```
src/assets/icons/README.md
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará `@angular/service-worker` automáticamente.

---

## 🏗️ BUILD DE PRODUCCIÓN

### 1. Build con Service Worker

```bash
ng build --configuration production
```

Esto genera:
- ✅ Archivos optimizados en `dist/`
- ✅ Service Worker (`ngsw-worker.js`)
- ✅ Manifest (`manifest.webmanifest`)

### 2. Verificar Archivos Generados

```bash
ls dist/circle-finance-front/
```

Deberías ver:
- `index.html`
- `ngsw-worker.js`
- `ngsw.json`
- `manifest.webmanifest`
- Carpeta `assets/`

---

## 🌐 DESPLEGAR CON HTTPS

⚠️ **IMPORTANTE**: Las PWA **requieren HTTPS** en producción.

### Opción 1: Firebase Hosting (Gratis + Fácil)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init hosting

# Configurar:
# - Public directory: dist/circle-finance-front
# - Single-page app: Yes
# - Overwrites: No

# Desplegar
firebase deploy
```

Tu app estará en: `https://tu-proyecto.web.app`

---

### Opción 2: Netlify (Gratis)

1. Ve a: https://www.netlify.com/
2. Arrastra la carpeta `dist/circle-finance-front/`
3. ¡Listo! Tendrás una URL como: `https://tu-app.netlify.app`

---

### Opción 3: Vercel (Gratis)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel --prod
```

---

### Opción 4: Tu Propio Servidor con HTTPS

Requisitos:
- Servidor con Apache/Nginx
- Certificado SSL (usa Let's Encrypt gratis)

```bash
# Copiar archivos
scp -r dist/circle-finance-front/* usuario@servidor:/var/www/html/

# Configurar HTTPS en Apache/Nginx
# (usa Certbot para SSL gratis)
```

---

## 📲 INSTALAR EN CELULAR

### Android (Chrome/Edge)

1. Abre `https://tu-dominio.com` en Chrome
2. Aparecerá un banner "Instalar app"
3. O toca **⋮** > **Instalar aplicación**
4. Acepta
5. ✅ ¡Icono aparece en tu pantalla de inicio!

### iPhone (Safari)

1. Abre `https://tu-dominio.com` en Safari
2. Toca el botón **Compartir** (📤)
3. Selecciona **"Añadir a pantalla de inicio"**
4. Confirma
5. ✅ ¡Icono aparece en tu pantalla de inicio!

---

## 🧪 PROBAR PWA LOCALMENTE

### Con http-server (Simple)

```bash
# Instalar http-server
npm install -g http-server

# Servir la carpeta dist con HTTPS
http-server dist/circle-finance-front -p 8080 -S -C cert.pem -K key.pem
```

### Con Angular CLI (Para pruebas)

```bash
# Instalar http-server global
npm install -g http-server

# Build
ng build --configuration production

# Servir
cd dist/circle-finance-front
http-server -p 8080
```

Abre: `http://localhost:8080`

⚠️ **Nota**: Sin HTTPS, algunas funciones PWA no funcionarán.

---

## ✅ VERIFICAR QUE FUNCIONA

### 1. Lighthouse (Chrome DevTools)

1. Abre tu app en Chrome
2. F12 > **Lighthouse**
3. Selecciona **"Progressive Web App"**
4. Click **"Generate report"**

Deberías ver:
- ✅ Installable
- ✅ PWA optimized
- ✅ Service Worker registered

### 2. Application Tab

1. F12 > **Application**
2. Verifica:
   - **Manifest**: Debe mostrar "Circle Finance"
   - **Service Workers**: Debe estar "activated"
   - **Cache Storage**: Debe tener archivos cacheados

---

## 🔄 ACTUALIZACIONES

### Cómo funcionan:

1. Usuario abre la app
2. Service Worker verifica si hay nueva versión
3. Descarga cambios en segundo plano
4. Notifica al usuario (opcional)
5. Usuario recarga → nueva versión activa

### Forzar actualización:

```typescript
// En app.component.ts (opcional)
import { SwUpdate } from '@angular/service-worker';

constructor(private swUpdate: SwUpdate) {
  this.swUpdate.versionUpdates.subscribe(event => {
    if (event.type === 'VERSION_READY') {
      if (confirm('Nueva versión disponible. ¿Actualizar?')) {
        window.location.reload();
      }
    }
  });
}
```

---

## 📊 CONFIGURACIÓN DEL SERVICE WORKER

La configuración está en `ngsw-config.json`:

- **App files**: Se cachean inmediatamente (prefetch)
- **Assets**: Se cachean cuando se usan (lazy)
- **API calls**: Cache de 1 hora con estrategia "freshness"

### Modificar estrategia:

```json
"strategy": "freshness"  // Intenta red primero
"strategy": "performance"  // Usa cache primero
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### PWA no se puede instalar

✅ Verifica:
- HTTPS habilitado
- Iconos en `assets/icons/`
- `manifest.webmanifest` accesible
- Service Worker registrado

### Service Worker no se activa

```bash
# Limpiar cache
ng build --configuration production --output-hashing=all

# O en Chrome:
# F12 > Application > Service Workers > Unregister
```

### Cambios no se reflejan

El Service Worker cachea agresivamente. Para desarrollo:

```bash
# Desactivar SW en desarrollo
ng serve --configuration development
```

O en Chrome:
- F12 > Application > Service Workers
- ✅ "Update on reload"

---

## 📝 CHECKLIST FINAL

- [ ] Iconos generados (8 tamaños)
- [ ] `npm install` ejecutado
- [ ] Build de producción creado
- [ ] App desplegada con HTTPS
- [ ] Lighthouse test pasado (90+ score)
- [ ] Instalada en tu celular
- [ ] Funciona offline básico
- [ ] Backend accesible desde celular

---

## 🎉 ¡LISTO!

Ahora Circle Finance:
- ✅ Se instala como app nativa
- ✅ Tiene icono en pantalla de inicio
- ✅ Funciona en modo standalone
- ✅ Cachea recursos importantes
- ✅ Se actualiza automáticamente

**¡Disfruta tu app móvil!** 📱💰
