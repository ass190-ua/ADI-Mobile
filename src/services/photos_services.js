// ==========================================================================
// photos_service.js — Servicio de gestión de fotos (PocketBase)
// --------------------------------------------------------------------------
// Objetivo del módulo
// - Encapsular todas las operaciones relacionadas con la colección 'photos'.
// - Centralizar lógica de subida, listado, borrado y favoritos.
// - Simplificar el acceso a URLs de archivos mediante PocketBase SDK.
// - Evitar duplicación de código en componentes.
// ==========================================================================

import { pb } from './pb.js';

// Nombre de la colección en PocketBase
const COLL = 'photos';

// Campos posibles que pueden contener el archivo en los registros
const FILE_FIELDS = ['field', 'image', 'file', 'photo', 'picture'];

// -----------------------------------------------------------
// Función auxiliar: detectar campo de archivo en el registro
// -----------------------------------------------------------
// - Devuelve el nombre del campo que contiene el archivo (si existe).
// - Si no encuentra ninguno, devuelve el primero del array FILE_FIELDS.
function fileFieldName(rec) {
  if (rec) for (const k of FILE_FIELDS) if (rec[k]) return k;
  return FILE_FIELDS[0];
}

// ------------------------------------------------
// Obtener URL de archivo almacenado en PocketBase
// ------------------------------------------------
// Parámetros:
// - rec: registro de la colección (objeto PocketBase record)
// - fileOrField: nombre del campo o directamente el nombre del archivo
// - thumb: tamaño o configuración de thumbnail opcional
// Devuelve:
// - URL pública (string) al archivo correspondiente.
export function fileUrl(rec, fileOrField, thumb) {
  if (!rec) return '';
  let filename = '';

  if (typeof fileOrField === 'string') {
    // Puede ser el nombre de campo o el nombre de archivo
    filename = rec[fileOrField] || fileOrField;
  } else {
    // Si se pasa un objeto registro, detectar campo de archivo automáticamente
    const k = fileFieldName(rec);
    filename = rec?.[k];
  }

  if (!filename) return '';

  // Construir opciones para thumbnail o vista reducida
  const opts = typeof thumb === 'string' ? { thumb } : (thumb || {});
  return pb.files.getUrl(rec, filename, opts);
}

// ---------------------------------------------------
// Listar fotos (con paginación y filtros opcionales)
// ---------------------------------------------------
// Parámetros opcionales:
// - page, perPage: control de paginación.
// - sort: orden de los resultados (por defecto '-created').
// - filter: expresión de filtrado de PocketBase.
export async function listPhotos({ page = 1, perPage = 24, sort = '-created', filter = '' } = {}) {
  return pb.collection(COLL).getList(page, perPage, { sort, filter });
}

// ---------------------
// Subir una nueva foto
// ---------------------
// - Crea un FormData con el archivo y campos opcionales.
// - Añade automáticamente el usuario autenticado si existe.
export async function uploadPhoto({ file, title = '', extra = {} }) {
  const fd = new FormData();

  // Añadir archivo principal (usa el primer campo FILE_FIELDS)
  fd.append(FILE_FIELDS[0], file, file.name);
  if (title) fd.append('title', title);

  // Asociar con el usuario autenticado (si existe)
  const uid = pb?.authStore?.model?.id;
  if (uid) fd.append('user', uid);

  // Añadir campos adicionales proporcionados en 'extra'
  for (const [k, v] of Object.entries(extra)) if (v != null) fd.append(k, v);

  // Crear registro en la colección
  return pb.collection(COLL).create(fd);
}

// --------------------------------------
// Eliminar una foto existente por su ID
// --------------------------------------
export async function deletePhoto(id) {
  return pb.collection(COLL).delete(id);
}

// -------------------------------------
// Alternar estado de favorito (toggle)
// -------------------------------------
// - Cambia el campo 'favourite' a su valor opuesto.
export async function toggleFavorite(id, isCurrentlyFavorite = false) {
  return pb.collection(COLL).update(id, { favourite: !isCurrentlyFavorite });
}
