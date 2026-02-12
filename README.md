# Vumies - Plataforma de Streaming

Vumies es una plataforma moderna de streaming construida con Vue 3, TypeScript, Vite y Tailwind CSS. Integra las APIs de TMDB y Vimeus para proporcionar una experiencia completa de visualización de películas, series y anime.

## 🚀 Características

- ✨ **Interfaz Moderna**: Diseño limpio con Tailwind CSS y efectos glassmorphism
- 🎬 **Películas y Series**: Catálogo completo con TMDB
- 📺 **Reproductor Integrado**: Streaming mediante Vimeus
- 🔍 **Búsqueda Avanzada**: Busca contenido en tiempo real
- ❤️ **Favoritos**: Guarda tu contenido preferido (localStorage)
- 📱 **Responsive**: Optimizado para móviles, tablets y desktop
- ⚡ **Rápido**: Construido con Vite para máximo rendimiento
- 🎯 **TypeScript**: Totalmente tipado para mayor seguridad

## 📦 Tecnologías

- **Vue 3** - Framework progresivo
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultrarrápido
- **Vue Router** - Navegación SPA
- **Pinia** - State management
- **Tailwind CSS** - Utility-first CSS
- **Axios** - Cliente HTTP
- **TMDB API** - Base de datos de películas
- **Vimeus API** - Reproductor de contenido

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus API keys
# VITE_TMDB_BEARER_TOKEN=tu_token_tmdb
# VITE_VIMEUS_VIEW_KEY=tu_view_key
# VITE_TMDB_API_KEY=tu_api_key

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview build
npm run preview
```

## 📁 Estructura del Proyecto

```
Vumies/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── composables/     # Lógica reutilizable (hooks)
│   ├── config/          # Configuración de APIs
│   ├── router/          # Rutas de la aplicación
│   ├── services/        # Servicios de API (TMDB, Vimeus)
│   ├── stores/          # Pinia stores
│   ├── types/           # Tipos TypeScript
│   ├── views/           # Vistas/Páginas
│   ├── App.vue          # Componente raíz
│   ├── main.ts          # Punto de entrada
│   └── style.css        # Estilos globales
├── public/              # Archivos estáticos
├── .env                 # Variables de entorno
├── index.html           # HTML principal
├── package.json         # Dependencias
├── tailwind.config.js   # Configuración Tailwind
├── tsconfig.json        # Configuración TypeScript
└── vite.config.ts       # Configuración Vite
```

## 🎯 APIs Utilizadas

### TMDB (The Movie Database)
- Metadatos de películas y series
- Imágenes (posters, backdrops)
- Búsqueda y recomendaciones
- [Documentación TMDB](https://developers.themoviedb.org/)

### Vimeus
- Reproductor de contenido
- Soporte para películas, series y anime
- [Documentación Vimeus](https://vimeus.com/api-docs)

## 🌐 Rutas Principales

- `/` - Página principal
- `/movies` - Listado de películas
- `/movie/:id` - Detalle de película
- `/series` - Listado de series
- `/serie/:id` - Detalle de serie
- `/serie/:id/season/:season/episode/:episode` - Reproductor de episodios
- `/search` - Búsqueda
- `/favorites` - Favoritos del usuario

## 🎨 Paleta de Colores

- **Primary**: `#EE5E53` (Rojo coral)
- **Dark**: `#1D1D1D` (Negro profundo)
- **Accent**: Variaciones de gris y transparencias

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run type-check   # Verificar tipos
```

## 🔑 Variables de Entorno

Crea un archivo `.env` en la raíz con:

```env
VITE_TMDB_BEARER_TOKEN=tu_token_bearer_tmdb
VITE_VIMEUS_VIEW_KEY=tu_view_key_vimeus
VITE_TMDB_API_KEY=tu_api_key_tmdb
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con ❤️ usando Vue 3 y TypeScript

## 🙏 Agradecimientos

- TMDB por su increíble API
- Vimeus por el servicio de streaming
- La comunidad de Vue.js
