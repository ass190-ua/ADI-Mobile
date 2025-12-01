<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="legal-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile" text="" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Legal y Privacidad</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="legal-content">
      
      <div class="header-image-container">
         <ion-icon :icon="shieldCheckmark" class="big-icon"></ion-icon>
         <h2>Tu seguridad es lo primero</h2>
         <p class="subtitle">Transparencia total sobre tus datos</p>
      </div>

      <ion-card class="legal-card">
        <ion-card-header>
          <ion-card-title class="card-title">
            <ion-icon :icon="documentText" color="primary"></ion-icon>
            Términos de Servicio
          </ion-card-title>
        </ion-card-header>
        <ion-card-content class="card-text">
          <p>Bienvenido a <strong>Memories+</strong>.</p>
          <p>Al usar esta aplicación, aceptas guardar tus mejores recuerdos con nosotros. Nos comprometemos a mantener la plataforma activa, segura y funcional para ti.</p>
        </ion-card-content>
      </ion-card>

      <ion-card class="legal-card">
        <ion-card-header>
          <ion-card-title class="card-title">
            <ion-icon :icon="lockClosed" color="warning"></ion-icon>
            Política de Privacidad
          </ion-card-title>
        </ion-card-header>
        <ion-card-content class="card-text">
          <p>Nos tomamos tu privacidad muy en serio.</p>
          <p>Tus fotos, eventos y mensajes están almacenados de forma segura en nuestra instancia privada de <strong>PocketBase</strong>. Nadie fuera de esta instancia tiene acceso a tus archivos.</p>
        </ion-card-content>
      </ion-card>

      <ion-card class="legal-card">
        <ion-card-header>
          <ion-card-title class="card-title">
            <ion-icon :icon="server" color="tertiary"></ion-icon>
            Uso de Datos
          </ion-card-title>
        </ion-card-header>
        <ion-card-content class="card-text">
          <p><strong>No compartimos</strong> tus datos con terceros ni empresas de publicidad.</p>
          <p>La información que subes solo es visible para ti y para los amigos que tú aceptes explícitamente dentro de la aplicación.</p>
        </ion-card-content>
      </ion-card>

      <div class="app-info ion-text-center ion-padding">
        <ion-text color="medium">
          <p><strong>Memories+ Mobile</strong></p>
          <p style="font-size: 0.8rem;">Versión 1.0.0 (Build 2025)</p>
          <p style="font-size: 0.8rem;">© 2025 ADI Project</p>
        </ion-text>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonText
} from '@ionic/vue';
import { shieldCheckmark, documentText, lockClosed, server } from 'ionicons/icons';
</script>

<style scoped>
/* Fondo general estilo App Oscura */
.legal-content {
  --background: #0b141a;
}

.legal-toolbar {
  --background: #1f2c34;
  --color: #e9edef;
}

/* Cabecera visual con icono grande */
.header-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px 10px;
  color: #e9edef;
  text-align: center;
}
.big-icon {
  font-size: 64px;
  color: var(--ion-color-primary);
  margin-bottom: 10px;
}
.header-image-container h2 {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 5px 0;
}
.subtitle {
  color: #8696a0;
  margin: 0;
  font-size: 0.95rem;
}

/* Tarjetas Estilizadas */
.legal-card {
  --background: #1f2c34; /* Gris azulado oscuro */
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  color: #e9edef;
  font-weight: 600;
}

.card-text {
  color: #8696a0; /* Texto gris suave para lectura */
  line-height: 1.5;
  font-size: 0.95rem;
}

.card-text p {
  margin-bottom: 8px;
}

.card-text strong {
  color: #e9edef; /* Resaltados en blanco */
}

/* Footer info */
.app-info {
  margin-top: 20px;
  padding-bottom: 40px;
}
</style>
