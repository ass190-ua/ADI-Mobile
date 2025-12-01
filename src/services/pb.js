// ========================================================================
// pb.js — Configuración central de PocketBase
// ------------------------------------------------------------------------
// Objetivo de este archivo
// - Crear una única instancia (singleton) del cliente PocketBase.
// - Definir la URL base del backend, configurable vía variable de entorno.
// - Permitir que cualquier parte de la app (stores, composables, views)
//   use la misma conexión sin duplicar configuración.
// ========================================================================
import PocketBase from 'pocketbase';

// -----------------------------------------------------------------------
// Determinar la URL base del servidor PocketBase
// -----------------------------------------------------------------------
// - Se usa la variable VITE_PB_URL definida en .env (si existe).
// - Si no está definida, se asume un entorno local en 127.0.0.1:8090.
// - Esto permite que el mismo código funcione en desarrollo y despliegue.
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://4.251.193.99';
// -----------------------------------------------------------------------
// Instancia única de PocketBase
// -----------------------------------------------------------------------
// - Se exporta directamente para reutilizarla globalmente.
// - PocketBase maneja internamente autenticación, colecciones y archivos.
// - Evita crear múltiples conexiones innecesarias.
export const pb = new PocketBase(pbUrl);
