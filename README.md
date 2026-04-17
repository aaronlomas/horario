# Horario Galaxy

Un gestor de horarios optimizado para dispositivos móviles, desarrollado con React, Vite y Tailwind CSS. Este proyecto permite gestionar materias, horarios de clases y recibir notificaciones locales de alerta antes de cada sesión.

## Características

- 📅 **Gestión de Materias**: CRUD completo de asignaturas con personalización de colores.
- ⏰ **Horario Detallado**: Visualización por días de la semana con soporte para formato 12h/24h.
- 🔔 **Sistema de Alertas**: Notificaciones locales para avisar 15 minutos antes de que empiece una clase.
- 📱 **Diseño Responsive**: Optimizado especialmente para visualización en dispositivos Samsung Galaxy A05 y similares.
- 💾 **Persistencia**: Los datos se guardan en el almacenamiento local del navegador (`localStorage`).
- 📤 **Importar/Exportar**: Permite realizar respaldos de tu horario en formato JSON.

## Instalación y Ejecución

**Requisitos:** Node.js (versión 18 o superior)

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/usuario/horario-galaxy.git
   cd horario-galaxy
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Construir para producción:**
   ```bash
   npm run build
   ```

Este proyecto no requiere de una base de datos externa ni claves de API, funciona totalmente de forma local en el navegador.

