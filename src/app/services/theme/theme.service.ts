import { Injectable, effect, signal } from '@angular/core'

const LS_KEY = 'pp.theme'

@Injectable({ providedIn: 'root' })
export class ThemeService {
   readonly dark = signal<boolean>(this.loadDark())

   constructor() {
      effect(() => {
         const d = this.dark()
         if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', d)
            document.body.style.colorScheme = d ? 'dark' : 'light'
         }
         try {
            localStorage.setItem(LS_KEY, d ? '1' : '0')
         } catch { /* ignore */ }
      })
   }

   toggle(): void {
      this.dark.update((v) => !v)
   }

   private loadDark(): boolean {
      try {
         const stored = localStorage.getItem(LS_KEY)
         if (stored !== null) return stored === '1'
         return window.matchMedia('(prefers-color-scheme: dark)').matches
      } catch {
         return false
      }
   }
}
