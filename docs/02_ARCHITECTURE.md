

# 02\_ARCHITECTURE.md — Fate: Holy Grail War (Custom VTT Web App)

เอกสารพิมพ์เขียวสถาปัตยกรรมระบบสำหรับเกมกระดาน Fate: Holy Grail War แบบผู้เล่น 3 คน (Master A, Master B และ Ruler/GM) ออกแบบมาเพื่อใช้พัฒนาด้วย AI Coding Agent (AntiGravity) บน Firebase Spark Plan (ฟรี)  
---

## 1\. แนวคิดการออกแบบหลัก (Core Design Philosophy)

* **Semi-Automated Custom VTT (กึ่งอัตโนมัติ):** ระบบทำหน้าที่ช่วยจัดการงานที่ซับซ้อนและยุ่งยาก เช่น การซิงก์กระดาน 3 โซนแบบ Real-time, ระบบส่งคำสั่งลับพร้อมกัน (WEGO), การวาดเส้นลูกศรคำสั่งซ้อนกันให้ GM เห็น, การคำนวณระยะเดิน/Zone of Control (ZoC), Fog of War, วงล้อสุ่ม และลูกเต๋า  
* **Ruler God-Mode (GM คุมเกมได้อิสระ 100%):** ไม่ต้อง Hardcode ลอจิกสกิลหรือ Noble Phantasm ของ Servant ทั้ง 43 ตน แต่ให้เก็บรายละเอียดสกิลเป็นข้อความใน JSON และเปิดให้ Ruler สามารถลากหมากข้ามช่อง/ข้ามโซน แก้ค่า HP/ATK/MOV/Mana/QP/เรย์จู แปะ Custom Buff Tag และเสก/ลบมอนสเตอร์ได้โดยตรงขณะเล่น  
* **Spark-First Optimization:** ออกแบบโครงสร้างฐานข้อมูลให้ใช้จำนวนการอ่าน/เขียน (Read/Write) ต่ำที่สุด เพื่อให้อยู่ในโควตาฟรีของ Firebase Spark Plan (อ่าน 50,000 / เขียน 20,000 ครั้งต่อวัน) อย่างปลอดภัย และไม่พึ่งพา Cloud Functions หรือ Cloud Storage

## 2\. Tech Stack & Hosting

| ชั้นระบบ (Layer) | เทคโนโลยีที่เลือกใช้ | เหตุผลในการเลือกใช้ |
| :---- | :---- | :---- |
| **Frontend Framework** | React 18+ (Vite) \+ TypeScript | สร้าง SPA ที่รันเร็ว Deploy ขึ้น Firebase Hosting (Spark Plan) ได้ฟรี รองรับ Type Safety เต็มรูปแบบ |
| **Styling & UI** | Tailwind CSS \+ Lucide Icons | ปรับแต่ง Layout หน้าจอกระดานและแผง GM ได้ไว โค้ดกระชับ เหมาะกับ AI Agent |
| **State Management** | Zustand | จัดการ Local UI State, Selected Unit, Drag State และ Undo History Stack โดยไม่ทำให้ React re-render เกินจำเป็น |
| **Drag & Drop** | @dnd-kit/core | ลากวางตัวหมากบนตารางแนวนอน 10×7 และข้ามโซนได้ลื่นไหล รองรับ Pointer Event แม่นยำ |
| **Real-time Database** | Firebase Cloud Firestore (Spark) | ซิงก์ Game State ระหว่าง 3 หน้าจอทันทีผ่าน onSnapshot โดยไม่ต้องเขียนและดูแล WebSocket Server |
| **Authentication** | Firebase Anonymous Auth | ฟรีบน Spark Plan ใช้ผูก UID ชั่วคราวเข้ากับที่นั่ง (Ruler / Master A / Master B) เพื่อให้ Security Rules กันแอบดูคำสั่งลับได้จริง |
| **Hosting & Assets** | Firebase Hosting (public/assets/) | เก็บไฟล์เว็บและรูปไอคอนทั้งหมดใน Hosting โดยตรง ไม่ต้องเปิด Blaze Plan เพื่อใช้ Cloud Storage |

## 3\. โครงสร้างโฟลเดอร์โปรเจกต์ (Project Structure)

```
holy-grail-vtt/
├── public/
│   └── assets/
│       ├── servants/        # ไอคอนตัวละคร เช่น artoria.webp, gilgamesh.webp (128x128 - 256x256 px)
│       ├── monsters/        # ไอคอนมอนสเตอร์ PvE เช่น skeleton.webp, wyvern.webp, dragon.webp
│       ├── classes/         # ไอคอนคลาส saber.svg, archer.svg, lancer.svg ฯลฯ
│       └── items/           # ไอคอนไอเทม, เหรียญ QP, จอกศักดิ์สิทธิ์, ช่องพิเศษ
├── src/
│   ├── data/                # คลังข้อมูลเกมแบบ Static JSON (Import ใช้งานตรง แก้สมดุลได้โดยไม่แตะโค้ด)
│   │   ├── classes.json     # กฎประจำคลาส (baseMOV, ignoreZoC, icon)
│   │   ├── servants.json    # ข้อมูล Servant 43 ตน
│   │   ├── monsters.json    # ข้อมูลมอนสเตอร์ PvE 3 ระดับ
│   │   ├── items.json       # ข้อมูลไอเทมร้านค้าและดรอป

│   │   ├── events.json      # Map Events และ Personal Events พร้อมน้ำหนักการสุ่ม
│   │   ├── terrains.json    # นิยามสเปกภูมิประเทศ 6 แบบ + คุณสมบัติ 2 ชั้น (Height & Movement Cost)
│   │   └── maps.json        # ผัง 3 โซน (Base A: Mount Enzo, Central Fuyuki, Base B: Shinto City) ขนาด 10×7 แนวนอน + พิกัด Gate (y = 1, 3, 5)
│   ├── types/
│   │   └── game.ts          # TypeScript Interfaces ทั้งหมดของระบบ
│   ├── services/
│   │   ├── firebase.ts      # การตั้งค่า Firebase App, Firestore และ Anonymous Auth
│   │   └── roomService.ts   # ฟังก์ชันสร้างห้อง, เข้าห้อง, อัปเดต State และส่งคำสั่งลับ
│   ├── store/
│   │   └── useGameStore.ts  # Zustand Store (Synced State + Local Undo Stack + UI Selections)
│   ├── utils/
│   │   ├── gridMath.ts      # คำนวณระยะเดิน (BFS/Manhattan), Gate Crossing และ Zone of Control (ZoC)
│   │   └── assetHelper.ts   # จัดการ URL รูปภาพและ Fallback เมื่อยังไม่มีไฟล์รูป
│   ├── components/
│   │   ├── lobby/           # หน้าสร้าง/เข้าห้องด้วย Room Code + เลือก Role
│   │   ├── board/           # กระดาน 10×7 แนวนอน, แท็บสลับ 3 โซน, ตัวหมาก, Fog Overlay, Command Arrows
│   │   ├── master/          # แผงส่งคำสั่งลับ (Command Queue), กระเป๋าไอเทม, ตัวสำรอง
│   │   ├── ruler/           # แผง Ruler God-Mode, Unit Inspector, Resource Override, Monster Spawner, Undo

│   │   └── modals/          # วงล้อสุ่ม (Draft/Events), ลูกเต๋า 1d6, Servant Catalog, Turn Log, GrailAbsorptionBanner
│   └── App.tsx
├── firestore.rules          # กฎความปลอดภัยกัน Master แอบอ่านคำสั่งลับอีกฝั่ง
├── firebase.json            # ตั้งค่า SPA Rewrite และ Cache Header สำหรับรูปภาพ
└── .env.local               # ค่าคอนฟิก VITE_FIREBASE_* (ห้าม Commit ขึ้น Git)
```

### กฎการตั้งชื่อและ Fallback สำหรับรูปภาพ (Asset Convention)

1. ชื่อไฟล์รูปใน **public/assets/** ต้องเป็น **ภาษาอังกฤษตัวพิมพ์เล็กทั้งหมด** และตรงกับค่า **id** ในไฟล์ JSON (เช่น **id: "melusine"** \-\> **/assets/servants/melusine.webp**)  
2. ฟิลด์ **image** ใน JSON ต้องรองรับได้ทั้ง **Local Path** (**/assets/servants/...**) และ **External URL** (เช่น ลิงก์รูปจาก Atlas Academy) เพื่อความรวดเร็วในช่วงทดสอบ  
3. **Image Fallback:** คอมโพเนนต์แสดงตัวหมากต้องมี **onError** fallback — หากโหลดรูปไม่ได้หรือยังไม่ได้ใส่ไฟล์รูป ให้แสดงวงกลมสีประจำฝ่าย (**Team A \= แดง**, **Team B \= น้ำเงิน**, **Neutral/PvE \= ส้ม/เทา**) พร้อมตัวอักษรย่อชื่อตัวละครและไอคอนคลาสแทน

## 4\. ระบบห้องและสิทธิ์การเข้าถึง (Room & Role System)

ไม่ต้องสร้างระบบสมัครสมาชิกหรือ Email Login เพื่อลดความซับซ้อน ให้ใช้ **Anonymous Auth \+ Room Code \+ Seat Lock**:

1. เมื่อเปิดเว็บ ระบบจะเรียก **signInAnonymously()** อัตโนมัติเพื่อให้แต่ละเบราว์เซอร์ได้ **uid** ประจำเครื่อง  
2. **สร้างห้อง (Ruler):** ผู้สร้างห้องกด "Create Room" ระบบสุ่มรหัสห้อง 6 หลัก (เช่น **FGO-482**) และบันทึก **seats.rulerUid \= currentUser.uid**  
3. **เข้าห้อง (Master A / Master B):** เพื่อนกรอกรหัสห้องแล้วเลือกที่นั่ง (**Master A** หรือ **Master B**) ระบบจะผูก **seats.masterAUid** หรือ **seats.masterBUid** เข้ากับ **uid** ของเพื่อน (หากหลุดหรือรีเฟรชหน้าเว็บ เครื่องเดิมจะกลับเข้าที่นั่งเดิมอัตโนมัติ และ Ruler มีปุ่ม **Reset Seat** เผื่อเพื่อนเปลี่ยนเครื่อง/เบราว์เซอร์)  
4. **ตั้งรหัสผ่านเสริม (Optional PIN):** สามารถใส่รหัส 4 หลักเฉพาะตำแหน่ง Ruler เพื่อป้องกันคนกดเข้าที่นั่ง GM ผิดพลาด

## 5\. โครงสร้างฐานข้อมูล Firestore (Data Model & Spark Optimization)

แบ่งข้อมูลออกเป็น **1 เอกสารหลัก \+ 3 เอกสารความลับ** เพื่อประหยัดจำนวน Read/Write ให้มากที่สุด:

| Document Path | สิทธิ์อ่าน (Read) | สิทธิ์เขียน (Write) | ข้อมูลที่เก็บ |
| :---- | :---- | :---- | :---- |
| **rooms/{roomId}** | ทุกคนในห้อง (Ruler, Master A, Master B) | Ruler เป็นหลัก (Master เขียนได้เฉพาะตอนจับจองที่นั่ง) | Game State ทั้งหมด: เทิร์น, เฟส, ยูนิตบนกระดาน, ทรัพยากร 2 ฝั่ง, สถานะช่อง, ผลวงล้อ/เต๋าล่าสุด, Log ล่าสุด 50 รายการ |
| **rooms/{roomId}/secrets/master\_a** | Master A และ Ruler เท่านั้น | Master A (ส่งคำสั่ง) และ Ruler (เคลียร์คำสั่งหลังจบเทิร์น) | คำสั่งลับ (WEGO Command Queue) ของฝั่ง A ในเทิร์นปัจจุบัน |
| **rooms/{roomId}/secrets/master\_b** | Master B และ Ruler เท่านั้น | Master B (ส่งคำสั่ง) และ Ruler (เคลียร์คำสั่งหลังจบเทิร์น) | คำสั่งลับ (WEGO Command Queue) ของฝั่ง B ในเทิร์นปัจจุบัน |
| **rooms/{roomId}/secrets/ruler** | Ruler เท่านั้น | Ruler เท่านั้น | secretGrailTurn (สุ่ม 10, 11 หรือ 12\) และโน้ตลับของ GM เพื่อป้องกันไม่ให้ Master เปิด DevTools แอบดู |

### แนวทางการจัดการ Undo Stack (ไม่เปลืองโควตา Firestore)

* เก็บ **historyStack: RoomState\[\]** (ย้อนหลังสูงสุด 15 จังหวะ) ไว้ใน **Local Memory ของหน้าจอ Ruler (Zustand)** แทนการสร้าง Sub-collection บน Firestore  
* ทุกครั้งที่ Ruler กดแก้ไขกระดานหรือขยับหมาก ระบบจะ Push สำเนา State ก่อนหน้าลง **historyStack**  
* เมื่อกดปุ่ม **Undo** ระบบจะดึง State ก่อนหน้าออกมาแล้วเขียนทับลง **rooms/{roomId}** ทันที (เสีย Write แค่ 1 ครั้ง)

### แนวทางการจัดการ Fog of War (3 ผู้เล่นบน Spark Plan)

* **ระดับที่ 1 (แนะนำสำหรับวงเพื่อน 3 คน):** เก็บพิกัดยูนิตทั้งหมดไว้ใน **rooms/{roomId}** เพื่อใหัปเดตจบใน 1 Read/Write แล้วให้ Frontend ของฝั่ง Master กรองการแสดงผลตามค่า **fogConfig** (ซ่อนศัตรูที่อยู่นอกโซน/ในโซนฐานทัพศัตรู, ซ่อนยูนิตศัตรูที่ยืนในช่อง **ป่า (forest)** เว้นแต่จะยืนติดกันในระยะ 1 ช่อง หรือ Ruler กด **isRevealedToEnemy: true**)  
* **ระดับที่ 2 (ป้องกันการเปิด DevTools แอบดู):** หากอนาคตต้องการซ่อนข้อมูลศัตรูระดับฐานข้อมูล สามารถแยกเอกสาร **publicState** กับ **rulerFullState** เพิ่มได้ในภายหลัง โดยที่ข้อมูลคำสั่งลับ (**secrets/master\_a** และ **secrets/master\_b**) ถูกป้องกันระดับฐานข้อมูลตั้งแต่เฟสแรกอยู่แล้ว

## 6\. โครงสร้าง TypeScript Interfaces (src/types/game.ts)

```ts
export type Role = 'ruler' | 'master_a' | 'master_b';
export type TeamId = 'team_a' | 'team_b';
export type OwnerId = TeamId | 'neutral';
export type ZoneId = 'base_a' | 'central' | 'base_b';
export type TurnPhase = 'draft' | 'event' | 'planning' | 'resolution' | 'ended';
export type UnitStatus = 'active' | 'reserve' | 'defeated';

export type TerrainType = 'open' | 'road' | 'building' | 'forest' | 'ruins' | 'water';

export interface Coordinates {
  zone: ZoneId;

  x: number; // 0 ถึง 9 (กระดานแนวนอน 10x7)

  y: number; // 0 ถึง 6
}

export interface BoardUnit {
  id: string;                // Unique instance ID เช่น "unit_a_1" หรือ "mon_wyvern_1"
  templateId: string;        // อ้างอิง id ใน servants.json หรือ monsters.json
  unitType: 'servant' | 'monster' | 'grail';
  name: string;
  servantClass?: string;     // เช่น "Saber", "Assassin" (สำหรับ Servant)
  owner: OwnerId;
  status: UnitStatus;
  position: Coordinates | null; // null เมื่ออยู่ในสถานะ reserve หรือ defeated
  hp: number;
  maxHp: number;
  atk: number;
  mov: number;
  npReady: boolean;
  tags: string[];            // ป้ายบัฟ/ดีบัฟอิสระที่ GM พิมพ์แปะได้ เช่น ["Evade 1x", "Stun", "ATK+2"]
  isRevealedToEnemy: boolean;// Override เปิดเผยตำแหน่งทะลุ Fog of War
  image?: string;
}

export interface TeamState {
  name: string;
  mana: number;
  qp: number;
  commandSpells: number;     // สูงสุด 3 ขีด
  inventory: string[];       // รายการ itemId ในกระเป๋า

  defeatedCount: number;     // นับจำนวน Servant ที่ถูกกำจัด (เช็กเงื่อนไข Wipeout 6/6)
  readyLocked: boolean;      // true เมื่อกดส่งคำสั่งลับในเทิร์นนั้นแล้ว
}

export interface TileOverride {
  tileKey: string;           // รูปแบบ "{zone}_{x}_{y}" เช่น "central_2_3"
  cleared: boolean;          // true เมื่อเก็บ QP หรือ Event ช่องนั้นไปแล้ว
  customNote?: string;       // โน้ตพิเศษที่ GM ปักหมุดลงช่อง เช่น "Trap", "Grail Mud"
}

export type StanceType = 'attack' | 'defensive' | 'evade';

export type CommandActionType =
  | 'move'
  | 'attack'
  | 'np'
  | 'guard'
  | 'explore'
  | 'tag_out'
  | 'custom';

export interface CommandOrder {
  unitId: string;
  actionType: CommandActionType; // ตัด move_and_attack ออก ใช้ระบบ Attack ก่อน Move
  stance?: StanceType;           // 'attack' | 'defensive' | 'evade' (คำสั่งเก่าที่ไม่มีฟิลด์นี้ถือเป็น 'defensive')
  targetPosition?: Coordinates;
  targetUnitId?: string;
  useSkill?: boolean;
  overrideMoveRange?: boolean;
  estimatedMoveCost?: number | null;
  itemId?: string;
  note: string;                  // รายละเอียดเพิ่มเติม เช่น ชื่อสกิลหรือไอเทมที่ใช้
}

export interface SecretCommandsDoc {
  turn: number;
  locked: boolean;
  updatedAt: number;
  orders: CommandOrder[];    // สูงสุด 3 คำสั่ง (ตามจำนวน Active Servant)
}


export interface RulerSecretDoc {
  secretGrailTurn: 10 | 11 | 12;
  gmPrivateNote?: string;
}

export interface WheelBroadcast {
  id: string;                // Timestamp หรือ UUID เพื่อให้ทุกจอรันอนิเมชันเมื่อค่าเปลี่ยน
  wheelType: 'servant_draft' | 'map_event' | 'personal_event';
  isSpinning: boolean;
  poolIds: string[];         // รายชื่อตัวเลือกที่เหลือในวงล้อ ณ ตอนหมุน
  resultId: string | null;
  resultLabel: string | null;
  resultDescription?: string | null;
  targetTeam?: TeamId | null;
}


export interface GrailBannerBroadcast {
  id: string;
  servantName?: string;
  absorbedCount: number;     // 0 ถึง 5
  isManifestation: boolean;  // true เมื่อจอกจุติ (ครบ 5/5 หรือถึง Secret Turn)
  message: string;
  timestamp: number;
}

export interface DiceBroadcast {
  id: string;
  rollerRole: Role;
  sides: number;             // เช่น 6 (1d6)
  result: number;
  label: string;             // เช่น "Artoria Attack Roll"
  timestamp: number;
}

export interface FogConfig {
  enabled: boolean;
  revealBaseZoneToOwnerOnly: boolean; // ซ่อนสไลด์ฐานทัพอีกฝั่งจนกว่าจะมีตัวเดินข้าม Gate เข้าไป
  showCentralToAll: boolean;

  showCentralToAll: boolean;

  hideUnitsInForest: boolean;

}
export interface GameLogEntry {
  id: string;
  turn: number;
  timestamp: number;
  actor: Role | 'system';
  message: string;
}

export interface RoomState {
  roomId: string;
  createdAt: number;
  turn: number;
  phase: TurnPhase;
  seats: {
    rulerUid: string | null;
    masterAUid: string | null;
    masterBUid: string | null;
  };
  draftPoolRemaining: string[]; // รายชื่อ servantId ที่ยังเหลือในวงล้อ Draft
  teams: {
    team_a: TeamState;
    team_b: TeamState;
  };
  units: Record<string, BoardUnit>;
  tileOverrides: Record<string, TileOverride>;
  fogConfig: FogConfig;
  activeMapEvent: { id: string; title: string; description: string } | null;
  wheelBroadcast: WheelBroadcast | null;
  diceBroadcast: DiceBroadcast | null;

  grailAbsorbedCount: number; // นับ Servant ที่ถูกจอกกลืนกินรวมทั้ง 2 ฝั่ง (ครบ 5 จอกจุติทันที)
  grailAbsorbedNames: string[];
  grailManifested: boolean;
  grailBannerBroadcast: GrailBannerBroadcast | null;
  logs: GameLogEntry[];         // เก็บเฉพาะ 50 รายการล่าสุด
}
```

## 7\. อัลกอริทึมช่วยเหลือฝั่ง Client (src/utils/gridMath.ts)

ฟังก์ชันเหล่านี้ทำงานเป็น **Visual Helper** (ช่วยไฮไลต์ช่องและแจ้งเตือน GM/Master) แต่จะไม่ล็อกสิทธิ์การลากหมากของ Ruler:

1. **Gate Crossing (การเดินข้ามโซน 3 สไลด์):**  
   1. กำหนดคู่พิกัด Gate ใน **maps.json** ได้แก่ **base\_a (x:9, y:1/3/5) \<-\> central (x:0, y:1/3/5)** และ **central (x:9, y:1/3/5) \<-\> base\_b (x:0, y:1/3/5)** (มี Gate เหนือ/กลาง/ใต้)  
   2. การก้าวข้าม Gate นับเป็นระยะเดิน 1 ช่องปกติ  
2. **Terrain Movement Cost (Weighted BFS / Dijkstra):**  
   1. เมื่อเริ่มเคลื่อนที่จากช่อง **road** จะได้รับโบนัส **\+1 MOV** ในเทิร์นนั้น (สูงสุด \+1/เทิร์น)  
   2. ช่อง **forest** และ **water** ใช้ **2 MOV** ในการเดินเข้า  
   3. ช่อง **building** ใช้ **2 MOV** ในการปีนขึ้นจากพื้นราบ (ข้ามระหว่างตึกติดกันใช้ **1 MOV**)  
3. **Zone of Control (ZoC — ล็อกขาหนียาก) & Evade Stance:**  
   1. ตรวจสอบตอนต้นเฟสวางแผนว่ามียูนิตศัตรูยืนติดในระยะ Manhattan Distance \= 1 (บน/ล่าง/ซ้าย/ขวา ในโซนเดียวกัน) หรือไม่  
   2. หากติดสถานะ **Engaged** และคลาสของตัวละครไม่มีคุณสมบัติ **ignoreZoC: true** (เช่น Assassin) รวมถึงไม่ได้เลือก **`stance === 'evade'`** (`ignoreZoCByStance`):  
      1. ช่องที่เพิ่มระยะห่างจากศัตรูที่ติดอยู่ จะคำนวณระยะเดินสูงสุดลดลง **\-1.0 MP** (ขั้นต่ำ 1.0 MP) และไฮไลต์สีเตือนบนกระดาน  
      2. การเดินเข้าหาหรือเดินวนรอบศัตรูใช้ระยะ **MP** เต็มตามปกติ  
   3. หากเลือก **`stance === 'evade'`** ให้ข้ามโทษ ZoC และไฮไลต์ป้ายสีเขียว `"Evade: ไม่ติด ZoC"`  
4. **Guard + Evade Retreat Helper (`getRetreatTiles`):**  
   1. คำนวณช่องข้างเคียง 4 ทิศ (บน/ล่าง/ซ้าย/ขวา ในโซนเดียวกัน) ที่อยู่ในขอบเขตกระดาน ไม่มีหมาก/มอนสเตอร์ยืนขวาง และมีระยะ Manhattan Distance จากตำแหน่งผู้โจมตีมากกว่าตำแหน่งเดิม เพื่อแสดงปุ่มถอยหลัง 1 ช่องใน `QuickCombatModal.tsx`  
5. **Command Arrow Overlay (หน้าจอ Ruler):**  
   1. เมื่อ Master A และ Master B กด Lock Turn หน้าจอ Ruler จะอ่านเอกสาร **secrets/master\_a** และ **secrets/master\_b** แล้ววาดเส้น SVG Arrow ทับบนกระดาน (ฝั่ง A สีแดง, ฝั่ง B สีน้ำเงิน) โดยคำสั่ง `move` ที่ใช้ **`stance === 'evade'`** จะแสดงขอบเรืองแสงสีเขียวมิ้นต์พร้อมป้าย `EVADE` กลางลูกศร เพื่อให้ Ruler แยกยูนิตที่ยังขยับได้หลังโดนตีใน Priority 3 ทันที

## 8\. Firestore Security Rules (firestore.rules)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.seats.rulerUid == request.auth.uid ||
        // อนุญาตให้ Master จับจองที่นั่งว่างหรืออัปเดตสถานะ readyLocked ของฝั่งตัวเองเท่านั้น
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['seats', 'teams'])
      );

      match /secrets/master_a {
        allow read: if request.auth != null && (
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.rulerUid == request.auth.uid ||
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.masterAUid == request.auth.uid
        );
        allow write: if request.auth != null && (
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.rulerUid == request.auth.uid ||
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.masterAUid == request.auth.uid
        );
      }


      match /secrets/ruler {
        allow read, write: if request.auth != null &&
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.rulerUid == request.auth.uid;
      }

      match /secrets/master_b {
        allow read: if request.auth != null && (
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.rulerUid == request.auth.uid ||
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.masterBUid == request.auth.uid
        );
        allow write: if request.auth != null && (
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.rulerUid == request.auth.uid ||
          get(/databases/$(database)/documents/rooms/$(roomId)).data.seats.masterBUid == request.auth.uid
        );
      }
    }
  }
}
```

## 9\. กฎเหล็กสำหรับ AI Coding Agent (AntiGravity Guardrails)

คำสั่งบังคับสำหรับ AntiGravity เพื่อป้องกันบั๊กและป้องกันการเผาโควตา Firestore:

1. **ห้ามเขียน updateDoc / setDoc ไว้ใน useEffect ที่ผูกกับตัวแปรจาก onSnapshot เด็ดขาด** (ป้องกัน Infinite Write Loop) การเขียนข้อมูลทุกครั้งต้องเกิดจาก User Event (คลิกปุ่ม, ปล่อยเมาส์หลัง Drag จบ) เท่านั้น  
2. **Unsubscribe ทุกครั้ง:** ทุก **onSnapshot** listener ต้องคืนค่าฟังก์ชัน cleanup ใน **useEffect** เสมอ  
3. **Batch/Single Commit:** ตอน Ruler แก้สเตตัสใน Unit Inspector ให้แก้ใน Local Form State ก่อนแล้วค่อยยิง **updateDoc** ทีเดียวเมื่อกดบันทึก หรือใช้ Debounce 400ms (และไม่ยิง write ระหว่างกำลังลากเมาส์ ยิงเฉพาะจังหวะ **onDragEnd**)  
4. **Ruler Override Priority:** กฎการเคลื่อนที่, ZoC และ Fog of War เป็นเพียงตัวช่วยแสดงผล ห้ามบล็อกการลากวางหรือการแก้ตัวเลขในโหมด Ruler เด็ดขาด  
5. **Zero External Paid Services:** ห้ามติดตั้งหรือเรียกใช้ Firebase Cloud Functions, Cloud Storage หรือ Backend Server ภายนอก ทุกอย่างต้องรันได้สมบูรณ์บน Firebase Spark Plan

## 10\. การตั้งค่า Environment และ Deploy (firebase.json)

* **Environment Variables (.env.local):**  
  * VITE\_FIREBASE\_API\_KEY  
  * VITE\_FIREBASE\_AUTH\_DOMAIN  
  * VITE\_FIREBASE\_PROJECT\_ID  
  * VITE\_FIREBASE\_APP\_ID  
* **คำสั่ง Deploy ขึ้น Firebase Hosting (Spark Plan):**  
  * npm run build (สร้างไฟล์ Static ลงโฟลเดอร์ dist/)  
  * firebase deploy \--only hosting,firestore:rules  
* **Caching รูปภาพ (firebase.json):** ตั้งค่า **Cache-Control: public, max-age=604800** ให้โฟลเดอร์ **/assets/\*\*** เพื่อให้เบราว์เซอร์ของผู้เล่นแคชไอคอน Servant ไว้ในเครื่อง ลดปริมาณ Bandwidth ของ Firebase Hosting