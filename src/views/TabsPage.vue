<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom">
        
        <ion-tab-button tab="events" href="/tabs/events">
          <ion-icon :icon="calendar" />
          <ion-label>Eventos</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="photos" href="/tabs/photos">
          <ion-icon :icon="images" />
          <ion-label>Fotos</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="chats" href="/tabs/chats">
          <ion-icon :icon="chatbubbles" />
          <ion-label>Chat</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="person" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { calendar, images, chatbubbles, person } from 'ionicons/icons';
</script>