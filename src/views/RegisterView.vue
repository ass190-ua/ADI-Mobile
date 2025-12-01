<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Crear cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="ion-text-center ion-margin-bottom">
        <img src="/assets/img/logo_header.png" alt="Logo" style="max-height: 60px; margin-top: 20px;" />
        <p class="ion-text-muted">Únete para guardar tus recuerdos</p>
      </div>

      <form @submit.prevent="onRegister">
        <ion-list>
          
          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Nombre completo</ion-label>
            <ion-input v-model="form.name" type="text" required></ion-input>
          </ion-item>

          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Correo electrónico</ion-label>
            <ion-input v-model="form.email" type="email" required></ion-input>
          </ion-item>

          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Contraseña</ion-label>
            <ion-input v-model="form.password" type="password" required></ion-input>
          </ion-item>

          <ion-item fill="outline" class="ion-margin-bottom">
            <ion-label position="floating">Repetir contraseña</ion-label>
            <ion-input v-model="form.passwordConfirm" type="password" required></ion-input>
          </ion-item>

        </ion-list>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" :disabled="loading">
            {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
          </ion-button>
        </div>

        <ion-text color="danger" v-if="errorMsg" class="ion-text-center ion-margin-top">
          <p>{{ errorMsg }}</p>
        </ion-text>
      </form>

      <div class="ion-text-center ion-margin-top">
        <p class="ion-text-muted">
          ¿Ya tienes cuenta? <router-link to="/login" style="font-weight: bold;">Inicia sesión</router-link>
        </p>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { 
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, 
  IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonText 
} from '@ionic/vue';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const errorMsg = ref('');

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: ''
});

async function onRegister() {
  if (form.password !== form.passwordConfirm) {
    errorMsg.value = 'Las contraseñas no coinciden.';
    return;
  }

  loading.value = true;
  errorMsg.value = '';

  try {
    // 1. Crear usuario
    await authStore.register({
      username: form.name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random()*1000), // Generar un username único simple
      email: form.email,
      emailVisibility: true,
      password: form.password,
      passwordConfirm: form.passwordConfirm,
      name: form.name
    });

    // 2. Login automático tras registro (opcional, pero recomendable)
    await authStore.login(form.email, form.password);

    // 3. Ir a la home
    router.replace('/tabs/events');
    
  } catch (err) {
    console.error(err);
    errorMsg.value = err.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
  } finally {
    loading.value = false;
  }
}
</script>
