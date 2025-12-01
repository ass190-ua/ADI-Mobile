<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Mi Perfil</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout" color="medium">
            <ion-icon slot="icon-only" :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="profile-content">
      
      <div class="header-section">
        <div class="avatar-wrapper" @click="triggerAvatarUpload">
          <ion-avatar class="profile-avatar">
            <img :src="avatarUrl" @error="handleImageError" />
          </ion-avatar>
          <div class="camera-badge">
            <ion-icon :icon="camera" color="light"></ion-icon>
          </div>
        </div>
        <h2 class="username">{{ authStore.user?.username || 'Usuario' }}</h2>
        <p class="email">{{ authStore.user?.email }}</p>
      </div>

      <div class="section-container">
        <h3 class="section-title">Mis Datos</h3>
        <ion-list class="settings-list">
          <ion-item lines="full" class="input-item">
            <ion-label position="stacked">Nombre completo</ion-label>
            <ion-input v-model="form.name" placeholder="Tu nombre"></ion-input>
          </ion-item>
          <ion-item lines="none" class="input-item">
            <ion-label position="stacked">Usuario</ion-label>
            <ion-input v-model="form.username" placeholder="@usuario"></ion-input>
          </ion-item>
        </ion-list>
        
        <div class="ion-padding-horizontal ion-margin-bottom">
          <ion-button expand="block" @click="saveProfile" :disabled="loading" class="save-btn">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Guardar Cambios</span>
          </ion-button>
        </div>
      </div>

      <div class="section-container">
        <h3 class="section-title">Cuenta y Seguridad</h3>
        
        <ion-list class="settings-list menu-list">
          
          <ion-item button detail="true" @click="openPasswordModal">
            <ion-icon slot="start" :icon="lockClosedOutline" class="menu-icon icon-pass"></ion-icon>
            <ion-label>Cambiar Contraseña</ion-label>
          </ion-item>

          <ion-item button detail="true" router-link="/tabs/profile/contact">
            <ion-icon slot="start" :icon="helpCircleOutline" class="menu-icon icon-help"></ion-icon>
            <ion-label>Ayuda y Contacto</ion-label>
          </ion-item>

          <ion-item button detail="true" router-link="/tabs/profile/legal">
            <ion-icon slot="start" :icon="documentTextOutline" class="menu-icon icon-legal"></ion-icon>
            <ion-label>Políticas y Privacidad</ion-label>
          </ion-item>

        </ion-list>
      </div>

      <div class="ion-padding">
        <ion-button expand="block" fill="outline" color="danger" @click="confirmDeleteAccount" class="delete-btn">
          <ion-icon slot="start" :icon="trashOutline"></ion-icon>
          Eliminar Cuenta
        </ion-button>
        <p class="version-text">Esta acción es irreversible</p>
      </div>

      <ion-modal :is-open="isPassModalOpen" @didDismiss="isPassModalOpen = false" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.8]">
        <div class="modal-content ion-padding">
          <h3>Cambiar Contraseña</h3>
          <p class="ion-text-muted">Introduce tu contraseña actual y la nueva.</p>
          
          <ion-list lines="none">
            <ion-item class="input-item ion-margin-bottom">
              <ion-label position="stacked">Contraseña Actual</ion-label>
              <ion-input type="password" v-model="passForm.oldPassword"></ion-input>
            </ion-item>
            
            <ion-item class="input-item ion-margin-bottom">
              <ion-label position="stacked">Nueva Contraseña</ion-label>
              <ion-input type="password" v-model="passForm.newPassword"></ion-input>
            </ion-item>

            <ion-item class="input-item ion-margin-bottom">
              <ion-label position="stacked">Confirmar Nueva</ion-label>
              <ion-input type="password" v-model="passForm.confirmPassword"></ion-input>
            </ion-item>
          </ion-list>

          <ion-button expand="block" @click="submitPasswordChange" :disabled="loading">
            {{ loading ? 'Actualizando...' : 'Actualizar Contraseña' }}
          </ion-button>
        </div>
      </ion-modal>

      <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="onFileSelected" />

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonAvatar, 
  IonIcon, IonButton, IonButtons, IonList, IonItem, IonLabel, IonInput, 
  IonSpinner, toastController, IonModal, alertController
} from '@ionic/vue';
import { 
  camera, logOutOutline, lockClosedOutline, helpCircleOutline, 
  documentTextOutline, trashOutline 
} from 'ionicons/icons';

const router = useRouter();
const authStore = useAuthStore();
const fileInput = ref(null);
const loading = ref(false);

const form = ref({ name: '', username: '' });
const isPassModalOpen = ref(false);
const passForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const PLACEHOLDER = 'https://ionicframework.com/docs/img/demos/avatar.svg';

const avatarUrl = computed(() => {
  const u = authStore.user;
  if (u?.avatar) {
    return pb.files.getUrl(u, u.avatar, { thumb: '200x200' });
  }
  return PLACEHOLDER;
});

onMounted(() => {
  if (authStore.user) {
    form.value.name = authStore.user.name || '';
    form.value.username = authStore.user.username || '';
  }
});

// --- Lógica del Avatar ---
function handleImageError(event) { event.target.src = PLACEHOLDER; }
function triggerAvatarUpload() { fileInput.value.click(); }

async function onFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const updatedUser = await pb.collection('users').update(authStore.user.id, formData);
    authStore.user = updatedUser;
    showToast('Foto actualizada', 'success');
  } catch (err) {
    showToast('Error al subir la foto', 'danger');
  } finally {
    loading.value = false;
  }
}

// --- Guardar Perfil (Nombre/Username) ---
async function saveProfile() {
  loading.value = true;
  try {
    const updatedUser = await pb.collection('users').update(authStore.user.id, {
      name: form.value.name,
      username: form.value.username
    });
    authStore.user = updatedUser;
    showToast('Perfil actualizado', 'success');
  } catch (err) {
    showToast('Error al guardar', 'danger');
  } finally {
    loading.value = false;
  }
}

// --- Cambiar Contraseña (Lógica que fallaba antes) ---
function openPasswordModal() {
  passForm.oldPassword = '';
  passForm.newPassword = '';
  passForm.confirmPassword = '';
  isPassModalOpen.value = true;
}

async function submitPasswordChange() {
  if (passForm.newPassword !== passForm.confirmPassword) {
    showToast('Las contraseñas nuevas no coinciden', 'warning');
    return;
  }
  if (!passForm.oldPassword) {
    showToast('Debes introducir tu contraseña actual', 'warning');
    return;
  }

  loading.value = true;
  try {
    // ¡Aquí es donde ahora sí funcionará porque auth.js ya tiene la función!
    await authStore.updatePassword(passForm.oldPassword, passForm.newPassword, passForm.confirmPassword);
    
    showToast('Contraseña cambiada correctamente', 'success');
    isPassModalOpen.value = false;
  } catch (err) {
    // El mensaje de error viene del throw de auth.js
    showToast(err.message, 'danger');
  } finally {
    loading.value = false;
  }
}

// --- Eliminar Cuenta ---
async function confirmDeleteAccount() {
  const alert = await alertController.create({
    header: '¿Eliminar cuenta?',
    subHeader: 'Esta acción no se puede deshacer.',
    message: 'Se borrarán todos tus datos, fotos y mensajes permanentemente.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar definitivamente',
        role: 'destructive',
        handler: async () => {
          try {
            await authStore.deleteAccount();
            router.replace('/login');
            showToast('Cuenta eliminada. Te echaremos de menos.', 'medium');
          } catch (e) {
            showToast('No se pudo eliminar la cuenta', 'danger');
          }
        },
      },
    ],
  });
  await alert.present();
}

function logout() {
  authStore.logout();
  router.replace('/login');
}

async function showToast(msg, color = 'dark') {
  const toast = await toastController.create({ message: msg, duration: 2000, color, position: 'bottom' });
  await toast.present();
}
</script>

<style scoped>
/* Estilos Dark Mode - Coherentes con el resto */
.profile-content { --background: #0b141a; }

/* Header Avatar */
.header-section {
  display: flex; flex-direction: column; align-items: center;
  padding: 30px 20px 20px;
  background: #1f2c34;
  border-bottom-left-radius: 24px; border-bottom-right-radius: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.avatar-wrapper { position: relative; margin-bottom: 12px; }
.profile-avatar { width: 100px; height: 100px; border: 3px solid var(--ion-color-primary); }
.camera-badge {
  position: absolute; bottom: 0; right: 0;
  background: var(--ion-color-primary);
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #1f2c34;
}
.username { margin: 0; color: #fff; font-weight: 700; font-size: 1.4rem; }
.email { margin: 4px 0 0; color: #8696a0; font-size: 0.9rem; }

/* Secciones */
.section-container { padding: 0 16px; margin-bottom: 24px; }
.section-title {
  color: #8696a0; font-size: 0.85rem; text-transform: uppercase;
  letter-spacing: 1px; margin-bottom: 8px; margin-left: 8px; font-weight: 600;
}

/* Listas */
.settings-list { background: #1f2c34; border-radius: 16px; overflow: hidden; padding: 0; }
ion-item { --background: #1f2c34; --color: #e9edef; --border-color: #2a3942; }
.menu-icon { margin-right: 12px; }
.icon-pass { color: #f59e0b; }
.icon-help { color: #3b82f6; }
.icon-legal { color: #10b981; }

.input-item { --background: #1f2c34; }

/* Botones */
.save-btn { margin-top: 16px; --border-radius: 12px; }
.delete-btn { --border-radius: 12px; margin-bottom: 10px; }
.version-text { text-align: center; color: #8696a0; font-size: 0.8rem; margin: 0; }

/* Modal */
.modal-content {
  background: #1f2c34; height: 100%; color: #fff;
}
.modal-content h3 { margin-top: 0; }
</style>
