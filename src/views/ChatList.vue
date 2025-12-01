<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Chats</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openGroupModal">
            <ion-icon slot="icon-only" :icon="addCircleOutline"></ion-icon>
          </ion-button>
          <ion-button @click="goToFriends">
            <ion-icon slot="icon-only" :icon="peopleOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar placeholder="Buscar chat..." v-model="searchText"></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="chatStore.loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="filteredConversations.length === 0" class="ion-text-center ion-padding ion-margin-top">
        <ion-icon :icon="chatbubblesOutline" style="font-size: 64px; color: #ccc;"></ion-icon>
        <p class="ion-text-muted">No tienes conversaciones.</p>
        <ion-button fill="outline" @click="goToFriends">Buscar amigos</ion-button>
      </div>

      <ion-list v-else>
        <ion-item 
          v-for="convo in filteredConversations" 
          :key="convo.id" 
          button 
          :detail="false"
          @click="openChat(convo.id)"
        >
          <ion-avatar slot="start">
            <img :src="getChatAvatar(convo)" @error="handleImageError" />
          </ion-avatar>

          <ion-label>
            <h2>{{ getChatName(convo) }}</h2>
            <p class="preview-text">{{ getLastMessagePreview(convo) }}</p>
          </ion-label>

          <ion-note slot="end" style="font-size: 0.7em;" v-if="getLastMessageDate(convo)">
            {{ formatTime(getLastMessageDate(convo)) }}
          </ion-note>
        </ion-item>
      </ion-list>

      <ion-modal :is-open="isGroupModalOpen" @didDismiss="isGroupModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Nuevo Grupo</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="isGroupModalOpen = false">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          
          <ion-list lines="none">
            <ion-item class="input-item ion-margin-bottom">
              <ion-label position="stacked">Nombre del Grupo</ion-label>
              <ion-input v-model="groupName" placeholder="Ej: Viaje a Roma"></ion-input>
            </ion-item>

            <ion-list-header>
              <ion-label>Participantes</ion-label>
            </ion-list-header>

            <div v-if="chatStore.friends.length === 0" class="ion-text-center ion-padding">
              <p class="ion-text-muted">No tienes amigos para añadir.</p>
              <ion-button fill="clear" @click="goToFriends; isGroupModalOpen=false">Buscar amigos</ion-button>
            </div>

            <ion-item v-else v-for="friend in chatStore.friends" :key="friend.id">
              <ion-avatar slot="start">
                <img :src="getAvatar(friend)" @error="handleImageError" />
              </ion-avatar>
              <ion-label>{{ friend.username }}</ion-label>
              <ion-checkbox slot="end" :value="friend.id" v-model="selectedFriends"></ion-checkbox>
            </ion-item>
          </ion-list>

          <ion-button expand="block" class="ion-margin-top" @click="createGroup" :disabled="!canCreateGroup">
            Crear Grupo
          </ion-button>

        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chat.js';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonSearchbar, IonList, IonItem, IonAvatar, IonLabel, IonNote, IonSpinner, 
  IonRefresher, IonRefresherContent, IonModal, IonInput, IonListHeader, IonCheckbox, toastController
} from '@ionic/vue';
import { peopleOutline, chatbubblesOutline, addCircleOutline } from 'ionicons/icons';

const router = useRouter();
const chatStore = useChatStore();
const authStore = useAuthStore();
const searchText = ref('');

// Estado del Modal de Grupo
const isGroupModalOpen = ref(false);
const groupName = ref('');
const selectedFriends = ref([]);

const PLACEHOLDER = 'https://ionicframework.com/docs/img/demos/avatar.svg';

// --- Computed ---
const filteredConversations = computed(() => {
  const list = chatStore.conversations || [];
  if (!searchText.value) return list;
  const term = searchText.value.toLowerCase();
  return list.filter(c => getChatName(c).toLowerCase().includes(term));
});

const canCreateGroup = computed(() => {
  return groupName.value.trim().length > 0 && selectedFriends.value.length > 0;
});

// --- Helpers Visuales ---
function getChatName(convo) {
  if (convo.isGroup) return convo.name || 'Grupo';
  const other = convo.expand?.participants?.find(p => p.id !== authStore.user?.id);
  return other?.username || other?.name || 'Usuario';
}

function getChatAvatar(convo) {
  if (convo.isGroup) return PLACEHOLDER; // Podrías poner un icono de grupo aquí
  const other = convo.expand?.participants?.find(p => p.id !== authStore.user?.id);
  return getAvatar(other);
}

function getAvatar(u) {
  if (u?.avatar && u?.collectionId) {
    return pb.files.getUrl(u, u.avatar, { thumb: '100x100' });
  }
  return PLACEHOLDER;
}

function handleImageError(event) { event.target.src = PLACEHOLDER; }

function getLastMessagePreview(convo) {
  const msgs = chatStore.messages[convo.id] || [];
  const last = msgs[msgs.length - 1];
  return last ? last.content : 'Sin mensajes';
}

function getLastMessageDate(convo) {
  const msgs = chatStore.messages[convo.id] || [];
  const last = msgs[msgs.length - 1];
  return last ? last.created : null;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- Navegación y Acciones ---
function openChat(id) {
  router.push(`/tabs/chats/${id}`);
}

function goToFriends() {
  router.push('/tabs/chats/friends');
}

function openGroupModal() {
  // Resetear formulario
  groupName.value = '';
  selectedFriends.value = []; // Array de IDs
  // Asegurar que tenemos amigos cargados
  chatStore.fetchFriends(); 
  isGroupModalOpen.value = true;
}

async function createGroup() {
  try {
    // Nota: ion-checkbox v-model devuelve true/false si no tiene value, 
    // pero en una lista con valores devuelve el array de valores seleccionados.
    // Asegúrate de que selectedFriends contiene IDs. 
    // Si Ionic devuelve proxies, los convertimos.
    const ids = JSON.parse(JSON.stringify(selectedFriends.value));
    
    await chatStore.createGroupConversation(groupName.value, ids);
    
    isGroupModalOpen.value = false;
    showToast('Grupo creado', 'success');
    
    // Ir al chat nuevo
    if (chatStore.currentConversationId) {
        router.push(`/tabs/chats/${chatStore.currentConversationId}`);
    }
  } catch (err) {
    console.error(err);
    showToast('Error al crear grupo', 'danger');
  }
}

async function doRefresh(ev) {
  await chatStore.fetchConversations();
  ev.target.complete();
}

async function showToast(msg, color) {
  const toast = await toastController.create({ message: msg, duration: 2000, color, position: 'top' });
  await toast.present();
}

onMounted(() => {
  chatStore.fetchConversations();
  // Cargar amigos en background para tenerlos listos para el grupo
  chatStore.fetchFriends();
});
</script>

<style scoped>
.preview-text {
  color: var(--ion-color-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.input-item {
  --background: var(--ion-item-background, #fff);
  --border-radius: 8px;
  border: 1px solid var(--ion-color-light-shade);
}
</style>
