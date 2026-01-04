import { Injectable, inject, NgZone } from '@angular/core';
import { Database, ref, set, get, push, remove, onValue } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDatabaseService {
  private db = inject(Database);
  private ngZone = inject(NgZone);

  async create<T>(path: string, data: T): Promise<string> {
    const dbRef = ref(this.db, path);
    const newRef = push(dbRef);
    const id = newRef.key!;
    await set(newRef, { ...data, id });
    return id;
  }

  async getAll<T>(path: string): Promise<T[]> {
    const dbRef = ref(this.db, path);
    const snapshot = await get(dbRef);
    const data = snapshot.val();

    if (!data) return [];

    return Object.keys(data).map((key) => data[key]);
  }

  listen<T>(path: string): Observable<T[]> {
    return new Observable((observer) => {
      const dbRef = ref(this.db, path);

      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          // Ejecutar dentro de NgZone para que Angular detecte los cambios
          this.ngZone.run(() => {
            const data = snapshot.val();
            if (!data) {
              observer.next([]);
              return;
            }
            const items = Object.keys(data).map((key) => data[key]);
            observer.next(items);
          });
        },
        (error) => {
          this.ngZone.run(() => observer.error(error));
        }
      );

      return () => unsubscribe();
    });
  }

  async update<T>(path: string, id: string, data: T): Promise<void> {
    const dbRef = ref(this.db, `${path}/${id}`);
    await set(dbRef, { ...data, id });
  }

  async delete(path: string, id: string): Promise<void> {
    const dbRef = ref(this.db, `${path}/${id}`);
    await remove(dbRef);
  }
}
