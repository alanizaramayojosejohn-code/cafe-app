import { Timestamp } from '@angular/fire/firestore'

export interface InventoryNote {
   id: string
   text: string
   createdBy: string
   createdByName: string
   createdAt: Timestamp
   resolved: boolean
   resolvedAt?: Timestamp
   resolvedBy?: string
}

export interface InventoryNoteCreate {
   text: string
   createdBy: string
   createdByName: string
}
