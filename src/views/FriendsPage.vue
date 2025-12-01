<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/chats"></ion-back-button>
        </ion-buttons>
        <ion-title>Amigos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      
      <ion-segment v-model="segment" class="ion-margin-bottom">
        <ion-segment-button value="search">
          <ion-label>Buscar</ion-label>
        </ion-segment-button>
        <ion-segment-button value="requests">
          <ion-label>Solicitudes</ion-label>
          <ion-badge color="danger" v-if="chatStore.friendRequests.length">{{ chatStore.friendRequests.length }}</ion-badge>
        </ion-segment-button>
      </ion-segment>

      <div v-if="segment === 'search'" class="ion-padding">
        <div class="row-search">
           <ion-searchbar v-model="query" placeholder="Usuario o email..." @ionInput="onSearch"></ion-searchbar>
        </div>

        <ion-list>
           <ion-item v-for="u in searchResults" :key="u.id">
             <ion-avatar slot="start">
               <img 
                 :src="getAvatar(u)" 
                 @error="handleImageError"
                 style="object-fit: cover; width: 100%; height: 100%;"
               />
             </ion-avatar>
             <ion-label>
               <h2>{{ u.username }}</h2>
               <p>{{ u.email }}</p>
             </ion-label>
             
             <div slot="end">
               <ion-button v-if="isFriend(u.id)" fill="clear" @click="startChat(u.id)">
                 <ion-icon :icon="chatbubble" slot="icon-only" color="primary"></ion-icon>
               </ion-button>
               
               <ion-button v-else size="small" @click="sendRequest(u.id)">
                 Añadir
               </ion-button>
             </div>
           </ion-item>
        </ion-list>
        
        <div v-if="query && searchResults.length === 0" class="ion-text-center ion-padding">
          <p class="ion-text-muted">No se encontraron usuarios.</p>
        </div>
      </div>

      <div v-else class="ion-padding">
        <div v-if="chatStore.friendRequests.length === 0" class="ion-text-center ion-padding-top">
          <p class="ion-text-muted">No tienes solicitudes pendientes.</p>
        </div>

        <ion-list v-else>
          <ion-item v-for="req in chatStore.friendRequests" :key="req.id">
            <ion-avatar slot="start">
               <img 
                 :src="getAvatar(req.expand?.sender)" 
                 @error="handleImageError"
                 style="object-fit: cover;"
               />
            </ion-avatar>
            <ion-label>
              <h2>{{ req.expand?.sender?.username }}</h2>
              <p>Quiere ser tu amigo</p>
            </ion-label>
            <div slot="end">
              <ion-button color="success" size="small" @click="respond(req.id, true)">
                <ion-icon :icon="checkmark"></ion-icon>
              </ion-button>
              <ion-button color="danger" size="small" @click="respond(req.id, false)">
                <ion-icon :icon="close"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        </ion-list>

        <h3 class="ion-margin-top">Mis Amigos</h3>
        <ion-list>
          <ion-item v-for="f in chatStore.friends" :key="f.id" button @click="startChat(f.id)">
            <ion-avatar slot="start">
               <img 
                 :src="getAvatar(f)" 
                 @error="handleImageError"
                 style="object-fit: cover;"
               />
            </ion-avatar>
            <ion-label>{{ f.username }}</ion-label>
            <ion-icon :icon="chatbubble" slot="end" color="primary"></ion-icon>
          </ion-item>
        </ion-list>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chat.js';
import { useAuthStore } from '../stores/auth.js'; // Importamos Auth
import { pb } from '../services/pb.js';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, 
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonSearchbar, IonList, IonItem, 
  IonAvatar, IonButton, IonIcon 
} from '@ionic/vue';
import { checkmark, close, chatbubble } from 'ionicons/icons';

const router = useRouter();
const chatStore = useChatStore();
const authStore = useAuthStore();
const segment = ref('requests');
const query = ref('');
const searchResults = ref([]);
let debounceTimer = null;

// --- Helper para verificar amistad ---
function isFriend(userId) {
  return chatStore.friends.some(f => f.id === userId);
}

// --- Búsqueda ---
function onSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if(!query.value) {
      searchResults.value = [];
      return;
    }
    
    // Buscamos en el servidor
    const res = await chatStore.searchUsers(query.value);
    
    // Filtrar SOLO a mí mismo (permitir que salgan amigos)
    const meId = authStore.user?.id;
    searchResults.value = res.items.filter(u => u.id !== meId);
    
  }, 500);
}

// --- Acciones ---
async function sendRequest(id) {
  try {
    await chatStore.sendFriendRequest(id);
    alert('Solicitud enviada');
    query.value = '';
    searchResults.value = [];
  } catch (e) {
    alert(e.message || 'Error enviando solicitud');
  }
}

async function respond(reqId, accept) {
  await chatStore.respondFriendRequest(reqId, accept);
}

async function startChat(friendId) {
  await chatStore.createConversationWith(friendId);
  router.push(`/tabs/chats/${chatStore.currentConversationId}`);
}

const PLACEHOLDER_AVATAR = 'https://ionicframework.com/docs/img/demos/avatar.svg';

function getAvatar(u) {
  // Verificación robusta: requiere collectionId para montar la URL
  if (u?.avatar && u?.collectionId) {
    return pb.files.getUrl(u, u.avatar, { thumb: '100x100' });
  }
  return PLACEHOLDER_AVATAR;
}

function handleImageError(event) {
  event.target.src = PLACEHOLDER_AVATAR;
}

onMounted(async () => {
  await chatStore.fetchFriendRequests();
  await chatStore.fetchFriends();
});
</script>
