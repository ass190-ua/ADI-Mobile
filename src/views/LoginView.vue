<template>
  <ion-page>
    <ion-content class="ion-padding" color="light">
      
      <div class="login-container">
        
        <div class="ion-text-center ion-margin-bottom">
          <img src="/assets/img/logo_header.png" alt="Memories+" style="max-height: 80px; margin-top: 40px;" />
          <h1>Iniciar Sesión</h1>
          <p class="ion-text-muted">Accede para ver tus recuerdos</p>
        </div>

        <ion-card>
          <ion-card-content>
            <form @submit.prevent="onSubmit">
              
              <ion-item fill="outline" class="ion-margin-bottom">
                <ion-label position="floating">Correo o usuario</ion-label>
                <ion-input 
                  v-model="identity" 
                  type="text" 
                  placeholder="usuario@ejemplo.com"
                  required
                ></ion-input>
              </ion-item>

              <ion-item fill="outline" class="ion-margin-bottom">
                <ion-label position="floating">Contraseña</ion-label>
                <ion-input 
                  v-model="password" 
                  type="password" 
                  required
                ></ion-input>
              </ion-item>

              <ion-text color="danger" v-if="errorMsg" class="ion-text-center">
                <p>{{ errorMsg }}</p>
              </ion-text>

              <ion-button expand="block" type="submit" :disabled="submitting" class="ion-margin-top">
                {{ submitting ? 'Entrando...' : 'Iniciar Sesión' }}
              </ion-button>

            </form>
          </ion-card-content>
        </ion-card>

        <div class="ion-text-center ion-margin-top">
          <ion-button fill="clear" size="small" id="open-reset-modal">
            ¿Olvidaste tu contraseña?
          </ion-button>
        </div>

        <div class="ion-text-center">
          <p class="ion-text-muted" style="font-size: 0.9em;">
            ¿No tienes cuenta?
            <router-link to="/register" style="text-decoration: none; font-weight: bold;">
              Regístrate aquí
            </router-link>
          </p>
        </div>

      </div>

      <ion-modal trigger="open-reset-modal" :initial-breakpoint="0.5" :breakpoints="[0, 0.5]">
        <div class="ion-padding">
          <h3>Recuperar contraseña</h3>
          <p class="ion-text-muted">Introduce tu correo y te enviaremos un enlace.</p>
          
          <ion-item fill="outline" class="ion-margin-top">
            <ion-label position="floating">Correo electrónico</ion-label>
            <ion-input v-model="resetEmail" type="email"></ion-input>
          </ion-item>

          <ion-button expand="block" class="ion-margin-top" @click="onReset" :disabled="resetSubmitting">
            {{ resetSubmitting ? 'Enviando...' : 'Enviar' }}
          </ion-button>
        </div>
      </ion-modal>

      <ion-toast
        :is-open="toastOpen"
        message="Solicitud recibida. Revisa tu correo."
        :duration="3000"
        @didDismiss="toastOpen = false"
        color="success"
        position="top"
      ></ion-toast>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js'; // Asegúrate que la ruta sea correcta
import { 
  IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, 
  IonInput, IonButton, IonText, IonModal, IonToast 
} from '@ionic/vue';

const router = useRouter();
const auth = useAuthStore();

const identity = ref('');
const password = ref('');
const submitting = ref(false);
const errorMsg = ref('');
const toastOpen = ref(false);

const resetEmail = ref('');
const resetSubmitting = ref(false);

onMounted(() => {
  if (auth.isAuthenticated) router.replace('/tabs/tab1'); // Redirige a las tabs si ya está logueado
});

async function onSubmit() {
  errorMsg.value = '';
  submitting.value = true;
  try {
    await auth.login(identity.value, password.value);
    // IMPORTANTE: Usar replace para no poder volver atrás al login
    router.replace('/tabs/events'); 
  } catch (e) {
    // Aquí verás el error real gracias al throw del store
    errorMsg.value = e.message || 'Credenciales incorrectas.';
  } finally {
    submitting.value = false; // Esto asegura que el botón se desbloquee
  }
}

async function onReset() {
  if (!resetEmail.value) return;
  resetSubmitting.value = true;
  try {
    await auth.requestPasswordReset(resetEmail.value);
    toastOpen.value = true;
    // Cerrar el modal se hace automático si usas un ref al modal, 
    // pero en este caso simple el usuario puede deslizar para cerrar.
  } catch {
    toastOpen.value = true; // Por seguridad mostramos éxito
  } finally {
    resetSubmitting.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}
</style>
