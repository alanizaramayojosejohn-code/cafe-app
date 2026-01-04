import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore'; // ← AGREGAR

const firebaseConfig = {
  apiKey: 'AIzaSyDoTD2PCqvCWUNKeiFr5RB-gmRf2CMwTnM',
  authDomain: 'cafe-app-776ee.firebaseapp.com',
  databaseURL: 'https://cafe-app-776ee-default-rtdb.firebaseio.com',
  projectId: 'cafe-app-776ee',
  storageBucket: 'cafe-app-776ee.firebasestorage.app',
  messagingSenderId: '601659291354',
  appId: '1:601659291354:web:56284432271c51b5d957e3',
  measurementId: 'G-8KY70GT8HY',
};
export const appConfig: ApplicationConfig = {
  providers: [
    // provideZoneChangeDetection({ eventCoalescing: true }), ← COMENTAR ESTA LÍNEA
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore())
  ],
};
