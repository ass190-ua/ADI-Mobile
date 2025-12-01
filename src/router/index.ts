import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterView.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/events' // Redirige a eventos por defecto
      },
      {
        path: 'events',
        component: () => import('@/views/EventsList.vue') // Lista de eventos
      },
      {
        path: 'events/create',
        component: () => import('@/views/EventCreate.vue') // Crear nuevo evento
      },
      {
        path: 'events/edit/:id',
        component: () => import('@/views/EventCreate.vue')
      },
      {
        path: 'events/:id',
        component: () => import('@/views/EventDetail.vue') // Detalles del evento
      },
      {
        path: 'photos',
        component: () => import('@/views/PhotosList.vue') // Tu galería de fotos
      },
      {
        path: 'chats',
        component: () => import('@/views/ChatList.vue') // Lista de chats
      },
      {
        path: 'chats/friends',
        component: () => import('@/views/FriendsPage.vue') // Lista de amigos
      },
      {
        path: 'chats/:id',
        component: () => import('@/views/ChatDetail.vue') // Detalles del chat
      },
      {
        path: 'profile',
        component: () => import('@/views/ProfilePage.vue') // Tu perfil
      },
      {
        path: 'profile/contact',
        component: () => import('@/views/ContactPage.vue')
      },
      {
        path: 'profile/legal',
        component: () => import('@/views/LegalPage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
