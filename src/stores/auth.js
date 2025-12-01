// ======================================================================
// auth.js — Store de autenticación (Pinia + PocketBase)
// ----------------------------------------------------------------------
// Objetivo de este módulo
// - Gestionar el estado global de autenticación de usuario.
// - Conectar con PocketBase para login, logout, registro y recuperación.
// - Exponer propiedades reactivas (user, token, loading, error).
// - Simplificar el control de sesión en toda la aplicación.
// ======================================================================

import { defineStore } from 'pinia';
import { pb } from '../services/pb.js';

// --------------------------------------
// Definición del store de autenticación
// --------------------------------------
// Este store gestiona el usuario autenticado y su token.
// Se sincroniza con `pb.authStore` (manejador interno de PocketBase).
export const useAuthStore = defineStore('auth', {
  // ----------------------------------------------
  // Estado reactivo del store
  // ----------------------------------------------
  state: () => ({
    user: pb.authStore.model || null,   // Usuario actual (si hay sesión activa)
    token: pb.authStore.token || null,  // Token JWT de autenticación
    loading: false,                     // Estado de carga (mientras se procesa)
    error: null                         // Mensaje de error (si falla una acción)
  }),

  // -----------------------------
  // Getters derivados del estado
  // -----------------------------
  getters: {
    // Devuelve true si hay token válido → usuario autenticado
    isAuthenticated(state) {
      return !!state.token;
    }
  },

  // ------------------------------------------
  // Acciones (login, logout, register, reset)
  // ------------------------------------------
  actions: {

    // ----------------------------------------------
    // Iniciar sesión con email/usuario y contraseña
    // ----------------------------------------------
    /**
     * Autentica un usuario con las credenciales dadas.
     * Guarda en el store el modelo y token de PocketBase.
     * Lanza el error al componente que invoca si algo falla.
     * @param {string} identity Email o nombre de usuario
     * @param {string} password Contraseña del usuario
     */
    async login(identity, password) {
      this.loading = true;
      this.error = null;
      try {
        await pb.collection('users').authWithPassword(identity, password);
        // Persistir usuario y token en el store tras éxito
        this.user = pb.authStore.model;
        this.token = pb.authStore.token;
      } catch (err) {
        this.error = err?.message || 'Error de autenticación';
        throw err; // Propaga el error para manejo en el componente
      } finally {
        this.loading = false;
      }
    },

    // --------------
    // Cerrar sesión
    // --------------
    /**
     * Limpia la sesión actual y elimina credenciales guardadas.
     * Equivale a un "logout" completo.
     */
    logout() {
      pb.authStore.clear();
      this.user = null;
      this.token = null;
    },

    // ---------------------------
    // Registrar un nuevo usuario
    // ---------------------------
    /**
     * Registra un nuevo usuario en la colección 'users'.
     * PocketBase requiere confirmación de contraseña.
     * (El componente puede llamar a login() tras el registro.)
     * @param {Object} data { username, email, password, passwordConfirm }
     */
    async register(data) {
      this.loading = true;
      this.error = null;
      try {
        // data debe ser un objeto: { username, email, password, passwordConfirm, name }
        const record = await pb.collection('users').create(data);
        console.log("✅ Usuario creado:", record);
        return record;
      } catch (err) {
        console.error("❌ Error Registro:", err);
        
        // MAGIA AQUÍ: Extraer el mensaje real de PocketBase
        if (err.data && err.data.data) {
            // Junta todos los errores de validación en un texto legible
            const details = Object.entries(err.data.data)
                .map(([field, error]) => `${field}: ${error.message}`)
                .join(' | ');
            this.error = details;
        } else {
            this.error = err.message || 'Error desconocido al registrar';
        }
        
        // Lanzamos el error con el mensaje detallado
        throw new Error(this.error);
      } finally {
        this.loading = false;
      }
    },

    // -----------------------------------------
    // Solicitar restablecimiento de contraseña
    // -----------------------------------------
    /**
     * Envía un email con enlace de reseteo de contraseña.
     * (Usa el sistema de plantillas de PocketBase.)
     * @param {string} email Correo electrónico del usuario
     */
    async requestPasswordReset(email) {
      await pb.collection('users').requestPasswordReset(email);
      return true;
    },

    // ----------------------------------------------
    // CAMBIAR CONTRASEÑA (Mejorado para ver errores)
    // ----------------------------------------------
    async updatePassword(oldPassword, newPassword, newPasswordConfirm) {
        this.loading = true;
        try {
            await pb.collection('users').update(this.user.id, {
                oldPassword: oldPassword,
                password: newPassword,
                passwordConfirm: newPasswordConfirm
            });
            console.log("✅ Contraseña actualizada correctamente");
        } catch (err) {
            console.error("Error cambiando password:", err);
            
            // 👇 AQUÍ ESTÁ LA MAGIA: Leemos el detalle del error
            let errorMessage = err.message || "Error al cambiar la contraseña";
            if (err.data && err.data.data) {
                // Junta los mensajes específicos (ej: "oldPassword: Invalid value")
                errorMessage = Object.entries(err.data.data)
                    .map(([key, val]) => `${key}: ${val.message}`)
                    .join('\n');
            }
            
            throw new Error(errorMessage);
        } finally {
            this.loading = false;
        }
    },

    // ----------------------------------------------
    // ELIMINAR CUENTA (Mejorado)
    // ----------------------------------------------
    async deleteAccount() {
        this.loading = true;
        try {
            await pb.collection('users').delete(this.user.id);
            this.logout();
            console.log("💀 Cuenta eliminada");
        } catch (err) {
            console.error("Error eliminando cuenta:", err);
            // Los errores de delete suelen ser de permisos (403)
            throw new Error(err.message || "No se pudo eliminar la cuenta. Revisa permisos.");
        } finally {
            this.loading = false;
        }
    }
  }
});
