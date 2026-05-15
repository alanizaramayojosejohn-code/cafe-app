import { Component, input, output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'

@Component({
   selector: 'app-navbar-options',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive],
   templateUrl: './navbar-options.html',
})
export class NavbarOptionsComponent {
   collapsed = input<boolean>(false)
   navigate = output<void>()

   menuItems = [
      { label: 'Tablero', icon: 'restaurant_menu', route: '/cocina', exact: true },
      { label: 'Historial', icon: 'history', route: '/cocina/historial', exact: false },
      { label: 'Notas', icon: 'sticky_note_2', route: '/cocina/notas', exact: false },
   ]

   onClick() {
      this.navigate.emit()
   }
}
