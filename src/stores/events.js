// ======================================================================
// events.js — Store de eventos (Pinia + PocketBase)
// ----------------------------------------------------------------------
// Objetivo del módulo
// - Gestionar todas las operaciones CRUD de la colección 'events'.
// - Centralizar el estado de la lista de eventos y el evento actual.
// - Exponer acciones asíncronas para cargar, crear, actualizar y borrar.
// - Manejar errores y estado de carga global.
// ======================================================================

import { defineStore } from 'pinia';
import { pb } from '../services/pb.js';

export const useEventsStore = defineStore('events', {
  // -----------------------------------
  // Estado global del store de eventos
  // -----------------------------------
  state: () => ({
    events: [],         // Lista de eventos visibles
    currentEvent: null, // Evento seleccionado o en edición
    loading: false,     // Bandera de carga asíncrona
    error: null,        // Mensaje de error (si ocurre)
    totalPages: 0,      // Paginación: total de páginas
    currentPage: 1,     // Página actual cargada
  }),

  // -----------------------------------------
  // Acciones CRUD sobre la colección 'events'
  // -----------------------------------------
  actions: {
    // ----------------------------------
    // Obtener lista paginada de eventos
    // ----------------------------------
    /**
     * Carga una página de eventos desde PocketBase.
     * Admite parámetros opcionales de ordenación y filtro.
     * @param {number} page Número de página a obtener (por defecto 1)
     * @param {number} perPage Eventos por página (por defecto 10)
     * @param {Object} options { sort, filter } opciones de orden y filtro
     */
    async fetchEvents(page = 1, perPage = 10, options = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = {};
        if (options.sort) params.sort = options.sort;
        if (options.filter) params.filter = options.filter;

        const res = await pb.collection('events').getList(page, perPage, params);

        // Actualizar estado local
        this.events = res.items;
        this.totalPages = res.totalPages || 1;
        this.currentPage = page;
      } catch (err) {
        this.error = err?.message || 'Error al cargar eventos';
      } finally {
        this.loading = false;
      }
    },

    // ------------------------
    // Obtener un único evento
    // ------------------------
    /**
     * Carga un evento individual por su ID y lo marca como actual.
     * Permite pasar parámetros adicionales (expand, fields, etc.).
     * @param {string} id ID del evento
     * @param {Object} query Parámetros opcionales para la consulta
     */
    async fetchEvent(id, query = {}) {
      if (!id) return;
      this.loading = true;
      this.error = null;
      try {
        this.currentEvent = await pb.collection('events').getOne(id, query);
      } catch (err) {
        this.error = err?.message || 'Error al cargar el evento';
      } finally {
        this.loading = false;
      }
    },

    // -------------------
    // Crear nuevo evento
    // -------------------
    /**
     * Crea un nuevo evento. Admite objeto plano o FormData.
     * Si incluye archivos (ej. imágenes), usar FormData.
     * @param {Object|FormData} data Datos del evento
     */
    async createEvent(data) {
      this.loading = true;
      this.error = null;
      try {
        const created = await pb.collection('events').create(data);
        // Inserta el nuevo evento al inicio de la lista
        this.events.unshift(created);
      } catch (err) {
        this.error = err?.message || 'Error al crear el evento';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // ----------------------------
    // Actualizar evento existente
    // ----------------------------
    /**
     * Actualiza un evento existente (objeto plano o FormData).
     * Refresca tanto la lista como el evento actual si coincide.
     * @param {string} id ID del evento a actualizar
     * @param {Object|FormData} data Campos a modificar
     */
    async updateEvent(id, data) {
      if (!id) return;
      this.loading = true;
      this.error = null;
      try {
        const updated = await pb.collection('events').update(id, data);
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = updated;
        }
        const idx = this.events.findIndex(e => e.id === id);
        if (idx !== -1) this.events[idx] = updated;
      } catch (err) {
        this.error = err?.message || 'Error al actualizar el evento';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // ----------------
    // Eliminar evento
    // ----------------
    /**
     * Elimina un evento por ID y lo retira de la lista local.
     * @param {string} id ID del evento a eliminar
     */
    async deleteEvent(id) {
      if (!id) return;
      this.loading = true;
      this.error = null;
      try {
        await pb.collection('events').delete(id);
        this.events = this.events.filter(e => e.id !== id);
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = null;
        }
      } catch (err) {
        this.error = err?.message || 'Error al borrar el evento';
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
