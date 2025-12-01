// ===========================================================================
// chat.js — Store de chat (Pinia + PocketBase)
// ---------------------------------------------------------------------------
// Objetivo del módulo
// - Gestionar el subsistema de mensajería: amigos, solicitudes, 
//   conversaciones (privadas y de grupo) y mensajes.
// - Encapsular llamadas a PocketBase y exponer acciones simples
//   para usar desde las vistas FriendsView.vue y ChatsView.vue.
// - Mantener el estado reactivo (listas, mapa de mensajes, selección actual).
// ===========================================================================

import { defineStore } from 'pinia';
import { pb } from '../services/pb.js';
import { useAuthStore } from './auth.js';

// -----------------------------
// Definición del store de chat
// -----------------------------
export const useChatStore = defineStore('chat', {
  // -----------------------
  // Estado global del chat
  // -----------------------
  state: () => ({
    /** Lista de usuarios amigos (solicitudes aceptadas) */
    friends: [],

    /** Solicitudes de amistad pendientes dirigidas al usuario actual */
    friendRequests: [],

    /** Conversaciones en las que participa el usuario (privadas o grupo) */
    conversations: [],

    /**
     * Mapa: conversationId → array de mensajes
     * Cada mensaje trae expand.sender con los datos del usuario (si aplica).
     */
    messages: {},

    /** ID de la conversación seleccionada actualmente */
    currentConversationId: null,

    /** Flag de carga para operaciones asíncronas */
    loading: false,

    /** Último mensaje de error (si ocurre) */
    error: null,
  }),

  // --------------------------------------
  // Acciones (fetch/mutate en PocketBase)
  // --------------------------------------
  actions: {
    // ---------------------------------------------
    // Amigos: obtener lista de amistades aceptadas
    // ---------------------------------------------
    /**
     * Carga todas las amistades del usuario actual.
     * Las amistades se representan como registros en 'friend_requests' con status="accepted".
     */
    async fetchFriends() {
      const auth = useAuthStore();
      const userId = auth.user?.id;
      if (!userId) return;
      try {
        const records = await pb.collection('friend_requests').getFullList({
          filter: `(sender="${userId}" && status="accepted") || (recipient="${userId}" && status="accepted")`,
          expand: 'sender,recipient',
        });

        // Para cada registro, toma el "otro" usuario como amigo
        this.friends = records.map((r) => {
          const friend = r.sender === userId ? r.expand?.recipient : r.expand?.sender;
          return friend;
        });
      } catch (err) {
        console.error('Error fetching friends:', err);
        this.error = 'Error obteniendo amigos';
      }
    },

    // --------------------------------------
    // Buscar usuarios (apoyo a FriendsView)
    // --------------------------------------
    /**
     * Busca usuarios por nombre, username o email.
     * Intenta primero con usuarios verificados y, si no hay resultados, relaja el filtro.
     * CORREGIDO: Se añade 'collectionId' a los fields para poder generar la URL del avatar.
     */
    async searchUsers(q, page = 1, perPage = 10) {
      const meId = pb.authStore.model?.id || '';
      const safe = (q || '').replace(/"/g, '\\"').trim();

      // Constructor de filtros (opcionalmente exige verified=true)
      const buildFilter = (requireVerified) => {
        const parts = [];
        if (meId) parts.push(`id != "${meId}"`); // Excluye al propio usuario
        if (requireVerified) parts.push('verified = true');
        if (safe) parts.push(`(name ?~ "${safe}" || username ?~ "${safe}" || email ?~ "${safe}")`);
        return parts.join(' && ') || 'true';
      };

      // 1) Estricto: solo verificados
      let filter = buildFilter(true);
      let res = await pb.collection('users').getList(page, perPage, {
        filter,
        sort: 'name,username',
        // CORRECCIÓN: Añadido collectionId
        fields: 'id,collectionId,name,username,avatar,email,emailVisibility,verified,created',
      });

      // 2) Fallback: sin "verified=true" si no hubo resultados
      if (res.totalItems === 0 && safe) {
        filter = buildFilter(false);
        res = await pb.collection('users').getList(page, perPage, {
          filter,
          sort: 'name,username',
          // CORRECCIÓN: Añadido collectionId
          fields: 'id,collectionId,name,username,avatar,email,emailVisibility,verified,created',
        });
      }

      return {
        items: res.items,
        page: res.page,
        perPage: res.perPage,
        totalItems: res.totalItems,
        totalPages: res.totalPages,
      };
    },

    // ------------------------------------
    // Solicitudes de amistad (pendientes)
    // ------------------------------------
    /**
     * Obtiene las solicitudes de amistad PENDIENTES dirigidas al usuario.
     */
    async fetchFriendRequests() {
      const auth = useAuthStore();
      const userId = auth.user?.id;
      if (!userId) return;
      try {
        const records = await pb.collection('friend_requests').getFullList({
          filter: `recipient="${userId}" && status="pending"`,
          expand: 'sender',
        });
        this.friendRequests = records;
      } catch (err) {
        console.error('Error fetching friend requests:', err);
        this.error = 'Error obteniendo solicitudes';
      }
    },

    // ----------------------------
    // Enviar solicitud de amistad
    // ----------------------------
    /**
     * Envía una solicitud de amistad por ID de usuario o por username.
     * Evita duplicados comprobando si ya existe relación/solicitud.
     * @param {string} userIdOrUsername ID o username del destinatario
     */
    async sendFriendRequest(userIdOrUsername) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;
      try {
        // Resolver ID de destinatario
        let recipientId = null;
        // Heurística: IDs alfanuméricos de 15 chars (ajustar si tu PB usa otra longitud)
        if (/^[a-zA-Z0-9]{15}$/.test(userIdOrUsername)) {
          recipientId = userIdOrUsername;
        } else {
          const target = await pb.collection('users').getFirstListItem(`username="${userIdOrUsername}"`);
          recipientId = target.id;
        }

        // Comprobar si ya existe solicitud/amistad en cualquier sentido
        const existing = await pb
          .collection('friend_requests')
          .getFirstListItem(
            `(sender="${myId}" && recipient="${recipientId}") || (sender="${recipientId}" && recipient="${myId}")`,
            { $autoCancel: false },
          )
          .catch(() => null);
        if (existing) throw new Error('Ya existe una solicitud o amistad con este usuario.');

        // Crear solicitud pendient
        await pb.collection('friend_requests').create({
          sender: myId,
          recipient: recipientId,
          status: 'pending',
        });

        // Refrescar bandeja de solicitudes
        await this.fetchFriendRequests();
      } catch (err) {
        console.error('Error sending friend request:', err);
        this.error = err?.message || 'Error enviando solicitud';
      }
    },

    // ----------------------------------------
    // Aceptar / Rechazar solicitud de amistad
    // ----------------------------------------
    /**
     * Actualiza el estado de una solicitud (accepted/rejected) y refresca listas.
     * @param {string} requestId ID del registro en 'friend_requests'
     * @param {boolean} accept true → aceptar | false → rechazar
     */
    async respondFriendRequest(requestId, accept = true) {
      try {
        await pb.collection('friend_requests').update(requestId, {
          status: accept ? 'accepted' : 'rejected',
        });
        await this.fetchFriendRequests();
        if (accept) await this.fetchFriends();
      } catch (err) {
        console.error('Error responding to friend request:', err);
        this.error = 'Error actualizando solicitud';
      }
    },

    // ------------------------
    // Conversaciones: listado
    // ------------------------
    /**
     * Carga todas las conversaciones en las que participa el usuario actual.
     */
    async fetchConversations() {
      const auth = useAuthStore();
      const userId = auth.user?.id;
      if (!userId) return;
      this.loading = true;
      try {
        const convos = await pb.collection('conversations').getFullList({
          filter: `participants ~ "${userId}"`,
          expand: 'participants',
        });
        this.conversations = convos;
      } catch (err) {
        console.error('Error fetching conversations:', err);
        this.error = 'Error obteniendo conversaciones';
      } finally {
        this.loading = false;
      }
    },

    // ---------------------------
    // Crear conversación privada (CORREGIDO: Sin duplicados + Expand)
    // ---------------------------
    /**
     * Crea una conversación 1:1 con un amigo y la selecciona como actual.
     * Si ya existe, reutiliza la existente.
     * @param {string} friendId ID del amigo
     */
    async createConversationWith(friendId) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;

      // 1. BÚSQUEDA LOCAL: Primero miramos si ya la tenemos cargada en memoria
      const existingLocal = this.conversations.find(c => 
        !c.isGroup && c.participants.includes(myId) && c.participants.includes(friendId)
      );

      if (existingLocal) {
        this.currentConversationId = existingLocal.id;
        return; // ¡Ya existía! No creamos nada.
      }

      try {
        // 2. BÚSQUEDA EN SERVIDOR: Por si acaso no la teníamos cargada
        // CORRECCIÓN: Añadido expand='participants' para que venga la foto
        const existingRemoteList = await pb.collection('conversations').getList(1, 1, {
            filter: `isGroup=false && participants ~ "${myId}" && participants ~ "${friendId}"`,
            expand: 'participants' 
        });

        if (existingRemoteList.items.length > 0) {
            const existing = existingRemoteList.items[0];
            // La añadimos a local si no estaba
            if (!this.conversations.find(c => c.id === existing.id)) {
                this.conversations.unshift(existing);
            }
            this.currentConversationId = existing.id;
            if (!this.messages[existing.id]) this.messages[existing.id] = [];
            return;
        }

        // 3. CREACIÓN: Si no existe, creamos.
        // CORRECCIÓN: Añadido { expand: 'participants' } en el create
        const convo = await pb.collection('conversations').create(
          {
            isGroup: false,
            name: '',
            participants: [myId, friendId],
          },
          { expand: 'participants' }
        );
        
        this.conversations.unshift(convo); // Añadir al principio
        this.currentConversationId = convo.id;
        this.messages[convo.id] = [];
      } catch (err) {
        console.error('Error creating conversation:', err);
        this.error = 'Error creando conversación';
      }
    },

    // ----------------------------
    // Crear conversación de grupo
    // ----------------------------
    /**
     * Crea un grupo con nombre y participantes; añade al usuario actual si falta.
     * Selecciona el nuevo grupo como conversación activa.
     * @param {string} name Nombre del grupo
     * @param {string[]} participantIds IDs de usuarios participantes
     */
    async createGroupConversation(name, participantIds) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;

      // Garantiza que el creador está incluido en participants
      const ids = participantIds.includes(myId) ? participantIds : [...participantIds, myId];
      try {
        // CORRECCIÓN: Añadido { expand: 'participants' }
        const convo = await pb.collection('conversations').create(
          {
            isGroup: true,
            name,
            participants: ids,
          },
          { expand: 'participants' }
        );
        
        this.conversations.unshift(convo);
        this.currentConversationId = convo.id;
        this.messages[convo.id] = [];
      } catch (err) {
        console.error('Error creating group conversation:', err);
        this.error = 'Error creando grupo';
      }
    },

    // -----------------------------------
    // Mensajes: listado por conversación
    // -----------------------------------
    /**
     * Carga todos los mensajes de una conversación.
     * Incluye expand del remitente para pintar nombres/avatares.
     * @param {string} conversationId ID de la conversación
     */
    async fetchMessages(conversationId) {
      if (!conversationId) return;
      this.loading = true;
      try {
        const msgs = await pb.collection('messages').getFullList({
          filter: `conversation="${conversationId}"`,
          sort: 'created',
          expand: 'sender',
        });
        this.messages[conversationId] = msgs;
      } catch (err) {
        console.error('Error fetching messages:', err);
        this.error = 'Error obteniendo mensajes';
      } finally {
        this.loading = false;
      }
    },

    // ------------------------
    // Enviar mensaje de texto
    // ------------------------
    /**
     * Envía un mensaje y lo añade al estado local tras el éxito.
     * @param {string} conversationId ID de la conversación destino
     * @param {string} content Texto del mensaje
     */
    async sendMessage(conversationId, content) {
      const auth = useAuthStore();
      const myId = auth.user?.id;
      if (!myId) return;
      try {
        const msg = await pb.collection('messages').create({
          conversation: conversationId,
          sender: myId,
          content,
        });
        // Asegurar expand.sender para una UI consistente sin refetch
        msg.expand = { sender: auth.user };
        if (!this.messages[conversationId]) this.messages[conversationId] = [];
        this.messages[conversationId].push(msg);
      } catch (err) {
        console.error('Error sending message:', err);
        this.error = 'Error enviando mensaje';
      }
    },

    // ---------------------------------------------
    // Suscripción en tiempo real (mensajes nuevos)
    // ---------------------------------------------
    /**
     * Se suscribe a mensajes de una conversación y va anexando los nuevos.
     * @param {string} conversationId Conversación a escuchar
     */
    async subscribeToConversation(conversationId) {
      const self = this;
      await pb.collection('messages').subscribe(
        (data) => {
          const record = data.record;
          if (record.conversation === conversationId) {
            if (!self.messages[conversationId]) self.messages[conversationId] = [];
            self.messages[conversationId].push(record);
          }
        },
        { filter: `conversation="${conversationId}"` },
      );
    },

    // --------------------------------
    // Cancelar suscripciones realtime
    // --------------------------------
    /**
     * Cancela todas las suscripciones activas a la colección 'messages'.
     */
    async unsubscribeFromConversation() {
      pb.collection('messages').unsubscribe();
    },
  },
});
