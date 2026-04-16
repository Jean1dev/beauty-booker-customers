import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { Appointment } from '@/types/appointment';

/**
 * Assina em tempo real todos os agendamentos do cliente pelo telefone.
 * Sem orderBy para evitar índice composto — ordenação feita no cliente.
 * Retorna a função de cancelamento do listener.
 */
export function subscribeAppointments(
  phone: string,
  onData: (appointments: Appointment[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'appointments'),
    where('clientPhone', '==', phone),
  );

  return onSnapshot(
    q,
    (snap) => {
      const appointments = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      onData(appointments);
    },
    onError,
  );
}
