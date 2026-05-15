import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { registerLocaleData } from '@angular/common'
import localeEsBo from '@angular/common/locales/es-BO'

import { FILE_VALIDATION_CONFIG, DEFAULT_FILE_VALIDATION_CONFIG } from './models/interface.config'
import { provideFirebaseApp, initializeApp } from '@angular/fire/app'
import { provideAuth, getAuth } from '@angular/fire/auth'
import { provideFirestore, getFirestore } from '@angular/fire/firestore'
import { provideStorage, getStorage } from '@angular/fire/storage'

import { routes } from './app.routes'
import { environment } from '../environments/environment'

registerLocaleData(localeEsBo)

export const appConfig: ApplicationConfig = {
   providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes),
      provideAnimationsAsync(),

      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
      provideStorage(() => getStorage()),
      { provide: LOCALE_ID, useValue: 'es-BO' },
      {
         provide: FILE_VALIDATION_CONFIG,
         useValue: DEFAULT_FILE_VALIDATION_CONFIG,
      },
   ],
}
