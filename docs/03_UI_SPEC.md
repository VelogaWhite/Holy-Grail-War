# **03\_UI\_SPEC.md — Fate: Holy Grail War (UI/UX & Component Specification)**

เอกสารข้อกำหนดหน้าจอ Layout และส่วนติดต่อผู้ใช้สำหรับเว็บแอป **Fate: Holy Grail War (Custom VTT)** แยกการแสดงผลตามบทบาท (Ruler / GM, Master A, Master B) ใช้งานร่วมกับ 01\_GAME\_RULES.md และ 02\_ARCHITECTURE.md

# **1\. ระบบสีและแนวทางการออกแบบ (Design System & Theme)**

ออกแบบด้วยแนวทาง Fuyuki Midnight & Grail Gold (High-Contrast Dark Tactical UI) เพื่อให้อ่านสเตตัส ตัวอักษร และตำแหน่งหมากบนกระดาน 10×7 ได้ชัดเจนตลอดการเล่นหลายชั่วโมง โดยไม่ต้องเพ่งสายตา:

| องค์ประกอบ (Token) | ค่าสีแนะนำ (Tailwind / Hex) | การใช้งานหลัก |
| :---- | :---- | :---- |
| **Background (พื้นหลังหลัก)** | `bg-slate-950` (`#090D16`) / `bg-slate-900` (`#111827`) | พื้นหลังแอป การ์ด แผงเครื่องมือ และ Sidebar ทั้งหมด (Dark Tactical Theme) |
| **Primary & Secondary Text** | `text-slate-100` (`#F1F5F9`) / `text-slate-400` (`#94A3B8`) | ชื่อตัวละคร ค่าสถานะ ตัวเลขพิกัด ข้อความคำแนะนำ และหัวข้อทั้งหมด |
| **Grail Gold (สีเน้นหลัก)** | `#D4AF37` / `bg-amber-400` / `text-amber-400` (`#FBBF24`) | ปุ่มแอ็กชันหลัก (Lock Turn, Spin Wheel), แท็บโซนที่เลือกอยู่, จอกศักดิ์สิทธิ์, แถบ ภาชนะจอก 5/5 และ Active Map Event |
| **Borders & Card Panels** | `border-slate-700/80` / `border-slate-800` | ขอบกระดาน 10x7, เส้นแบ่งพาเนล และกรอบการ์ด ให้คมชัดมีมิติบนพื้นหลังมืด |
| **Team A (Red Faction / Mount Enzo)** | `bg-rose-500` / `border-rose-500` (`#F43F5E`) | ขอบตัวหมากฝั่ง A (Mount Enzo), แถบทรัพยากร Team A, เส้นลูกศรคำสั่งฝั่ง A |
| **Team B (Blue Faction / Shinto City)** | `bg-sky-500` / `border-sky-500` (`#0EA5E9`) | ขอบตัวหมากฝั่ง B (Shinto City), แถบทรัพยากร Team B, เส้นลูกศรคำสั่งฝั่ง B (สว่างอ่านชัดบนพื้นมืด) |
| **Arcane / Leyline / Gate / Teleporter** | `text-cyan-400` / `border-cyan-400` (`#22D3EE`) | วงเวท Leyline, ช่อง Gate เชื่อมโซน และวงแหวน Teleport Circle |
| **Night Terrain Colors (ภูมิประเทศ)** | Open (`#1A2421`), Road (`#1E2430`), Building (`#242B3D`), Forest (`#132A1E`), Ruins (`#29231E`), Water (`#0F2537`) | สีพื้นหลังช่องกระดานชั้นล่างสุดตามประเภทภูมิประเทศในบรรยากาศกลางคืน |

* **ขนาดหน้าจอเป้าหมาย:** Desktop-First (`1280x720` ขึ้นไป) ใช้โครงสร้าง **Full Viewport (`h-screen overflow-hidden`)** เพื่อให้กระดานแนวนอน 10x7 อยู่กลางจอตลอดเวลาโดยไม่ต้องสโครลหน้าเว็บหลัก (ให้สโครลเฉพาะภายใน Sidebar หรือ Modal)

# **2\. หน้าจอล็อบบี้และเลือกที่นั่ง (Lobby Screen)**

หน้าแรกเมื่อเปิดเว็บ (หลังจากระบบเรียก `signInAnonymously()` เสร็จ):

1. **การ์ดกลางจอ (Centered Card):** แสดงชื่อเกม **FATE: HOLY GRAIL WAR — VTT**  
2. **ฝั่งสร้างห้องใหม่ (Create Room — สำหรับ Ruler):**  
   * ช่องกรอกชื่อทีมเริ่มต้น (ค่าเริ่มต้น `Team A (Red / Mount Enzo)` / `Team B (Blue / Shinto City)`) และช่อง **Optional 4-Digit Ruler PIN**  
   * ปุ่มสีทองขนาดใหญ่ **`Create New War Room`** — เมื่อกดจะสร้างห้องใน Firestore พร้อมสุ่ม Room Code 6 หลัก (เช่น `FGO-482`), สุ่ม `secretGrailTurn` (10–12) เก็บไว้ในเอกสารลับของ Ruler อัตโนมัติ (สามารถเปิดดูและเปลี่ยนได้ใน Ruler Control Strip) และพาเข้าสู่หน้าจอ Ruler ทันที  
3. **ฝั่งเข้าร่วมห้อง (Join Room):**  
   * ช่องกรอก `Room Code` \+ ปุ่ม `Find Room`  
   * เมื่อพบห้อง จะแสดงการ์ดเลือกที่นั่ง **3 ใบเรียงแนวนอน**:  
     * **Ruler / GM** (ขอบสีส้ม) — แสดงสถานะ `Available` หรือ `Occupied` (ต้องใส่ PIN หากตั้งไว้)  
     * **Master A — Red Faction (Mount Enzo)** (ขอบสีแดง)  
     * **Master B — Blue Faction (Shinto City)** (ขอบสีน้ำเงิน)  
   * หากเบราว์เซอร์เดิมเคยเข้าที่นั่งไหนไว้แล้ว (`uid` ตรงกัน) ให้แสดงปุ่ม **`Rejoin Seat`** เพื่อกลับเข้าเกมเดิมทันที

# **3\. โครงสร้างหน้าจอหลัก (Main Workspace — 3-Column Layout)**

แบ่งพื้นที่หน้าจอ `100vh` ออกเป็น 4 ส่วนหลักดังนี้:

```
+-----------------------------------------------------------------------------------------+
| TOP BAR HUD: [Room: FGO-482] [Turn 4 | PLANNING] [Grail Vessel: 2/5] [Secret Grail: T11] |
|              [Team A: Mana/QP/CS | Kills: 1/6]  [Team B: Mana/QP/CS | Kills: 0/6]       |
|              [Active Event: Haste Wind] [Catalog] [Wheel] [Dice 1d6] [Logs]             |
+------------------+---------------------------------------------------+------------------+
|  LEFT SIDEBAR    |               CENTER STAGE (BOARD)                |  RIGHT SIDEBAR   |
|  (Width: 250px)  |               (Flex-1, Centered)                  |  (Width: 320px)  |
|                  |                                                   |                  |
|  [Master View]   | [ Base A: Enzo ] [ Central Fuyuki ] [ Base B: Shinto ]|  [Master View]   |
|  - Active (3)    | +-----------------------------------------------+ |  - Secret        |
|  - Reserve (3)   | | 10x7 Horizontal Interactive Grid GridTile     | |    Command Queue |
|  - Inventory     | | Layer 1: Night Terrain (6 Types + TH Badge)   | |    (3 Slots)     |
|                  | | Layer 2: Special Features (12 Types)          | |  - [LOCK TURN]   |
|  [Ruler View]    | | + Tokens + SVG Arrows + Fog Overlay             | |                  |
|  - All Units     | +-----------------------------------------------+ |  [Ruler View]    |
|  - Spawn PvE     |                                                   |  - Unit Inspector|
|  - Fog Toggle    | [Legend Bar: Terrain & Special Features Guide]    |    (God-Mode)    |
|  - [Undo (12)]   |                                                   |  - Secret Orders |
+------------------+---------------------------------------------------+------------------+
```

## **3.1 Top Bar HUD (แถบข้อมูลบนสุด — สูง 64px)**

* **ซ้าย:** ป้ายรหัสห้อง (คลิกเพื่อ Copy), เลขเทิร์น (`Turn 4`), และป้ายเฟสปัจจุบัน (`DRAFT` / `EVENT` / `PLANNING` / `RESOLUTION`)  
* **กลาง:**  
  * กล่องสรุป **Team A (แดง / Mount Enzo)** และ **Team B (น้ำเงิน / Shinto City)** แสดงค่า `Mana`, `QP`, ขีด `Command Spells` (ไอคอน 3 ขีด), ตัวนับ **`Kills: X / 6 (Wipeout)`**, และป้ายสถานะ `Waiting...` / `LOCKED`  
  * หลอด **`ภาชนะจอกศักดิ์สิทธิ์: X / 5`** (Grail Vessel Progress Bar สีทองเรืองแสง) ตรงกลางแถบบน พร้อมป้ายเทิร์นจอกจุติ (มุมมอง Master แสดง **`จอกจุติ: เทิร์น ???`**, มุมมอง Ruler แสดงป้ายทองส่วนตัว **`Secret Grail: T10–T12`** พร้อมปุ่มปรับแก้ไขได้)  
* **ขวา:** ปุ่มเครื่องมือร่วม 4 ปุ่ม:  
  1. **`Catalog`** (เปิดดู Servant 32+ ตน, ร้านค้า QP และกติกาย่อ)  
  2. **`Wheel`** (เปิดหน้าต่างวงล้อสุ่ม — Ruler กดหมุนได้, Master ดูได้อย่างเดียว)  
  3. **`Dice 1d6`** (เปิดป๊อปอัปทอยเต๋าด่วน)  
  4. **`Logs`** (เปิดแถบเลื่อนดูบันทึกเหตุการณ์ย้อนหลัง 50 รายการ)

# **4\. กระดาน 6x6 ตัวหมาก และ Overlays (Center Stage)**

## **4.1 Zone Switcher Tabs (แท็บสลับ 3 โซน)**

* วางปุ่มแท็บขนาดใหญ่เหนือกระดาน: **`Base A: Mount Enzo`** ↔ **`Central Fuyuki`** ↔ **`Base B: Shinto City`**  
* แท็บที่เลือกอยู่ไฮไลต์ด้วยแถบสีทอง (`border-b-4 border-amber-400 text-amber-400`)  
* บนแต่ละแท็บมี Badge ตัวเลขเล็กๆ แสดงจำนวน Servant ที่มองเห็นได้ในโซนนั้น เพื่อไม่ให้ลืมตัวละครที่อยู่อีกโซน

## **4.2 การแสดงผลช่องตาราง (Tile Visuals)**

* กระดานแนวนอนขนาด **`10 คอลัมน์ × 7 แถว (10x7 Grid)`** แสดงผล 2 ชั้น (GridTile.tsx):  
* **ชั้นที่ 1 (Terrain Layer — บังคับแสดงครบทุกช่อง):** แสดงสีพื้นหลังตามประเภทภูมิประเทศโทน Night \+ ไอคอนภูมิประเทศจางๆ \+ **ป้ายชื่อภาษาไทยมุมล่างซ้ายเสมอ** ถึงจะเป็นช่องเปล่าก็ต้องแสดงชื่อ ดังนี้:  
  * **ที่โล่ง (open):** สีเขียวขี้เถ้าเข้ม (`#1A2421`) — พื้นที่ปกติ ไม่คิดโบนัสหรือส่วนลด  
  * **ถนน (road):** สีเทาน้ำเงิน (`#1E2430`) — หากเริ่มเดินบนถนนจะได้ **`+1 MOV`**  
  * **ตึก (building):** สีน้ำเงินเข้มจัด (`#242B3D`) — ใช้ **`2 MOV`** ในการเดินเข้า, ให้โบนัสป้องกัน `DEF +1`  
  * **ป่า (forest):** สีเขียวป่าเข้ม (`#132A1E`) — ใช้ **`2 MOV`** ในการเดินเข้า, ซ่อนตัวละครจากศัตรูภายนอกป่า (Fog of War Hiding Factor)  
  * **ซากปรักฯ (ruins):** สีน้ำตาลเข้มไหม้ (`#29231E`) — พื้นที่ยากลำบาก ให้โบนัสซุ่มโจมตี  
  * **แม่น้ำ (water):** สีฟ้าเทามืด (`#0F2537`) — ใช้ **`2 MOV`** ในการข้าม (ยกเว้นยูนิตที่มีทักษะเดินบนน้ำ)  
* **ชั้นที่ 2 (Special Feature Layer — วางซ้อนบนภูมิประเทศได้):**  
  * **Leyline / QP Cache / Personal Event / Monster Nest / Safe House / Gate / Greater Grail Site:** คงสัญลักษณ์เดิม (จอกวางที่พิกัด `(4,3)` และ `(5,3)` ใจกลาง Central Fuyuki)  
  * **Summoning Altar (แท่นอัญเชิญ):** ไอคอนวงเวทอัญเชิญสีม่วงสดใส  
  * **Teleport Circle (วงแท่นวาร์ปคู่):** ไอคอนวงแหวนสีฟ้า `cyan-400` พร้อมระบุป้ายคู่ (เช่น `TP-A` / `TP-B`)  
  * **Watchtower (หอคอยสอดแนม):** ไอคอนหอคอยสีเหลือง เปิดหมอกรอบข้าง 2 ช่อง  
  * **Workshop (เวิร์กชอปจอมเวท):** ไอคอนค้อนกะทั่ง/คริสตัล ให้โบนัสฟื้นฟู Mana  
  * **Blood Altar (แท่นบูชายัญเลือด):** ไอคอนหยดเลือดสีแดงเข้ม  
* **Hover Tooltip / Tile Info Panel (TileInfoTooltip.tsx):** แสดงรายละเอียดครบทั้งภูมิประเทศ (เช่น *"ป่า: เดินเข้า 2 MOV, ซ่อนตัวจากคนนอกป่า"*) และช่องพิเศษที่วางซ้อนอยู่

## **4.3 การออกแบบตัวหมาก (UnitToken.tsx)**

* วางอยู่กลางช่อง ใช้กรอบสี่เหลี่ยมมนพร้อม **ขอบหนา 3px ตามสีฝ่าย** (Team A rose-500, Team B sky-500, PvE stone-700)  
* **ข้อมูลบนตัวหมาก (ปรับปรุงสำหรับ Dark Theme):** ป้ายชื่อฉากหลังดำโปร่ง และหลอด HP คมชัดไม่ตัดข้อความ  
  * มุมซ้ายบน: ไอคอนคลาสขนาดเล็ก (Saber, Archer ฯลฯ)  
  * มุมขวาบน: จุดสีทองเรืองแสงเมื่อ `npReady: true` หรือไอคอนรูปตาเมื่อ Ruler กด `Reveal`  
  * ด้านล่าง: หลอด HP แนวนอน \+ ตัวเลขคมชัด (`12/14`)  
  * ด้านบน/ขอบล่าง: แสดง **Custom Buff Tags** เป็นป้าย Pill ขนาดเล็ก

## **4.4 Overlays ช่วยเล่นบนกระดาน**

1. **Movement & ZoC Highlight (Visual Helper):**  
   * เมื่อคลิกเลือก Servant บนกระดาน ระบบจะไฮไลต์ช่องที่เดินถึงได้โดยคำนวณโบนัสถนน (**`+1 MOV`** เมื่อเริ่มเดินบนถนน) และหักค่าเดิน **`2 MOV`** ของช่องป่า ตึก ซากปรักฯ และแม่น้ำ  
   * หากติด **Zone of Control (Engaged)** ช่องเดินถอยหนีจะถูกหัก `-1 MOV` พร้อมป้ายเตือนสีส้ม `ZoC (-1)`  
2. **Fog of War Overlay & Forest Hiding (FogOverlay.tsx):**  
   * นอกจากซ่อนโซนฐานทัพศัตรูแล้ว ระบบจะ \*\*ซ่อนตัวหมากศัตรูที่ยืนอยู่ในช่องป่า (forest)\*\* บนหน้าจอฝั่ง Master จนกว่าจะมี Servant ฝั่งเรายืนติดระยะ 1 ช่อง หรืออยู่ในป่าเดียวกัน (หรือ Ruler กด Reveal / ใช้ Watchtower)  
3. **Command Arrow Overlay (เฉพาะหน้าจอ Ruler):**  
   * วาด SVG Arrow Overlay บนกระดาน (แดง \= Team A, ฟ้า \= Team B) พร้อมไฮไลต์กรอบประสีส้ม `COLLISION!` เมื่อเป้าหมายตรงกัน

## **5.1 Left Sidebar (กองทัพและกระเป๋าของตนเอง)**

* **Active Servants (3 ช่อง):** การ์ดย่อแสดงรูป, HP, ATK, MOV, Tags และปุ่ม `Locate` (กดแล้วสลับแท็บไปโซนที่ตัวนั้นยืนอยู่และกะพริบช่องให้เห็น)  
* **Reserve Servants (3 ช่อง):** แสดงตัวสำรองในสถานะ Spirit Form (คลิกเพื่อเปิดอ่านสกิล/NP เตรียมแผน Tag-Out)  
* **Inventory (กระเป๋าไอเทม):** รายการ Mystic Codes ที่มี พร้อม Tooltip อธิบายผลของแต่ละชิ้น

## **5.2 Right Sidebar — Secret Command Queue Panel**

ออกแบบให้ส่งคำสั่งทั้ง 3 ตนได้ครบภายใน 15–20 วินาที:

* แบ่งเป็น **3 การ์ดคำสั่ง** ตาม Active Servant ของตนเอง แต่ละการ์ดประกอบด้วย:  
  1. **Action Dropdown / Segmented Buttons:** `Move`, `Attack`, `Move+Atk`, `Skill`, `NP`, `Guard`, `Explore/Shop`, `Tag-Out`, `Custom`  
  2. **Target Picker Button (`Pick Tile / Unit`):** กดแล้วไปคลิกจิ้มช่องปลายทางหรือตัวศัตรูบนกระดานได้เลย ระบบจะกรอกพิกัดให้อัตโนมัติ (เช่น `Central (3,2)`) และวาดเส้นประนำทางให้เห็นเฉพาะบนจอตัวเอง  
  3. **Note Input (1 บรรทัด):** พิมพ์ชื่อสกิล ไอเทม หรือเรย์จูที่ต้องการใช้  
* **ปุ่มยืนยันด้านล่างสุด:** ปุ่มสีส้มขนาดใหญ่ **`LOCK TURN (READY)`**  
  * เมื่อกดแล้ว ระบบจะบันทึกคำสั่งลง `secrets/master_a` (หรือ `master_b`) และตั้ง `readyLocked = true`  
  * หน้าจอจะล็อกฟอร์มเป็น Read-only พร้อมข้อความ *"รออีกฝั่ง / รอ Ruler เฉลยผล..."*

# **6\. หน้าจอฝั่ง Ruler / GM (Ruler God-Mode Interface)**

หน้าจอของ Ruler ต้องควบคุมทุกอย่างได้เหมือนจับหมากบนโต๊ะจริงโดยไม่มีอะไรมาบล็อก:

## **6.1 Ruler Control Strip (แถบควบคุมพิเศษใต้ Top Bar)**

* **Phase Stepper & Secret Grail Controller:** ปุ่มกดเปลี่ยนเฟสตามลำดับ `[Draft]` → `[Event]` → `[Planning]` → `[Resolution]` → **`[End Turn & Next]`**  
  * มีช่องปรับแก้ไขค่า **`Secret Grail Turn (10–12)`** และปุ่มสวิตช์สั่งการสถานะ **`Grail Manifested (จอกจุติ)`** สดๆ เฉพาะหน้าจอ Ruler  
  * ปุ่ม **`End Turn & Next`** จะบวกเลขเทิร์น `+1`, แจก `+2 Mana` ให้ทั้ง 2 ฝั่งอัตโนมัติ และเคลียร์คำสั่งลับ  
* **สวิตช์ `Show Command Arrows`:** เปิด-ปิดเส้นลูกศรคำสั่งลับบนกระดาน  
* **สวิตช์ `Fog of War`:** เปิด-ปิดหมอกสงครามทั้งแมพในคลิกเดียว  
* **ปุ่ม `Undo` (พร้อมตัวเลข Stack เช่น `Undo (8)`):** ย้อนกลับ Game State ก่อนหน้าจาก Local History Stack ได้ทันทีหากลากพลาดหรือแก้เลขผิด

## **6.2 Left Sidebar — Roster, Resources & Map Tools**

* **Resource Override Box (Team A / Team B):** ปุ่ม `-1 / +1` แก้ `Mana`, `QP`, `Command Spells`, `Kills` ของทั้งสองฝั่งสดๆ พร้อมปุ่ม `+ Give Item` (เลือกจาก `items.json`) และปุ่ม `Reset Seat` เผื่อเพื่อนหลุดแล้วเปลี่ยนเครื่อง  
* **Quick Map Tools:**  
  * ปุ่ม **`Spawn Monster`** (เลือกชนิดจาก `monsters.json` หรือสุ่ม Stray Servant แล้วคลิกวางบนช่อง)  
  * ปุ่ม **`Spawn Greater Grail`** (วางจอกลงช่องกลาง Central เมื่อถึงเทิร์นที่ 10\)  
  * ปุ่ม **`Reset All Cleared Tiles`** (ล้างป้าย `CLEARED` ทุกช่องเมื่อครบรอบ 3 เทิร์น)  
* **Master Unit List:** รายชื่อยูนิตทั้งหมดแยกหมวด `Team A`, `Team B`, `PvE Monsters` (คลิกเพื่อเปิด Unit Inspector แม้ตัวนั้นจะอยู่ในสถานะ Reserve หรือ Defeated)

## **6.3 Right Sidebar — สลับได้ 2 แท็บ (`Unit Inspector` \| `Secret Orders`)**

1. **แท็บ `Unit Inspector` (เมื่อคลิกเลือกยูนิตใดก็ได้):**  
   * แสดงรูป, ชื่อ, คลาส และกล่องอ่านคำอธิบาย Skill / NP จาก `servants.json`  
   * **Stat Editors (ปรับสด):** ปุ่ม `- / +` และช่องตัวเลขสำหรับ `HP`, `Max HP`, `ATK`, `MOV` (แก้ใน Local Form แล้วกด `Save` หรือ Auto-commit Debounce 400ms เพื่อประหยัด Firestore Write)  
   * **Zone Teleport:** ปุ่มย้ายโซนด่วน `[Move to Base A]` `[Central]` `[Base B]` สำหรับย้ายตัวหมากข้ามโซนในคลิกเดียว  
   * **Status & Visibility Toggles:** สวิตช์ `NP Ready`, `Reveal through Fog`, และปุ่มเปลี่ยนสถานะ `Active` / `Reserve` / `Defeated` / `Remove`  
   * **Custom Buff / Status Tags:** ช่องพิมพ์ Tag อิสระ \+ ปุ่ม **Quick-Tags** ยอดนิยม (`Guard`, `Evade 1x`, `Invincible`, `Stun`, `ATK+1`, `Guts`, `Engaged`) กดแล้วแปะขึ้นตัวหมากทันที และคลิก `×` เพื่อลบออก  
2. **แท็บ `Secret Orders` (อ่านคำสั่งลับพร้อมกัน):**  
   * แบ่งบน-ล่างเป็น **Team A Orders (แดง)** และ **Team B Orders (น้ำเงิน)**  
   * แสดงรายการคำสั่งทั้ง 3 ตัวของแต่ละฝั่งพร้อมช่องติ๊กถูก `[✓]` ส่วนตัวของ GM เพื่อไล่เช็กตอนเฉลยผล Priority 1 → 4 จะได้ไม่ลืมทำคำสั่งไหนตกหล่น  
   * มีปุ่ม `Unlock Master A` / `Unlock Master B` เผื่อกรณีเพื่อนเผลอกด Lock ผิดแล้วขอแก้

## **6.4 Tile Context Popover (คลิกช่องว่างบนกระดานในโหมด Ruler)**

เมื่อ Ruler คลิกขวา (หรือคลิกช่องว่าง) จะมี Popover เล็กๆ เด้งขึ้นให้สั่งการช่องนั้นได้ทันที:

* สลับสถานะ `Mark Cleared` / `Restore Tile`  
* พิมพ์ `Custom Note` แปะบนช่อง (เช่น *"Grail Mud \-1 HP"*, *"Trap"*)  
* ปุ่มลัด `Spawn Monster Here`

# **7\. หน้าต่างป๊อปอัปที่ใช้ร่วมกัน (Shared Interactive Modals)**

## **7.1 Built-in Wheel Modal (วงล้อสุ่ม Real-time)**

* Ruler สามารถสลับเลือก 3 วงล้อในหน้าต่างเดียว:  
  1. **`Servant Draft Wheel`** (ดึงรายชื่อจาก `draftPoolRemaining` ที่ยังไม่ถูกเลือก)  
  2. **`Map Event Wheel`** (ดึงจาก `events.json -> mapEvents` ตามน้ำหนักการสุ่ม)  
  3. **`Personal Event Wheel`** (ดึงจาก `events.json -> personalEvents`)  
* เมื่อ Ruler กด **`SPIN WHEEL`** ระบบจะอัปเดต `wheelBroadcast` ทำให้ Modal วงล้อเด้งเปิดบนหน้าจอทั้ง 3 คนพร้อมกัน เล่นอนิเมชันหมุน 3–4 วินาที แล้วหยุดที่ผลลัพธ์ตรงกันทุกเครื่อง  
* **ปุ่มทำงานต่อหลังวงล้อหยุด (เฉพาะหน้าจอ Ruler):**  
  * โหมด Draft: ปุ่ม **`Assign to Team A (แดง)`** / **`Assign to Team B (น้ำเงิน)`** / **`Spawn as Stray Boss`** (กดแล้วตัดชื่อออกจาก `draftPoolRemaining` อัตโนมัติ)  
  * โหมด Map Event: ปุ่ม **`Set as Active Turn Event`** (นำข้อความไปขึ้นแถบ Top Bar HUD ทันที)

## **7.2 Grail Absorption Banner (GrailAbsorptionBanner.tsx)**

* แบนเนอร์ป๊อปอัปสีทอง-ดำเด้งขึ้นกลางจอทั้ง 3 เครื่องพร้อมกันทุกครั้งที่มี Servant ถูกเปลี่ยนสถานะเป็น `Defeated`:  
  1. *"วิญญาณวีรชน \[ชื่อ Servant\] ถูกจอกศักดิ์สิทธิ์กลืนกินแล้ว... (ภาชนะจอก X / 5)"*  
* เมื่อสะสมดวงวิญญาณครบ **`5 / 5`** หรือถึงเทิร์นลับ `secretGrailTurn` แบนเนอร์จะแสดงเอฟเฟกต์พิเศษอลังการแจ้งเตือนว่า **"จอกศักดิ์สิทธิ์ได้จุติลง ณ ใจกลางฟุยุกิแล้ว\!"**

## **7.3 Dice Roller Modal & Broadcast Toast (1d6)**

* ทอยเต๋าพร้อม Toast แจ้งเตือนมุมขวาล่าง ซิงก์ผล real-time 3 หน้าจอ

## **7.4 Servant Catalog & Reference Modal (43 Servants)**

* หน้าต่างค้นหาและดูข้อมูลวีรชน **`43 Servants`** แยกตามคลาส พร้อมตาราง Mystic Codes และกติกาย่อ 1 หน้า

## **7.5 Game Log Drawer**

* แถบ Slide-over ด้านขวา แสดงประวัติการเล่นล่าสุด 50 รายการ แบ่งกลุ่มตามหมายเลขเทิร์น มีตัวกรองดูเฉพาะ `Combat/Dice`, `Events`, หรือ `All`

# **8\. สรุปรายการ Components สำหรับสั่งงาน AntiGravity**

เพื่อให้โค้ดสอดคล้องกับโครงสร้างโฟลเดอร์ใน `02_ARCHITECTURE.md`:

| โฟลเดอร์ | ชื่อ Component หลัก | หน้าที่สำคัญ |
| :---- | :---- | :---- |
| `components/lobby/` | `LobbyView.tsx`, `SeatSelector.tsx` | สร้างห้องพร้อมสุ่ม secretGrailTurn (10-12), จอง/รีจอยที่นั่ง |
| `components/board/` | `GameBoard.tsx`, `ZoneTabs.tsx`, `GridTile.tsx`, `UnitToken.tsx`, `CommandArrowsSvg.tsx`, `FogOverlay.tsx`, `TileInfoTooltip.tsx` | เรนเดอร์กระดาน 10x7, ภูมิประเทศ 2 ชั้น \+ ชื่อภาษาไทย, ซ่อนตัวในป่า, Tooltip คำอธิบาย |
| `components/master/` | `MasterRosterSidebar.tsx`, `SecretCommandPanel.tsx` | แสดง Active/Reserve/Inventory และฟอร์มส่งคำสั่งลับ 3 ช่อง \+ ปุ่ม Lock Turn |
| `components/ruler/` | `RulerControlStrip.tsx`, `RulerToolsSidebar.tsx`, `UnitInspectorPanel.tsx`, `SecretOrdersViewer.tsx`, `TilePopover.tsx` | แผง God-Mode, ตั้งค่า Secret Grail Turn (10-12), สวิตช์ Grail Manifested และ Undo |
| `components/modals/` | `WheelModal.tsx`, `DiceModal.tsx`, `DiceToast.tsx`, `CatalogModal.tsx`, `GrailAbsorptionBanner.tsx`, `GameLogDrawer.tsx` | วงล้อสุ่ม, ลูกเต๋า 1d6, คลัง 43 Servants, แบนเนอร์จอกกลืนกินวิญญาณ 5/5 และ Log |

