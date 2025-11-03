# 📱 ICONOS PWA - CIRCLE FINANCE

## 🎨 Iconos Necesarios

Coloca los siguientes iconos en esta carpeta (`src/assets/icons/`):

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

---

## 🛠️ Cómo Generar los Iconos

### Opción 1: Online (Recomendado)

1. Ve a: https://realfavicongenerator.net/
2. Sube tu logo/icono principal (mínimo 512x512px)
3. Descarga el paquete completo
4. Copia los archivos PNG a esta carpeta

### Opción 2: Con Herramienta

```bash
# Instalar ImageMagick
sudo apt install imagemagick

# Generar todos los tamaños desde un icono base
convert icon-base.png -resize 72x72 icon-72x72.png
convert icon-base.png -resize 96x96 icon-96x96.png
convert icon-base.png -resize 128x128 icon-128x128.png
convert icon-base.png -resize 144x144 icon-144x144.png
convert icon-base.png -resize 152x152 icon-152x152.png
convert icon-base.png -resize 192x192 icon-192x192.png
convert icon-base.png -resize 384x384 icon-384x384.png
convert icon-base.png -resize 512x512 icon-512x512.png
```

### Opción 3: Placeholder Temporal

Si no tienes iconos listos, puedes usar este placeholder por ahora:

1. Crea un PNG simple de 512x512 con fondo naranja (#ff9800)
2. Agrega el texto "CF" en blanco
3. Genera todos los tamaños con la herramienta

---

## 🎨 Diseño Recomendado

**Colores:**
- Fondo: `#ff9800` (naranja Circle Finance)
- Texto/Icono: `#ffffff` (blanco)

**Sugerencias:**
- Logo circular
- Iniciales "CF" grandes y centradas
- O un icono de moneda/círculo

---

## ✅ Verificar

Después de agregar los iconos:

```bash
ls -lh src/assets/icons/
```

Deberías ver 8 archivos PNG.

---

**Nota**: Sin estos iconos la app seguirá funcionando, pero no se podrá "instalar" en el celular. Los iconos son necesarios solo para la experiencia PWA completa.
