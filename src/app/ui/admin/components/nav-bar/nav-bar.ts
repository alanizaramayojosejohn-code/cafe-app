import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { AuthService } from '../../../../services/auth/auth.service'
import { SidebarService } from '../../../../services/sidebar/sidebar.service'
import { ThemeService } from '../../../../services/theme/theme.service'
import { NavbarOptionsComponent } from '../navbar-options/navbar-options'
import { User } from '@angular/fire/auth'

@Component({
   selector: 'x-navbar',
   imports: [CommonModule, RouterLink, NavbarOptionsComponent],
   templateUrl: './nav-bar.html',
})
export class NavbarComponent implements OnInit {
   private sidebar = inject(SidebarService)
   private theme = inject(ThemeService)
   user = signal<User | null>(null)

   collapsed = this.sidebar.collapsed
   mobileOpen = this.sidebar.mobileOpen
   isDark = this.theme.dark

   constructor(public authService: AuthService) {}

   ngOnInit() {
      this.authService.user$.subscribe((user) => {
         this.user.set(user)
      })
   }

   async logout() {
      await this.authService.logout()
   }

   toggleTheme() {
      this.theme.toggle()
   }

   toggleCollapsed() {
      this.sidebar.toggle()
   }

   openMobile() {
      this.sidebar.openMobile()
   }

   closeMobile() {
      this.sidebar.closeMobile()
   }

   getUserDisplayName(): string {
      const u = this.user()
      return u?.displayName ?? u?.email?.split('@')[0] ?? 'Usuario'
   }

   getUserEmail(): string {
      return this.user()?.email || ''
   }

   getInitial(): string {
      return this.getUserDisplayName().charAt(0).toUpperCase()
   }
}
