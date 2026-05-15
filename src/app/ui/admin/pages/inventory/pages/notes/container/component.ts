import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DatePipe } from '@angular/common'
import { Subscription } from 'rxjs'
import { InventoryNoteService } from '../../../../../../../services/inventory/inventory-note.service'
import { AuthService } from '../../../../../../../services/auth/auth.service'
import { InventoryNote } from '../../../../../../../models/inventory-note.model'

type NoteFilter = 'pending' | 'resolved' | 'all'

@Component({
   selector: 'app-inventory-notes',
   imports: [FormsModule, DatePipe],
   templateUrl: './component.html',
})
export default class InventoryNotesComponent implements OnInit, OnDestroy {
   private noteService = inject(InventoryNoteService)
   private authService = inject(AuthService)

   notes = signal<InventoryNote[]>([])
   loading = signal(true)
   filter = signal<NoteFilter>('pending')
   newText = signal('')
   submitting = signal(false)
   working = signal<string | null>(null)

   private sub?: Subscription

   isAdmin = computed(() => this.authService.currentRole() === 'admin')

   filtered = computed(() => {
      const list = this.notes()
      switch (this.filter()) {
         case 'pending':
            return list.filter((n) => !n.resolved)
         case 'resolved':
            return list.filter((n) => n.resolved)
         case 'all':
            return list
      }
   })

   counts = computed(() => {
      const list = this.notes()
      return {
         total: list.length,
         pending: list.filter((n) => !n.resolved).length,
         resolved: list.filter((n) => n.resolved).length,
      }
   })

   ngOnInit() {
      this.sub = this.noteService.getAll().subscribe((notes) => {
         this.notes.set(notes)
         this.loading.set(false)
      })
   }

   ngOnDestroy() {
      this.sub?.unsubscribe()
   }

   setFilter(f: NoteFilter) {
      this.filter.set(f)
   }

   async crear() {
      const text = this.newText().trim()
      if (!text) return

      const fbUser = this.authService.getCurrentUser()
      const appUser = this.authService.userData()
      if (!fbUser) {
         alert('Sesión expirada')
         return
      }

      this.submitting.set(true)
      try {
         await this.noteService.create({
            text,
            createdBy: fbUser.uid,
            createdByName: appUser?.displayName ?? fbUser.email ?? 'Usuario',
         })
         this.newText.set('')
      } catch (error) {
         console.error('Error al crear nota:', error)
         alert(error instanceof Error ? error.message : 'Error al crear la nota')
      } finally {
         this.submitting.set(false)
      }
   }

   async resolver(note: InventoryNote) {
      const uid = this.authService.getCurrentUser()?.uid
      if (!uid) return
      this.working.set(note.id)
      try {
         await this.noteService.resolve(note.id, uid)
      } catch (error) {
         console.error('Error al resolver nota:', error)
         alert('Error al marcar como resuelta')
      } finally {
         this.working.set(null)
      }
   }

   async reabrir(note: InventoryNote) {
      this.working.set(note.id)
      try {
         await this.noteService.reopen(note.id)
      } catch (error) {
         console.error('Error al reabrir nota:', error)
         alert('Error al reabrir la nota')
      } finally {
         this.working.set(null)
      }
   }

   async eliminar(note: InventoryNote) {
      if (!confirm('¿Eliminar definitivamente esta nota?')) return
      this.working.set(note.id)
      try {
         await this.noteService.delete(note.id)
      } catch (error) {
         console.error('Error al eliminar nota:', error)
         alert('Error al eliminar la nota')
      } finally {
         this.working.set(null)
      }
   }
}
