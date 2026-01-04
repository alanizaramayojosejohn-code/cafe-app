import { Injectable, inject } from '@angular/core';
import { Database, ref, set, get, push, onValue, remove } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db = inject(Database);

  // Insertar datos con ID automático
  agregarDato(ruta: string, datos: any) {
    const dbRef = ref(this.db, ruta);
    const nuevoRef = push(dbRef);
    return set(nuevoRef, datos);
  }

  // Insertar/actualizar datos con ID específico
  guardarDato(ruta: string, datos: any) {
    const dbRef = ref(this.db, ruta);
    return set(dbRef, datos);
  }

  // Leer datos una vez
  async obtenerDatos(ruta: string) {
    const dbRef = ref(this.db, ruta);
    const snapshot = await get(dbRef);
    return snapshot.val();
  }

  // Escuchar cambios en tiempo real
  escucharDatos(ruta: string, callback: (data: any) => void) {
    const dbRef = ref(this.db, ruta);
    return onValue(dbRef, (snapshot) => {
      callback(snapshot.val());
    });
  }

  // Eliminar datos
  eliminarDato(ruta: string) {
    const dbRef = ref(this.db, ruta);
    return remove(dbRef);
  }
}
