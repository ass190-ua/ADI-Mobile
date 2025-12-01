<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Galería</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleSelecting">
            {{ state.selecting ? 'Cancelar' : 'Seleccionar' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar v-if="state.selecting">
        <ion-title size="small">{{ state.selected.size }} seleccionadas</ion-title>
        <ion-buttons slot="end">
          <ion-button color="danger" @click="bulkDelete" :disabled="state.selected.size === 0">
            <ion-icon slot="icon-only" :icon="trash"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar>
        <ion-searchbar 
          placeholder="Buscar fotos..." 
          :debounce="500"
          @ionInput="onSearchInput"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="filters-container ion-padding-horizontal ion-margin-bottom ion-padding-top">
        <ion-chip :outline="state.filter !== ''" color="secondary" @click="setFilter('')">
          <ion-label>Todas</ion-label>
        </ion-chip>
        <ion-chip :outline="state.filter !== 'favourite = true'" color="warning" @click="setFilter('favourite = true')">
          <ion-icon :icon="star" color="warning"></ion-icon>
          <ion-label>Favoritas</ion-label>
        </ion-chip>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="items.length === 0" class="ion-text-center ion-padding ion-margin-top">
        <ion-icon :icon="images" style="font-size: 64px; color: #ccc;"></ion-icon>
        <p class="ion-text-muted">No hay fotos para mostrar.</p>
      </div>

      <ion-grid v-else class="ion-no-padding">
        <ion-row>
          <ion-col size="6" size-md="4" size-lg="3" v-for="rec in items" :key="rec.id">
            <div class="photo-container" @click="handlePhotoClick(rec)">
              
              <ion-img 
                :src="getCoverUrl(rec)" 
                alt="Foto"
                style="width: 100%; height: 100%; object-fit: cover; min-height: 150px; background: #eee;"
              ></ion-img>

              <div v-if="state.selecting" class="selection-overlay">
                <ion-checkbox 
                  :checked="state.selected.has(rec.id)"
                  @ionChange="toggleSelected(rec.id, $event.detail.checked)"
                  aria-label="Seleccionar"
                ></ion-checkbox>
              </div>

              <div class="fav-button" @click.stop="toggleFav(rec)">
                 <ion-icon :icon="rec.favourite ? star : starOutline" :color="rec.favourite ? 'warning' : 'medium'"></ion-icon>
              </div>

            </div>
          </ion-col>
        </ion-row>
      </ion-grid>

      <div class="ion-text-center ion-padding" v-if="items.length > 0">
        <ion-button fill="clear" @click="loadNextPage">
          Cargar más
        </ion-button>
      </div>

      <div style="height: 80px;"></div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="triggerUpload">
          <ion-icon :icon="camera"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <input ref="fileInput" type="file" accept="image/*" multiple style="display:none;" @change="onFilesPicked" />

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonSearchbar, IonChip, IonLabel, IonIcon, IonGrid, IonRow, IonCol, IonImg,
  IonFab, IonFabButton, IonSpinner, IonRefresher, IonRefresherContent, IonCheckbox
} from '@ionic/vue';
import { trash, star, starOutline, images, camera } from 'ionicons/icons';
import { listPhotos, uploadPhoto, deletePhoto, toggleFavorite, fileUrl } from '../services/photos_services.js';

// --- Estado ---
const state = reactive({
  page: 1,
  perPage: 15, // Menos fotos por carga para móvil
  sort: '-created',
  q: '',
  selecting: false,
  selected: new Set(),
  filter: ''
});

const items = ref([]);
const loading = ref(false);
const fileInput = ref(null);

// --- Carga de Datos ---
async function load(append = false) {
  if (!append) loading.value = true;
  
  try {
    const searchFilter = state.q
      ? `(title ~ "${state.q}" || location ~ "${state.q}" || tags ~ "${state.q}")`
      : '';
    // Combinar filtros (filtro de tabs + filtro de búsqueda)
    const finalFilter = [state.filter, searchFilter].filter(Boolean).join(' && ');

    const res = await listPhotos({
      page: state.page,
      perPage: state.perPage,
      sort: state.sort,
      filter: finalFilter
    });

    if (append) {
      items.value = [...items.value, ...res.items];
    } else {
      items.value = res.items || [];
    }
  } catch (err) {
    console.error(err);
    alert('Error cargando fotos');
  } finally {
    loading.value = false;
  }
}

// --- Acciones UI ---

function onSearchInput(ev) {
  state.q = ev.target.value;
  state.page = 1;
  load();
}

function setFilter(filterStr) {
  state.filter = filterStr;
  state.page = 1;
  load();
}

function loadNextPage() {
  state.page++;
  load(true);
}

function doRefresh(event) {
  state.page = 1;
  load().then(() => event.target.complete());
}

// --- Selección y Favoritos ---

function toggleSelecting() {
  state.selecting = !state.selecting;
  state.selected.clear();
}

function toggleSelected(id, isChecked) {
  if (isChecked) state.selected.add(id);
  else state.selected.delete(id);
}

function handlePhotoClick(rec) {
  if (state.selecting) {
    // Si estamos seleccionando, el click en la foto invierte la selección
    const isSelected = state.selected.has(rec.id);
    toggleSelected(rec.id, !isSelected);
  } else {
    // Aquí podrías abrir un modal para ver la foto en grande (opcional)
    // Por ahora no hace nada
  }
}

async function toggleFav(rec) {
  // Guardamos el valor actual para enviarlo al servicio
  const currentStatus = !!rec.favourite;
  
  try {
    // Llamamos al servicio pasando el estado actual
    // El servicio se encarga de invertirlo y devolver el registro actualizado
    const updatedRecord = await toggleFavorite(rec.id, currentStatus);
    
    // Actualizamos la vista con el dato real que viene del servidor
    rec.favourite = updatedRecord.favourite;
    
  } catch (err) {
    console.error('Error al cambiar favorito:', err);
  }
}

async function bulkDelete() {
  if (!confirm(`¿Borrar ${state.selected.size} fotos?`)) return;
  
  // Borrado en serie
  for (const id of state.selected) {
    await deletePhoto(id);
  }
  
  state.selected.clear();
  state.selecting = false;
  state.page = 1;
  load();
}

// --- Subida de Fotos ---

function triggerUpload() {
  fileInput.value.click();
}

async function onFilesPicked(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  loading.value = true;
  try {
    for (const f of files) {
      await uploadPhoto({ file: f });
    }
    // Recargar al terminar
    state.page = 1;
    await load();
  } catch (err) {
    alert('Error subiendo foto');
  } finally {
    loading.value = false;
    e.target.value = ''; // Limpiar input
  }
}

// --- Helpers ---
function getCoverUrl(rec) {
  // Usamos tu función helper fileUrl importada
  return fileUrl(rec, 'field', '400x0') || fileUrl(rec, undefined, '400x0'); 
}

// --- Ciclo de vida ---
onMounted(() => {
  load();
});
</script>

<style scoped>
.photo-container {
  position: relative;
  aspect-ratio: 1 / 1; /* Cuadrado perfecto */
  overflow: hidden;
  border: 1px solid #fff;
}

.selection-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.fav-button {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  padding: 5px;
  display: flex;
  z-index: 5;
}
</style>
