# LiveTune MVP — Week 2 Radio Experience

LiveTune es una emisora web inteligente que descubre transmisiones musicales en vivo de YouTube y las presenta como estaciones curadas. Esta versión se enfoca en la experiencia inicial de radio: estaciones predefinidas, player inmersivo, cola de reproducción, favoritos, bloqueos e historial local.

## Funcionalidades incluidas

- Página principal de estaciones.
- Estaciones predefinidas con nombre, descripción, energía, tags y queries de búsqueda.
- Reproductor inmersivo usando `youtube-nocookie.com`.
- Búsqueda real usando YouTube Data API v3.
- Cola de transmisiones en vivo.
- Botón `Next station` y `Previous`.
- Botón `Refresh queue` / `New live results`.
- Favoritos por canal usando `localStorage`.
- Canales bloqueados usando `localStorage`.
- Opción `Live not working` para ocultar un resultado fallido durante la sesión.
- Historial local de reproducciones recientes.
- Filtro automático para no mostrar canales bloqueados en la cola.
- Manejo de errores si falta la API key o falla la búsqueda.
- Configuración lista para GitHub + Netlify.

## Estaciones incluidas

- Lo-Fi Focus Radio
- Deep Work Instrumental
- Jazz Coffee Radio
- Ambient Calm Station
- Synthwave Night Drive
- Piano Study Room
- Sacred Ambient Radio
- Latin Chill Live

Cada estación está definida en:

```text
src/lib/stations.ts
```

Puedes modificar nombres, descripciones, tags y queries desde ese archivo.

## Stack

- Next.js 14
- React 18
- TypeScript
- CSS global
- YouTube Data API v3
- Netlify

## Estructura principal

```text
src/
  app/
    api/youtube/live/route.ts   # Backend route que consulta YouTube Data API
    globals.css                 # Estilos globales
    layout.tsx
    page.tsx
  components/
    StationApp.tsx              # UI principal de la radio
  lib/
    stations.ts                 # Estaciones predefinidas y queries
    types.ts                    # Tipos compartidos
```

## Ejecutar localmente

1. Instalar dependencias:

```bash
npm install
```

2. Crear el archivo local de variables:

```bash
cp .env.example .env.local
```

3. Agregar tu API key de YouTube:

```bash
YOUTUBE_API_KEY=your_youtube_data_api_key_here
```

4. Correr el proyecto:

```bash
npm run dev
```

5. Abrir:

```bash
http://localhost:3000
```

## Variables de entorno necesarias

En local debes crear `.env.local`.

En Netlify debes configurar esta variable en:

```text
Site configuration → Environment variables
```

```bash
YOUTUBE_API_KEY=your_youtube_data_api_key_here
```

No uses `NEXT_PUBLIC_YOUTUBE_API_KEY`, porque expondría la llave en el navegador.

## Deploy en Netlify

Configuración incluida en `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
```

Pasos:

1. Sube este proyecto a GitHub.
2. Entra a Netlify.
3. Selecciona `Add new site` → `Import an existing project`.
4. Conecta GitHub.
5. Selecciona el repositorio.
6. Build command: `npm run build`.
7. Publish directory: `.next`.
8. Agrega `YOUTUBE_API_KEY` en Environment variables.
9. Deploy.

## Notas sobre YouTube

La ruta backend usa:

- `type=video`
- `eventType=live`
- `videoEmbeddable=true`
- `videoSyndicated=true`
- `safeSearch=moderate`

El MVP no extrae audio ni crea un stream propio. Solo muestra transmisiones usando el embed oficial de YouTube.

## Limitaciones conocidas

- Algunas transmisiones pueden fallar al reproducirse aunque aparezcan en búsqueda.
- El botón `Live not working` oculta el resultado fallido solo durante la sesión actual.
- Favoritos, bloqueos e historial viven en `localStorage`; todavía no hay login ni sincronización entre dispositivos.
- YouTube puede bloquear autoplay con sonido hasta que el usuario interactúe con la página.
- La cuota de YouTube Data API puede agotarse si se refresca la cola muchas veces.

## Próximos pasos sugeridos

- Agregar cache por estación para reducir consumo de cuota.
- Persistir favoritos, bloqueos e historial en Supabase.
- Crear login de usuario.
- Agregar scoring por canal según favoritos, skips y bloqueos.
- Agregar vista compacta tipo `Lean Back Mode`.
- Crear jobs programados para refrescar resultados por estación.
