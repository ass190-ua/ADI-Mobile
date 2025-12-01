<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/events"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Editar Evento' : 'Nuevo Evento' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      
      <div v-if="loadingData" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
        <p>Cargando datos...</p>
      </div>

      <form v-else @submit.prevent="submitEvent">
        <ion-list>
          
          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Título del evento</ion-label>
            <ion-input v-model="form.title" required></ion-input>
          </ion-item>

          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Descripción</ion-label>
            <ion-textarea v-model="form.description" rows="4"></ion-textarea>
          </ion-item>

          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Ubicación</ion-label>
            <ion-input v-model="form.location"></ion-input>
          </ion-item>

          <ion-item lines="none" class="ion-margin-bottom">
            <ion-label>Fecha y Hora</ion-label>
            <ion-datetime-button datetime="datetime"></ion-datetime-button>
          </ion-item>
          
          <ion-modal :keep-contents-mounted="true">
            <ion-datetime id="datetime" v-model="form.date" presentation="date-time"></ion-datetime>
          </ion-modal>

          <div class="image-preview ion-margin-bottom" v-if="currentImageUrl && !form.cover">
             <p class="ion-text-muted ion-no-margin" style="font-size: 0.8rem; margin-bottom: 5px;">Imagen actual:</p>
             <img :src="currentImageUrl" style="height: 150px; width: 100%; object-fit: cover; border-radius: 8px;" />
          </div>

          <ion-item lines="none" class="box-upload">
            <ion-label position="stacked">{{ isEditing ? 'Cambiar imagen (opcional)' : 'Imagen de portada' }}</ion-label>
            <input type="file" @change="handleFile" accept="image/*" class="ion-margin-top"/>
          </ion-item>

        </ion-list>

        <ion-button expand="block" type="submit" class="ion-margin-top" :disabled="loadingSubmit">
          <ion-spinner v-if="loadingSubmit" name="crescent"></ion-spinner>
          <span v-else>{{ isEditing ? 'Actualizar Evento' : 'Crear Evento' }}</span>
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventsStore } from '../stores/events.js';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonInput, IonTextarea, IonButton,
  IonDatetime, IonDatetimeButton, IonModal, IonSpinner, toastController
} from '@ionic/vue';

const router = useRouter();
const route = useRoute();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

const loadingSubmit = ref(false);
const loadingData = ref(false);
const eventId = route.params.id; // Si existe, estamos editando

// Formulario reactivo
const form = reactive({
  title: '',
  description: '',
  location: '',
  date: new Date().toISOString(),
  cover: null
});

// Computed para saber modo
const isEditing = computed(() => !!eventId);
const currentImageUrl = ref('');

// --- Carga Inicial (Solo Editar) ---
onMounted(async () => {
  if (isEditing.value) {
    loadingData.value = true;
    try {
      // 1. Buscamos en el store local primero
      let event = eventsStore.events.find(e => e.id === eventId);
      
      // 2. Si no está, pedimos al servidor
      if (!event) {
        event = await pb.collection('events').getOne(eventId);
      }

      // 3. Rellenamos el formulario
      form.title = event.title;
      form.description = event.description;
      form.location = event.location;
      form.date = event.date; // PocketBase devuelve ISO, compatible con ion-datetime
      
      // Guardamos la URL de la imagen actual para mostrarla
      if (event.cover) {
        currentImageUrl.value = pb.files.getUrl(event, event.cover);
      }
    } catch (err) {
      console.error(err);
      showToast('Error cargando evento', 'danger');
      router.back();
    } finally {
      loadingData.value = false;
    }
  }
});

function handleFile(event) {
  const file = event.target.files[0];
  if (file) {
    form.cover = file;
  }
}

// --- Submit Unificado (Crear/Editar) ---
async function submitEvent() {
  loadingSubmit.value = true;
  try {
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('location', form.location);
    formData.append('date', form.date);
    
    // Si estamos creando, añadimos el usuario
    if (!isEditing.value && authStore.user?.id) {
        formData.append('user', authStore.user.id);
    }
    
    // Solo añadimos la imagen si el usuario seleccionó una nueva
    if (form.cover) {
      formData.append('cover', form.cover);
    }

    if (isEditing.value) {
      // MODO ACTUALIZAR
      await eventsStore.updateEvent(eventId, formData);
      showToast('Evento actualizado correctamente', 'success');
      // Volvemos al detalle para ver los cambios
      router.replace(`/tabs/events/${eventId}`);
    } else {
      // MODO CREAR
      await eventsStore.createEvent(formData);
      showToast('Evento creado correctamente', 'success');
      router.replace('/tabs/events');
    }
    
  } catch (error) {
    console.error(error);
    showToast('Error al guardar el evento', 'danger');
  } finally {
    loadingSubmit.value = false;
  }
}

async function showToast(msg, color) {
  const toast = await toastController.create({
    message: msg,
    duration: 2000,
    color: color,
    position: 'bottom'
  });
  await toast.present();
}
</script>

<style scoped>
.box-upload {
  border: 1px dashed var(--ion-color-medium);
  border-radius: 8px;
  padding: 10px;
}
</style>
