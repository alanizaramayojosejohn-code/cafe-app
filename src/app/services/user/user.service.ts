import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   doc,
   setDoc,
   getDoc,
   getDocs,
   updateDoc,
   deleteDoc,
   collectionData,
   query,
   where,
   Timestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import {
   AppUser,
   PendingUser,
   PendingUserCreate,
   SalaryPeriod,
   UserRole,
} from '../../models/user.model'

@Injectable({
   providedIn: 'root',
})
export class UserService {
   private firestore = inject(Firestore)
   private usersCollection = collection(this.firestore, 'users')
   private pendingCollection = collection(this.firestore, 'pendingUsers')

   async getUserByUid(uid: string): Promise<AppUser | null> {
      const userDoc = doc(this.firestore, `users/${uid}`)
      const snapshot = await getDoc(userDoc)

      if (snapshot.exists()) {
         return { id: snapshot.id, ...snapshot.data() } as AppUser
      }
      return null
   }

   getUsers(): Observable<AppUser[]> {
      return collectionData(this.usersCollection, { idField: 'id' }) as Observable<AppUser[]>
   }

   getPendingUsers(): Observable<PendingUser[]> {
      return collectionData(this.pendingCollection, { idField: 'id' }) as Observable<PendingUser[]>
   }

   async createPendingUser(data: PendingUserCreate): Promise<void> {
      const email = data.email.trim().toLowerCase()

      const pendingRef = doc(this.firestore, `pendingUsers/${email}`)
      const existingPending = await getDoc(pendingRef)
      if (existingPending.exists()) {
         throw new Error('Ya existe una invitación para este correo')
      }

      const usersQuery = query(this.usersCollection, where('email', '==', email))
      const existingUsers = await getDocs(usersQuery)
      if (!existingUsers.empty) {
         throw new Error('Este correo ya está registrado como usuario activo')
      }

      await setDoc(pendingRef, {
         email,
         displayName: data.displayName,
         role: data.role,
         isActive: data.isActive ?? true,
         salary: data.salary ?? 0,
         salaryPeriod: data.salaryPeriod ?? 'mensual',
         invitedAt: Timestamp.now(),
         invitedBy: data.invitedBy,
      })
   }

   async updatePendingUser(email: string, data: Partial<PendingUserCreate>): Promise<void> {
      const ref = doc(this.firestore, `pendingUsers/${email.toLowerCase()}`)
      const payload: Record<string, unknown> = { ...data }
      delete payload['email']
      await updateDoc(ref, payload)
   }

   async deletePendingUser(email: string): Promise<void> {
      await deleteDoc(doc(this.firestore, `pendingUsers/${email.toLowerCase()}`))
   }

   async updateUser(uid: string, data: Partial<AppUser>): Promise<void> {
      const ref = doc(this.firestore, `users/${uid}`)
      const payload: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() }
      delete payload['id']
      delete payload['createdAt']
      delete payload['email']
      await updateDoc(ref, payload)
   }

   async updateUserRole(uid: string, role: UserRole): Promise<void> {
      await this.updateUser(uid, { role })
   }

   async updateUserSalary(uid: string, salary: number, salaryPeriod: SalaryPeriod): Promise<void> {
      await this.updateUser(uid, { salary, salaryPeriod })
   }

   async toggleUserStatus(uid: string, isActive: boolean): Promise<void> {
      await this.updateUser(uid, { isActive })
   }

   async softDeleteUser(uid: string): Promise<void> {
      await this.updateUser(uid, { isActive: false })
   }

   async provisionUser(
      uid: string,
      email: string,
      fallbackDisplayName: string
   ): Promise<AppUser | null> {
      const normalizedEmail = email.toLowerCase()

      const userRef = doc(this.firestore, `users/${uid}`)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
         return { id: userSnap.id, ...userSnap.data() } as AppUser
      }

      const pendingRef = doc(this.firestore, `pendingUsers/${normalizedEmail}`)
      const pendingSnap = await getDoc(pendingRef)

      if (!pendingSnap.exists()) {
         return null
      }

      const pending = pendingSnap.data() as Omit<PendingUser, 'id'>

      const now = Timestamp.now()
      const newUser = {
         email: normalizedEmail,
         displayName: pending.displayName || fallbackDisplayName,
         role: pending.role,
         isActive: pending.isActive,
         salary: pending.salary ?? 0,
         salaryPeriod: pending.salaryPeriod ?? 'mensual',
         claimedAt: now,
         createdAt: now,
         updatedAt: now,
      }

      await setDoc(userRef, newUser)
      await deleteDoc(pendingRef)

      return { id: uid, ...newUser } as AppUser
   }
}
