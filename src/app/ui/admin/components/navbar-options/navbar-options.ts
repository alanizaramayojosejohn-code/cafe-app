import { Component, inject, input, OnInit, OnDestroy, output, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { Subscription } from 'rxjs'
import { InventoryNoteService } from '../../../../services/inventory/inventory-note.service'

type BadgeKey = 'inventoryNotes'

interface MenuItem {
   label: string
   icon: string
   route: string
   badgeKey?: BadgeKey
}

interface MenuGroup {
   label: string
   items: MenuItem[]
}

@Component({
   selector: 'app-navbar-options',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive],
   templateUrl: './navbar-options.html',
})
export class NavbarOptionsComponent implements OnInit, OnDestroy {
   private noteService = inject(InventoryNoteService)
   private sub?: Subscription

   collapsed = input<boolean>(false)
   navigate = output<void>()
   pendingNotes = signal(0)

   groups: MenuGroup[] = [
      {
         label: 'PRINCIPAL',
         items: [
            { label: 'Inicio', icon: 'dashboard', route: '/admin/home' },
            { label: 'Ventas', icon: 'shopping_cart', route: '/admin/ventas' },
            { label: 'Órdenes', icon: 'receipt', route: '/admin/ordenes' },
            { label: 'Productos', icon: 'inventory_2', route: '/admin/productos' },
            {
               label: 'Inventario',
               icon: 'warehouse',
               route: '/admin/inventario',
               badgeKey: 'inventoryNotes',
            },
         ],
      },
      {
         label: 'GESTIÓN',
         items: [
            { label: 'Usuarios', icon: 'group', route: '/admin/usuarios' },
            { label: 'Reportes', icon: 'analytics', route: '/admin/reportes' },
         ],
      },
   ]

   ngOnInit() {
      this.sub = this.noteService.getPendingCount().subscribe((c) => this.pendingNotes.set(c))
   }

   ngOnDestroy() {
      this.sub?.unsubscribe()
   }

   badgeFor(item: MenuItem): number {
      if (item.badgeKey === 'inventoryNotes') return this.pendingNotes()
      return 0
   }

   onClick() {
      this.navigate.emit()
   }
}
