<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/events"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ event?.title || 'Cargando...' }}</ion-title>
        
        <ion-buttons slot="end" v-if="isMyEvent">
          <ion-button @click="goToEdit">
            <ion-icon slot="icon-only" :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" v-if="event">
      
      <div class="cover-image" :style="{ backgroundImage: `url(${getCoverUrl(event)})` }"></div>

      <div class="ion-padding">
        <h1 class="ion-no-margin">{{ event.title }}</h1>
        <ion-chip color="secondary" class="ion-margin-vertical">
          <ion-icon :icon="calendar" color="dark"></ion-icon>
          <ion-label>{{ formatDate(event.date) }}</ion-label>
        </ion-chip>

        <div class="ion-margin-bottom" style="display: flex; align-items: center; color: var(--ion-color-medium);">
          <ion-icon :icon="location" style="margin-right: 5px;"></ion-icon>
          <span>{{ event.location }}</span>
        </div>

        <p style="line-height: 1.6; font-size: 1.1em;">
          {{ event.description }}
        </p>

        <div class="ion-margin-top" v-if="isMyEvent">
           <ion-button color="danger" fill="outline" expand="block" @click="deleteThisEvent">
              <ion-icon slot="start" :icon="trash"></ion-icon>
              Eliminar Evento
           </ion-button>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; // <--- Faltaba 'computed'
import { useRoute, useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events.js';
import { useAuthStore } from '../stores/auth.js'; // <--- Faltaba importar Auth
import { pb } from '../services/pb.js';
import { 
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, 
  IonContent, IonChip, IonIcon, IonLabel, IonButton 
} from '@ionic/vue';
import { calendar, location, trash, createOutline } from 'ionicons/icons'; // <--- Faltaba 'createOutline'

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();
const authStore = useAuthStore(); // <--- Inicializar Auth
const event = ref(null);

// Computed: ¿Es mi evento?
const isMyEvent = computed(() => {
  if (!event.value || !authStore.user) return false;
  return event.value.user === authStore.user.id;
});

onMounted(async () => {
  const id = route.params.id;
  // Intentamos buscarlo en el store primero
  event.value = eventsStore.events.find(e => e.id === id);
  
  // Si no está, lo pedimos al servidor
  if (!event.value) {
    try {
      event.value = await pb.collection('events').getOne(id);
    } catch (e) {
      console.error(e);
      alert('Evento no encontrado');
      router.back();
    }
  }
});

function goToEdit() {
  // Navegar a la ruta de edición con el ID
  router.push(`/tabs/events/edit/${event.value.id}`);
}

async function deleteThisEvent() {
  if(!confirm("¿Seguro que quieres borrar este evento?")) return;
  
  try {
    await eventsStore.deleteEvent(event.value.id);
    router.replace('/tabs/events');
  } catch (e) {
    alert("Error al eliminar");
  }
}

// Helpers
function getCoverUrl(ev) {
  if (ev?.cover) return pb.files.getUrl(ev, ev.cover);
  return 'https://ionicframework.com/docs/img/demos/card-media.png';
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' });
}
</script>

<style scoped>
.cover-image {
  width: 100%;
  height: 250px;
  background-size: cover;
  background-position: center;
  background-color: #eee;
}
</style>
