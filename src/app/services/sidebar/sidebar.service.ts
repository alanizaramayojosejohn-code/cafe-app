import { Injectable, effect, signal } from '@angular/core'

const LS_KEY = 'pp.sidebar.collapsed'

/**
 * Estado global del sidebar (admin / cocina).
 *  - collapsed: rail de íconos (72px) en lg+, expande al togglear.
 *  - mobileOpen: drawer overlay en < lg.
 * Publica la variable CSS `--sb-inset` para que el contenido ajuste su padding
 * izquierdo en desktop sin acoplarse a clases Tailwind arbitrarias.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
   readonly collapsed = signal<boolean>(this.loadCollapsed())
   readonly mobileOpen = signal<boolean>(false)

   constructor() {
      effect(() => {
         const c = this.collapsed()
         if (typeof document !== 'undefined') {
            // Collapsed = rail edge-to-edge 72px + 32 aire = 104.
            // Expanded = card flotante (16 margen + 240 ancho + 32 aire) = 288.
            document.documentElement.style.setProperty(
               '--sb-inset',
               c ? '104px' : '288px'
            )
         }
         try {
            localStorage.setItem(LS_KEY, c ? '1' : '0')
         } catch {
            /* ignore */
         }
      })
   }

   toggle(): void {
      this.collapsed.update((v) => !v)
   }

   openMobile(): void {
      this.mobileOpen.set(true)
   }

   closeMobile(): void {
      this.mobileOpen.set(false)
   }

   toggleMobile(): void {
      this.mobileOpen.update((v) => !v)
   }

   private loadCollapsed(): boolean {
      try {
         return localStorage.getItem(LS_KEY) === '1'
      } catch {
         return false
      }
   }
}
