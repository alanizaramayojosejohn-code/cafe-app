import { Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { Subscription } from 'rxjs'
import { InventoryNoteService } from '../../../../services/inventory/inventory-note.service'

interface MenuItem {
   label: string
   icon: string
   route: string
   exact?: boolean
   badgeKey?: 'inventoryNotes'
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

   menuItems: MenuItem[] = [
      { label: 'Inicio', icon: 'dashboard', route: '/caja', exact: true },
      { label: 'Ventas', icon: 'shopping_cart', route: '/caja/ventas' },
      { label: 'Órdenes', icon: 'receipt', route: '/caja/ordenes' },
      { label: 'Notas', icon: 'sticky_note_2', route: '/caja/notas', badgeKey: 'inventoryNotes' },
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
