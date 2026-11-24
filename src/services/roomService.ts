import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
  type UpdateData,
} from 'firebase/firestore';
import type {
  ChatMessage,
  DiceBroadcast,
  GameLogEntry,
  RoomChatDoc,
  RoomParticipant,
  RoomState,
  RulerSecretDoc,
  SecretCommandsDoc,
} from '../types/game';
import { db } from './firebase';

export interface RoomDocWithPin extends RoomState {
  rulerPin?: string | null;
}

function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
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
  rulerName?: string;
  rulerPin?: string;
  secretGrailTurn: 10 | 11 | 12;
  excludeDuplicateSummer?: boolean;
  excludeDuplicateAlter?: boolean;
}): Promise<{ roomId: string; roomState: RoomDocWithPin }> {
  const roomId = generateRoomCode();
  const roomRef = doc(db, 'rooms', roomId);
  const now = Date.now();
  const cleanRulerName = params.rulerName?.trim() || 'Ruler';

  const rulerParticipant: RoomParticipant = {
    uid: params.rulerUid,
    name: cleanRulerName,
    joinedAt: now,
  };

  const payload: RoomDocWithPin = stripUndefined({
    ...params.initialState,
    roomId,
    createdAt: now,
    gameStarted: false,
    excludeDuplicateSummer:
      params.excludeDuplicateSummer ??
      params.initialState.excludeDuplicateSummer ??
      true,
    excludeDuplicateAlter:
      params.excludeDuplicateAlter ??
      params.initialState.excludeDuplicateAlter ??
      true,
    seats: {
      rulerUid: params.rulerUid,
      masterAUid: null,
      masterBUid: null,
    },
    participants: {
      [params.rulerUid]: rulerParticipant,
    },
    rulerPin: params.rulerPin?.trim() ? params.rulerPin.trim() : null,
  });

  await setDoc(roomRef, payload);

  // Initialize the 3 secret documents + dedicated public chat document
  const rulerSecret: RulerSecretDoc = {
    secretGrailTurn: params.secretGrailTurn,
  };
  const initialChat: RoomChatDoc = {
    messages: [],
    updatedAt: now,
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
    setDoc(doc(db, 'rooms', roomId, 'chat', 'public'), initialChat),
  ]);

  return { roomId, roomState: payload };
}

export const createRoom = createOnlineRoom;

export async function fetchRoomSnapshot(
  rawRoomId: string
): Promise<RoomDocWithPin | null> {
  const roomId = rawRoomId.trim().toUpperCase();
  if (!roomId) return null;
  const snap = await getDoc(doc(db, 'rooms', roomId));
  if (!snap.exists()) return null;
  const data = snap.data() as RoomDocWithPin;
  return {
    ...data,
    participants: data.participants ?? {},
  };
}

export async function joinRoomLobby(
  rawRoomId: string,
  uid: string,
  name: string
): Promise<{ ok: boolean; room?: RoomDocWithPin; error?: string }> {
  const roomId = rawRoomId.trim().toUpperCase();
  const cleanName = name.trim();
  if (!roomId) {
    return { ok: false, error: 'กรุณากรอกรหัสห้อง (Room Code)' };
  }
  if (!cleanName) {
    return { ok: false, error: 'กรุณากรอกชื่อเล่น (Nickname)' };
  }

  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) {
    return { ok: false, error: `ไม่พบห้อง "${roomId}" กรุณาตรวจสอบรหัสห้องอีกครั้ง` };
  }

  const data = snap.data() as RoomDocWithPin;
  const existing = data.participants?.[uid];
  const participant: RoomParticipant = {
    uid,
    name: cleanName,
    joinedAt: existing?.joinedAt ?? Date.now(),
  };

  await updateDoc(roomRef, {
    [`participants.${uid}`]: participant,
  });

  const mergedRoom: RoomDocWithPin = {
    ...data,
    participants: {
      ...(data.participants ?? {}),
      [uid]: participant,
    },
  };

  return { ok: true, room: mergedRoom };
}

export async function leaveRoomLobby(roomId: string, uid: string): Promise<void> {
  const cleanRoomId = roomId.trim().toUpperCase();
  if (!cleanRoomId || !uid) return;
  const roomRef = doc(db, 'rooms', cleanRoomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const data = snap.data() as RoomDocWithPin;
  const updates: UpdateData<DocumentData> = {
    [`participants.${uid}`]: deleteField(),
  };

  if (data.seats.masterAUid === uid || data.seats.masterBUid === uid) {
    updates.seats = {
      ...data.seats,
      masterAUid: data.seats.masterAUid === uid ? null : data.seats.masterAUid,
      masterBUid: data.seats.masterBUid === uid ? null : data.seats.masterBUid,
    };
  }

  await updateDoc(roomRef, updates);
}

export async function assignParticipantSeat(
  roomId: string,
  targetUid: string,
  role: 'master_a' | 'master_b' | null
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const data = snap.data() as RoomDocWithPin;
  if (targetUid === data.seats.rulerUid) return;

  const nextSeats = { ...data.seats };
  if (nextSeats.masterAUid === targetUid) nextSeats.masterAUid = null;
  if (nextSeats.masterBUid === targetUid) nextSeats.masterBUid = null;

  if (role === 'master_a') {
    nextSeats.masterAUid = targetUid;
  } else if (role === 'master_b') {
    nextSeats.masterBUid = targetUid;
  }

  await updateDoc(roomRef, { seats: nextSeats });
}

export async function swapMasterSeats(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const data = snap.data() as RoomDocWithPin;
  const nextSeats = {
    ...data.seats,
    masterAUid: data.seats.masterBUid,
    masterBUid: data.seats.masterAUid,
  };

  const nameA = nextSeats.masterAUid
    ? data.participants?.[nextSeats.masterAUid]?.name ?? 'Master A'
    : 'ว่าง';
  const nameB = nextSeats.masterBUid
    ? data.participants?.[nextSeats.masterBUid]?.name ?? 'Master B'
    : 'ว่าง';

  const swapLog: GameLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    turn: data.turn,
    timestamp: Date.now(),
    actor: 'ruler',
    message: `Ruler สลับฝั่งผู้เล่น (Master A ↔ Master B): Team A = ${nameA}, Team B = ${nameB}`,
  };

  const nextLogs: GameLogEntry[] = [swapLog, ...(data.logs ?? [])].slice(0, 50);

  await updateDoc(roomRef, {
    seats: nextSeats,
    logs: stripUndefined(nextLogs),
  });
}

export async function kickParticipant(
  roomId: string,
  targetUid: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const data = snap.data() as RoomDocWithPin;
  // Never allow kicking the Ruler
  if (targetUid === data.seats.rulerUid) return;

  const updates: UpdateData<DocumentData> = {
    [`participants.${targetUid}`]: deleteField(),
  };

  if (data.seats.masterAUid === targetUid || data.seats.masterBUid === targetUid) {
    updates.seats = {
      ...data.seats,
      masterAUid: data.seats.masterAUid === targetUid ? null : data.seats.masterAUid,
      masterBUid: data.seats.masterBUid === targetUid ? null : data.seats.masterBUid,
    };
  }

  await updateDoc(roomRef, updates);
}

export async function startGame(roomId: string): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), {
    gameStarted: true,
  });
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
        const data = snap.data() as RoomDocWithPin;
        onData({
          ...data,
          participants: data.participants ?? {},
        });
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export function subscribeToChat(
  roomId: string,
  callback: (chatDoc: RoomChatDoc) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'rooms', roomId, 'chat', 'public'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<RoomChatDoc>;
        callback({
          messages: Array.isArray(data.messages) ? data.messages : [],
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
        });
      } else {
        callback({ messages: [], updatedAt: 0 });
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function sendChatMessage(
  roomId: string,
  message: ChatMessage
): Promise<void> {
  const chatRef = doc(db, 'rooms', roomId, 'chat', 'public');
  const cleanMsg = stripUndefined(message);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(chatRef);
    const existing = snap.exists()
      ? ((snap.data() as Partial<RoomChatDoc>).messages ?? [])
      : [];
    const nextMessages = [...existing, cleanMsg].slice(-50);
    const payload: RoomChatDoc = {
      messages: nextMessages,
      updatedAt: Date.now(),
    };
    tx.set(chatRef, payload);
  });
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
  const clean = stripUndefined(state);
  await setDoc(doc(db, 'rooms', roomId), clean, { merge: true });
}

export async function updateRulerSecretDoc(
  roomId: string,
  secret: RulerSecretDoc
): Promise<void> {
  await setDoc(doc(db, 'rooms', roomId, 'secrets', 'ruler'), stripUndefined(secret), {
    merge: true,
  });
}

export async function submitMasterSecretOrders(params: {
  roomId: string;
  masterKey: 'master_a' | 'master_b';
  ordersDoc: SecretCommandsDoc;
  currentTeams?: RoomState['teams'];
  setReadyLocked?: boolean;
}): Promise<void> {
  const cleanDoc = stripUndefined(params.ordersDoc);
  await setDoc(
    doc(db, 'rooms', params.roomId, 'secrets', params.masterKey),
    cleanDoc
  );

  if (params.currentTeams && typeof params.setReadyLocked === 'boolean') {
    const teamKey = params.masterKey === 'master_a' ? 'team_a' : 'team_b';
    await updateDoc(doc(db, 'rooms', params.roomId), {
      teams: {
        ...params.currentTeams,
        [teamKey]: {
          ...params.currentTeams[teamKey],
          readyLocked: params.setReadyLocked,
        },
      },
    });
  }
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
    ...(params.currentOrders ?? emptySecretCommands(params.turn)),
    turn: params.turn,
    locked: false,
    updatedAt: Date.now(),
    orders: params.currentOrders?.orders ?? [],
    ...(params.currentOrders?.deployment
      ? {
          deployment: {
            ...params.currentOrders.deployment,
            locked: false,
          },
        }
      : {}),
  };
  await submitMasterSecretOrders({
    roomId: params.roomId,
    masterKey: params.masterKey,
    ordersDoc: nextDoc,
    currentTeams: params.currentTeams,
    setReadyLocked: false,
  });
}

export async function broadcastDiceRoll(
  roomId: string,
  diceBroadcast: DiceBroadcast,
  logs: GameLogEntry[]
): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), {
    diceBroadcast: stripUndefined(diceBroadcast),
    logs: stripUndefined(logs),
  });
}
