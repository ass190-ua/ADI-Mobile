<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="chat-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/chats" text="" color="light"></ion-back-button>
          <ion-avatar class="header-avatar" v-if="!loading">
            <img 
              :src="chatAvatar" 
              @error="handleImageError" 
              style="object-fit: cover;"
            />
          </ion-avatar>
        </ion-buttons>
        <ion-title class="chat-title">{{ chatTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button color="light">
            <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" ref="contentRef" class="chat-content" :scroll-events="true">
      <div class="messages-container">
        
        <div v-if="loading" class="ion-text-center ion-padding top-spacer">
          <ion-spinner color="primary"></ion-spinner>
        </div>

        <div v-else-if="messages.length === 0" class="empty-state">
          <div class="empty-bubble">
            <p>👋 <strong>¡Nuevo Chat!</strong></p>
            <p>Saluda a {{ chatTitle }} para empezar.</p>
          </div>
        </div>

        <div 
          v-else
          v-for="(msg, index) in messages" 
          :key="msg.id" 
          class="message-row"
          :class="{ 'my-message': isMe(msg), 'other-message': !isMe(msg) }"
        >
          <div v-if="shouldShowName(msg, index)" class="message-sender">
             {{ msg.expand?.sender?.username || 'Usuario' }}
          </div>
          
          <div class="message-bubble">
            <span class="text-content">{{ msg.content }}</span>
            <div class="message-meta">
              <span class="time">{{ formatTime(msg.created) }}</span>
              <span v-if="isMe(msg)" class="ticks">✓✓</span> 
            </div>
          </div>
        </div>

      </div>
    </ion-content>

    <ion-footer class="chat-footer">
      <div v-show="showEmojiPicker" class="emoji-container">
        <EmojiPicker 
          :native="true" 
          theme="dark"
          @select="onSelectEmoji" 
          style="width: 100%; height: 250px;"
        />
      </div>

      <ion-toolbar class="input-toolbar">
        <div class="input-area">
          <ion-button fill="clear" size="small" @click="toggleEmojiPicker" class="emoji-btn">
            <ion-icon slot="icon-only" :icon="showEmojiPicker ? close : happy" :color="showEmojiPicker ? 'primary' : 'medium'"></ion-icon>
          </ion-button>

          <ion-textarea
            v-model="newMessage"
            placeholder="Mensaje..."
            :auto-grow="true"
            rows="1"
            class="custom-textarea"
            @keydown.enter.prevent="sendMessage"
            ref="inputRef"
          ></ion-textarea>
          
          <ion-button 
            shape="round" 
            class="send-button" 
            @click="sendMessage" 
            :disabled="!newMessage.trim()"
          >
            <ion-icon slot="icon-only" :icon="send" color="light"></ion-icon>
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useChatStore } from '../stores/chat.js';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';
import { 
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, 
  IonContent, IonFooter, IonTextarea, IonButton, IonIcon, IonSpinner, IonAvatar
} from '@ionic/vue';
import { send, ellipsisVertical, happy, close } from 'ionicons/icons';

// 1. IMPORTAR LA LIBRERÍA
import EmojiPicker from 'vue3-emoji-picker';
// Importar CSS de la librería
import 'vue3-emoji-picker/css';

const route = useRoute();
const chatStore = useChatStore();
const authStore = useAuthStore();
const contentRef = ref(null);

const conversationId = route.params.id;
const newMessage = ref('');
const loading = ref(true);
const showEmojiPicker = ref(false);

const messages = computed(() => chatStore.messages[conversationId] || []);
const currentConvo = computed(() => chatStore.conversations.find(c => c.id === conversationId));
const isGroup = computed(() => currentConvo.value?.isGroup);

const chatTitle = computed(() => {
  if (!currentConvo.value) return 'Chat';
  if (currentConvo.value.isGroup) return currentConvo.value.name;
  const other = currentConvo.value.expand?.participants?.find(p => p.id !== authStore.user?.id);
  return other?.username || other?.name || 'Usuario';
});

const PLACEHOLDER_AVATAR = 'https://ionicframework.com/docs/img/demos/avatar.svg';

const chatAvatar = computed(() => {
  if (!currentConvo.value) return PLACEHOLDER_AVATAR;
  if (currentConvo.value.isGroup) return PLACEHOLDER_AVATAR;
  
  const other = currentConvo.value.expand?.participants?.find(p => p.id !== authStore.user?.id);
  
  if (other?.avatar && other?.collectionId) {
     return pb.files.getUrl(other, other.avatar, { thumb: '100x100' });
  }
  return PLACEHOLDER_AVATAR;
});

function handleImageError(event) {
  event.target.src = PLACEHOLDER_AVATAR;
}

function isMe(msg) { return msg.sender === authStore.user?.id; }

function shouldShowName(msg, index) {
  if (!isGroup.value || isMe(msg)) return false;
  if (index === 0) return true;
  const prevMsg = messages.value[index - 1];
  return prevMsg.sender !== msg.sender;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
  // Scroll al fondo si abrimos el teclado de emojis
  if(showEmojiPicker.value) scrollToBottom();
}

function onSelectEmoji(emoji) {
  newMessage.value += emoji.i; // .i contiene el carácter del emoji
}

async function sendMessage() {
  if (!newMessage.value.trim()) return;
  const text = newMessage.value;
  newMessage.value = ''; 
  showEmojiPicker.value = false;
  
  await chatStore.sendMessage(conversationId, text);
  scrollToBottom();
}

function scrollToBottom() {
  setTimeout(() => {
    contentRef.value?.$el.scrollToPoint(0, 99999, 300);
  }, 100);
}

onMounted(async () => {
  await chatStore.fetchMessages(conversationId);
  loading.value = false;
  scrollToBottom();
  await chatStore.subscribeToConversation(conversationId);
});

onUnmounted(() => {
  chatStore.unsubscribeFromConversation();
});

watch(() => messages.value.length, () => {
  scrollToBottom();
});
</script>

<style scoped>
/* Estilos Dark Mode */
.chat-content { --background: #0b141a; }
.chat-toolbar { --background: #1f2c34; --color: #e9edef; }
.chat-title { color: #e9edef; font-weight: 600; }
.header-avatar { width: 36px; height: 36px; margin-right: 8px; }

.messages-container { display: flex; flex-direction: column; padding: 10px 10px 20px 10px; gap: 4px; }
.top-spacer { margin-top: 20px; }

.message-row { display: flex; flex-direction: column; max-width: 80%; margin-bottom: 8px; }
.my-message { align-self: flex-end; align-items: flex-end; }
.other-message { align-self: flex-start; align-items: flex-start; }

.message-bubble { padding: 8px 12px; border-radius: 12px; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.3); min-width: 80px; }
.my-message .message-bubble { background: #005c4b; color: #e9edef; border-top-right-radius: 0; }
.other-message .message-bubble { background: #202c33; color: #e9edef; border-top-left-radius: 0; }

.text-content { font-size: 1rem; line-height: 1.4; white-space: pre-wrap; }
.message-meta { display: flex; justify-content: flex-end; align-items: center; margin-top: 4px; gap: 4px; }
.time { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
.ticks { font-size: 0.75rem; color: #53bdeb; }
.message-sender { font-size: 0.8rem; color: #8696a0; margin-left: 12px; margin-bottom: 2px; font-weight: bold; }

/* Footer y Picker */
.chat-footer { background: #1f2c34; border-top: 1px solid #2a3942; }
.emoji-container { background: #1f2c34; border-bottom: 1px solid #2a3942; }
.input-toolbar { --background: #1f2c34; --border-color: transparent; padding: 6px; }
.input-area { display: flex; align-items: flex-end; gap: 8px; width: 100%; }
.emoji-btn { margin: 0; height: 40px; }

.custom-textarea {
  background: #2a3942; color: #fff; border-radius: 24px; padding-left: 16px; padding-right: 16px;
  --padding-top: 10px; --padding-bottom: 10px; max-height: 120px; overflow-y: auto; border: none;
  --placeholder-color: #8696a0; --placeholder-opacity: 1;
}

.send-button {
  --border-radius: 50%; width: 45px; height: 45px; margin-bottom: 2px;
  --background: #00a884; --background-activated: #008f6f;
}

.empty-state { display: flex; justify-content: center; margin-top: 60px; }
.empty-bubble { background: #1f2c34; padding: 20px; border-radius: 16px; text-align: center; color: #e9edef; border: 1px solid #2a3942; }
</style>
