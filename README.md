# Memories+ (Ionic App)

Aplicación móvil híbrida desarrollada con **Ionic 7** y **Vue 3** para la asignatura de Aplicaciones Distribuidas en Internet (ADI).

Esta aplicación permite a los usuarios gestionar eventos, almacenar fotos y comunicarse en tiempo real mediante un chat integrado.

## 📱 Tecnologías Utilizadas

* **Frontend:** Ionic Framework + Vue 3 (Composition API)
* **Gestión de Estado:** Pinia
* **Backend:** PocketBase (BaaS)
* **Lenguaje:** JavaScript / TypeScript
* **Build Tool:** Vite

## ✨ Funcionalidades Implementadas

### 1. Autenticación y Perfil
* **Login y Registro:** Validación de errores nativa y gestión de sesión persistente.
* **Gestión de Perfil:**
    * Edición de nombre y usuario.
    * Subida de Avatar (con gestión de errores de carga).
    * Cambio de contraseña "In-App" (sin correos).
    * **Eliminar Cuenta:** Con confirmación de seguridad y borrado en cascada.

### 2. Eventos (CRUD Completo)
* Visualización de eventos en lista con filtros (Hoy, Semana, Próximos).
* Buscador integrado.
* Creación y Edición de eventos con subida de imágenes.
* Borrado de eventos propios.

### 3. Galería de Fotos
* Grid responsivo de imágenes.
* Subida de fotos mediante botón flotante (FAB).
* Selección múltiple para borrado masivo.
* Sistema de "Favoritos".

### 4. Chat en Tiempo Real 💬
* **Realtime:** Mensajería instantánea usando suscripciones de PocketBase.
* **Chats 1:1:** Búsqueda de usuarios y creación de chats privados.
* **Grupos:** Creación de grupos con múltiples participantes.
* **UI Avanzada:**
    * Modo Oscuro nativo.
    * Burbujas de chat estilo mensajería moderna.
    * Selector de Emojis integrado.
    * Avatares "Bulletproof" (si falla la imagen, muestra placeholder).

## 🚀 Instalación y Ejecución

### Requisitos previos
* Node.js (v18+)
* NPM
* PocketBase (ejecutable)

### 1. Configurar Backend (PocketBase)
Ejecuta el servidor de PocketBase en una terminal aparte:
```bash
./pocketbase serve