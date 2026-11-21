import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  Role,
  RoomState,
  RulerSecretDoc,
  SecretCommandsDoc,
} from '../types/game';
import { db } from './firebase';

export interface RoomDocWithPin extends RoomState {
  rulerPin?: string | null;
}

export function generateRoomCode(): string {
  const digits = Math.floor(100 + Math.random() * 900);
  return `FGO-${digits}`;
}

function emptySecretCommands(turn: number): SecretCommandsDoc {
  return {
    turn,
    locked: false,
    updatedAt: Date.now(),
    orders: [],
  };
}

export async function createOnlineRoom(params: {
  initialState: RoomState;
  rulerUid: string;
  rulerPin?: string;
  secretGrailTurn: 10 | 11 | 12;
}): Promise<string> {
  const roomId = generateRoomCode();
  const roomRef = doc(db, 'rooms', roomId);

  const payload: RoomDocWithPin = {
    ...params.initialState,
    roomId,
    createdAt: Date.now(),
    seats: {
      rulerUid: params.rulerUid,
      masterAUid: null,
      masterBUid: null,
    },
    rulerPin: params.rulerPin?.trim() ? params.rulerPin.trim() : null,
  };

  await setDoc(roomRef, payload);

  // Initialize the 3 secret documents (Ruler has full write permission on all 3)
  const rulerSecret: RulerSecretDoc = {
    secretGrailTurn: params.secretGrailTurn,
  };
  await Promise.all([
    setDoc(doc(db, 'rooms', roomId, 'secrets', 'ruler'), rulerSecret),
    setDoc(
      doc(db, 'rooms', roomId, 'secrets', 'master_a'),
      emptySecretCommands(payload.turn)
    ),
    setDoc(
      doc(db, 'rooms', roomId, 'secrets', 'master_b'),
      emptySecretCommands(payload.turn)
    ),
  ]);

  return roomId;
}

export async function fetchRoomSnapshot(
  rawRoomId: string
): Promise<RoomDocWithPin | null> {
  const roomId = rawRoomId.trim().toUpperCase();
  if (!roomId) return null;
  const snap = await getDoc(doc(db, 'rooms', roomId));
  if (!snap.exists()) return null;
  return snap.data() as RoomDocWithPin;
}

export async function claimRoomSeat(params: {
  roomId: string;
  role: Role;
  uid: string;
  pin?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const roomId = params.roomId.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) {
    return { ok: false, error: 'ไม่พบห้องรหัสนี้ กรุณาตรวจสอบอีกครั้ง' };
  }

  const data = snap.data() as RoomDocWithPin;
  const seatKey =
    params.role === 'ruler'
      ? 'rulerUid'
      : params.role === 'master_a'
        ? 'masterAUid'
        : 'masterBUid';

  const currentHolder = data.seats[seatKey];

  // Already seated on this device -> immediate rejoin
  if (currentHolder === params.uid) {
    return { ok: true };
  }

  // Occupied by another device
  if (currentHolder && currentHolder !== params.uid) {
    return {
      ok: false,
      error: 'ที่นั่งนี้มีผู้เล่นอื่นนั่งอยู่แล้ว (ให้ Ruler กด Reset Seat หากเปลี่ยนเครื่อง)',
    };
  }

  // Optional 4-digit Ruler PIN check
  if (params.role === 'ruler' && data.rulerPin) {
    if ((params.pin ?? '').trim() !== data.rulerPin) {
      return { ok: false, error: 'รหัส PIN ของ Ruler ไม่ถูกต้อง' };
    }
  }

  await updateDoc(roomRef, {
    seats: {
      ...data.seats,
      [seatKey]: params.uid,
    },
  });

  return { ok: true };
}

export async function resetRoomSeat(
  roomId: string,
  role: 'master_a' | 'master_b',
  currentSeats: RoomState['seats']
): Promise<void> {
  const seatKey = role === 'master_a' ? 'masterAUid' : 'masterBUid';
  await updateDoc(doc(db, 'rooms', roomId), {
    seats: {
      ...currentSeats,
      [seatKey]: null,
    },
  });
}

export function subscribeRoomState(
  roomId: string,
  onData: (room: RoomDocWithPin) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'rooms', roomId),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as RoomDocWithPin);
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export function subscribeSecretCommands(
  roomId: string,
  masterKey: 'master_a' | 'master_b',
  onData: (docData: SecretCommandsDoc) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'rooms', roomId, 'secrets', masterKey),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SecretCommandsDoc);
      }
    },
    () => {
      // Permission-denied ignored gracefully if role does not own this secret doc
    }
  );
}

export function subscribeRulerSecret(
  roomId: string,
  onData: (docData: RulerSecretDoc) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'rooms', roomId, 'secrets', 'ruler'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as RulerSecretDoc);
      }
    },
    () => {
      // Only Ruler can read secrets/ruler
    }
  );
}

/**
 * Writes the full RoomState to Firestore (Ruler explicit user action only!).
 * Never invoke from a useEffect tied to onSnapshot.
 */
export async function syncRoomStateToFirestore(
  roomId: string,
  state: RoomState
): Promise<void> {
  // Strip undefined values cleanly for Firestore
  const clean = JSON.parse(JSON.stringify(state)) as RoomState;
  await setDoc(doc(db, 'rooms', roomId), clean, { merge: true });
}

export async function updateRulerSecretDoc(
  roomId: string,
  secret: RulerSecretDoc
): Promise<void> {
  await setDoc(doc(db, 'rooms', roomId, 'secrets', 'ruler'), secret, { merge: true });
}

export async function submitMasterSecretOrders(params: {
  roomId: string;
  masterKey: 'master_a' | 'master_b';
  ordersDoc: SecretCommandsDoc;
  currentTeams: RoomState['teams'];
}): Promise<void> {
  const cleanDoc = JSON.parse(JSON.stringify(params.ordersDoc)) as SecretCommandsDoc;
  await setDoc(
    doc(db, 'rooms', params.roomId, 'secrets', params.masterKey),
    cleanDoc
  );

  const teamKey = params.masterKey === 'master_a' ? 'team_a' : 'team_b';
  await updateDoc(doc(db, 'rooms', params.roomId), {
    teams: {
      ...params.currentTeams,
      [teamKey]: {
        ...params.currentTeams[teamKey],
        readyLocked: params.ordersDoc.locked,
      },
    },
  });
}

export async function clearAllSecretOrders(
  roomId: string,
  nextTurn: number
): Promise<void> {
  const empty = emptySecretCommands(nextTurn);
  await Promise.all([
    setDoc(doc(db, 'rooms', roomId, 'secrets', 'master_a'), empty),
    setDoc(doc(db, 'rooms', roomId, 'secrets', 'master_b'), empty),
  ]);
}

export async function unlockMasterSecretOrders(params: {
  roomId: string;
  masterKey: 'master_a' | 'master_b';
  currentOrders: SecretCommandsDoc | null;
  currentTeams: RoomState['teams'];
  turn: number;
}): Promise<void> {
  const nextDoc: SecretCommandsDoc = {
    turn: params.turn,
    locked: false,
    updatedAt: Date.now(),
    orders: params.currentOrders?.orders ?? [],
  };
  await submitMasterSecretOrders({
    roomId: params.roomId,
    masterKey: params.masterKey,
    ordersDoc: nextDoc,
    currentTeams: params.currentTeams,
  });
}
