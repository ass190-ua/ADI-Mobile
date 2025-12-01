<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Eventos</ion-title>
        <ion-buttons slot="end">
           </ion-buttons>
      </ion-toolbar>
      
      <ion-toolbar>
        <ion-searchbar 
          placeholder="Buscar evento..." 
          :debounce="500"
          @ionInput="handleSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding-bottom">
      
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="filters-container ion-padding-horizontal ion-margin-bottom">
        <ion-chip :outline="when !== 'today'" color="primary" @click="setWhen('today')">
          <ion-label>Hoy</ion-label>
        </ion-chip>
        <ion-chip :outline="when !== 'week'" color="primary" @click="setWhen('week')">
          <ion-label>Esta semana</ion-label>
        </ion-chip>
        <ion-chip :outline="when !== 'upcoming'" color="primary" @click="setWhen('upcoming')">
          <ion-label>Próximos</ion-label>
        </ion-chip>
        <ion-chip :outline="when !== 'past'" color="medium" @click="setWhen('past')">
          <ion-label>Pasados</ion-label>
        </ion-chip>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Cargando eventos...</p>
      </div>

      <div v-else-if="events.length === 0" class="ion-text-center ion-padding ion-margin-top">
        <ion-icon :icon="calendar" style="font-size: 64px; color: #ccc;"></ion-icon>
        <p class="ion-text-muted">No se encontraron eventos.</p>
      </div>

      <div v-else>
        <ion-card v-for="ev in events" :key="ev.id" @click="goToDetail(ev.id)">
          <div class="card-image-container">
            <img 
              :src="getCoverUrl(ev)" 
              alt="Portada" 
              style="width: 100%; height: 180px; object-fit: cover;"
              @error="$event.target.src = 'https://ionicframework.com/docs/img/demos/card-media.png'"
            />
            <div class="date-badge">
              {{ formatDateShort(ev.date) }}
            </div>
          </div>

          <ion-card-header>
            <ion-card-title>{{ ev.title }}</ion-card-title>
            <ion-card-subtitle class="ion-text-wrap">
              <ion-icon :icon="location" style="vertical-align: text-bottom;"></ion-icon>
              {{ ev.location || 'Sin ubicación' }}
            </ion-card-subtitle>
          </ion-card-header>
        </ion-card>
      </div>

      <div class="pagination-controls ion-text-center ion-margin-vertical" v-if="events.length > 0 || page > 1">
        <ion-button fill="clear" :disabled="page <= 1" @click="prevPage">
          Anteriores
        </ion-button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <ion-button fill="clear" :disabled="page >= totalPages" @click="nextPage">
          Siguientes
        </ion-button>
      </div>

      <div style="height: 80px;"></div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="goToCreate">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events.js'; // Asegúrate que la ruta es correcta
import { pb } from '../services/pb.js'; // Tu servicio de pocketbase
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, 
  IonChip, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonSpinner, IonIcon, IonFab, IonFabButton, IonButtons, IonButton,
  IonRefresher, IonRefresherContent
} from '@ionic/vue';
import { calendar, location, add } from 'ionicons/icons';

const router = useRouter();
const eventsStore = useEventsStore();

// Estados Locales
const page = ref(1);
const perPage = 5; // En móvil mejor cargar menos de golpe
const q = ref('');
const when = ref('upcoming');
const sortDesc = ref(true); // Ordenar por fecha descendente por defecto para "upcoming"

// Computed
const events = computed(() => eventsStore.events);
const loading = computed(() => eventsStore.loading);
const totalPages = computed(() => eventsStore.totalPages || 1);

// --- Lógica de Carga (Idéntica a tu práctica 3) ---
async function loadEvents(isRefresh = false) {
  const filterParts = [];
  const now = new Date();
  const toISO = (d) => new Date(d).toISOString();

  // Filtros de tiempo
  switch (when.value) {
    case 'today':
      const start = new Date(now); start.setHours(0,0,0,0);
      const end = new Date(now); end.setHours(23,59,59,999);
      filterParts.push(`(date >= "${toISO(start)}" && date <= "${toISO(end)}")`);
      break;
    case 'week':
      const weekTo = new Date(now); weekTo.setDate(weekTo.getDate() + 7);
      filterParts.push(`(date >= "${toISO(now)}" && date < "${toISO(weekTo)}")`);
      break;
    case 'upcoming':
      filterParts.push(`(date >= "${toISO(now)}")`);
      break;
    case 'past':
      filterParts.push(`(date < "${toISO(now)}")`);
      break;
  }

  // Búsqueda
  if (q.value) {
    const term = q.value.trim().replace(/"/g, '\\"'); // Escapar comillas
    filterParts.push(`(title ~ "${term}" || description ~ "${term}" || location ~ "${term}")`);
  }

  const filter = filterParts.join(' && ');
  // Si son pasados, ordenamos descendente (lo más reciente primero), si son futuros, ascendente (lo más próximo primero)
  const sort = when.value === 'past' ? '-date' : 'date';

  await eventsStore.fetchEvents(page.value, perPage, { sort, filter });
}

// --- Métodos de UI ---

function handleSearch(event) {
  q.value = event.target.value;
  page.value = 1;
  // El watch se encargará de cargar
}

function setWhen(value) {
  when.value = value;
  page.value = 1;
}

function prevPage() { if (page.value > 1) page.value--; }
function nextPage() { if (page.value < totalPages.value) page.value++; }

// Navegación
function goToDetail(id) {
  // OJO: Esta ruta la crearemos en el siguiente paso
  router.push(`/tabs/events/${id}`);
}
function goToCreate() {
  // OJO: Esta ruta la crearemos en el siguiente paso
  router.push('/tabs/events/create');
}

// Helpers visuales
function getCoverUrl(ev) {
  if (ev.cover) {
    return pb.files.getUrl(ev, ev.cover, { thumb: '400x300' });
  }
  return 'https://ionicframework.com/docs/img/demos/card-media.png'; // Fallback
}

function formatDateShort(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });
}

async function doRefresh(event) {
  await loadEvents(true);
  event.target.complete();
}

// --- Ciclo de Vida ---
onMounted(() => {
  loadEvents();
});

watch([page, q, when], () => {
  loadEvents();
});
</script>

<style scoped>
.filters-container {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 5px;
  /* Ocultar scrollbar pero permitir scroll */
  scrollbar-width: none; 
}
.filters-container::-webkit-scrollbar {
  display: none;
}

.card-image-container {
  position: relative;
}

.date-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.8rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
