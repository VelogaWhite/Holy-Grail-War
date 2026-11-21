# **03\_UI\_SPEC.md — Fate: Holy Grail War (UI/UX & Component Specification)**

เอกสารข้อกำหนดหน้าจอ Layout และส่วนติดต่อผู้ใช้สำหรับเว็บแอป **Fate: Holy Grail War (Custom VTT)** แยกการแสดงผลตามบทบาท (Ruler / GM, Master A, Master B) ใช้งานร่วมกับ 01\_GAME\_RULES.md และ 02\_ARCHITECTURE.md

# **1\. ระบบสีและแนวทางการออกแบบ (Design System & Theme)**

ออกแบบด้วยแนวทาง High-Contrast Light Tactical UI เพื่อให้อ่านสเตตัส ตัวอักษร และตำแหน่งหมากบนกระดาน 6x6 ได้ชัดเจนตลอดการเล่นหลายชั่วโมง โดยไม่ต้องเพ่งสายตา:

| องค์ประกอบ (Token) | ค่าสีแนะนำ (Tailwind / Hex) | การใช้งานหลัก |
| :---- | :---- | :---- |
| **Background (พื้นหลังหลัก)** | `bg-slate-50` (`#F8FAFC`) / `bg-white` (`#FFFFFF`) | พื้นหลังแอป การ์ด และแผงเครื่องมือทั้งหมด (ใช้ Light Theme เป็นหลัก) |
| **Primary Text (ตัวอักษรหลัก)** | `text-slate-950` (`#020617`) / `text-black` (`#000000`) | ชื่อตัวละคร ค่าสถานะ ตัวเลขพิกัด และหัวข้อทั้งหมด |
| **Primary Accent (สีเน้นหลัก)** | `bg-orange-500` / `text-orange-600` (`#F97316` / `#EA580C`) | ปุ่มแอ็กชันหลัก (Lock Turn, Spin Wheel, Next Turn), แท็บโซนที่เลือกอยู่, แถบ Ruler God-Mode, ช่อง Gate และจอกศักดิ์สิทธิ์ |
| **Borders & Grid Lines** | `border-slate-900` (กรอบหลัก) / `border-slate-300` (เส้นตาราง) | ขอบกระดาน 6x6 และเส้นแบ่งแผงให้ดูคมชัดสไตล์บอร์ดเกม |
| **Team A (Red Faction)** | `bg-red-600` / `border-red-600` (`#DC2626`) | ขอบตัวหมาก ฝั่งซ้าย, แถบทรัพยากร Team A, เส้นลูกศรคำสั่งฝั่ง A |
| **Team B (Blue Faction)** | `bg-blue-600` / `border-blue-600` (`#2563EB`) | ขอบตัวหมาก ฝั่งขวา, แถบทรัพยากร Team B, เส้นลูกศรคำสั่งฝั่ง B |
| **PvE / Neutral** | `bg-stone-700` / `border-amber-600` | ตัวหมากมอนสเตอร์ PvE และ Stray Servant |
| **Status / Warning** | เขียว (`#16A34A`) \= ช่องเดินได้ปกติ, ส้มเข้ม (`#EA580C`) \= ติด ZoC (-1 MOV) / Collision Alert | ไฮไลต์ช่วยคำนวณบนกระดาน |

* **ขนาดหน้าจอเป้าหมาย:** Desktop-First (`1280x720` ขึ้นไป) ใช้โครงสร้าง **Full Viewport (`h-screen overflow-hidden`)** เพื่อให้กระดาน 6x6 อยู่กลางจอตลอดเวลาโดยไม่ต้องสโครลหน้าเว็บหลัก (ให้สโครลเฉพาะภายใน Sidebar หรือ Modal)

# **2\. หน้าจอล็อบบี้และเลือกที่นั่ง (Lobby Screen)**

หน้าแรกเมื่อเปิดเว็บ (หลังจากระบบเรียก `signInAnonymously()` เสร็จ):

1. **การ์ดกลางจอ (Centered Card):** แสดงชื่อเกม **FATE: HOLY GRAIL WAR — VTT**  
2. **ฝั่งสร้างห้องใหม่ (Create Room — สำหรับ Ruler):**  
   * ช่องกรอกชื่อทีมเริ่มต้น (ค่าเริ่มต้น `Team A (Red)` / `Team B (Blue)`) และช่อง **Optional 4-Digit Ruler PIN**  
   * ปุ่มสีส้มขนาดใหญ่ **`Create New War Room`** — เมื่อกดจะสร้างห้องใน Firestore พร้อมสุ่ม Room Code 6 หลัก (เช่น `FGO-482`) และพาเข้าสู่หน้าจอ Ruler ทันที  
3. **ฝั่งเข้าร่วมห้อง (Join Room):**  
   * ช่องกรอก `Room Code` \+ ปุ่ม `Find Room`  
   * เมื่อพบห้อง จะแสดงการ์ดเลือกที่นั่ง **3 ใบเรียงแนวนอน**:  
     * **Ruler / GM** (ขอบสีส้ม) — แสดงสถานะ `Available` หรือ `Occupied` (ต้องใส่ PIN หากตั้งไว้)  
     * **Master A — Red Faction** (ขอบสีแดง)  
     * **Master B — Blue Faction** (ขอบสีน้ำเงิน)  
   * หากเบราว์เซอร์เดิมเคยเข้าที่นั่งไหนไว้แล้ว (`uid` ตรงกัน) ให้แสดงปุ่ม **`Rejoin Seat`** เพื่อกลับเข้าเกมเดิมทันที

# **3\. โครงสร้างหน้าจอหลัก (Main Workspace — 3-Column Layout)**

แบ่งพื้นที่หน้าจอ `100vh` ออกเป็น 4 ส่วนหลักดังนี้:

```
+---------------------------------------------------------------------------------+
| TOP BAR HUD: [Room: FGO-482] [Turn 4 | Phase: Planning] [Active Map Event]      |
|              [Team A: Mana/QP/CS | Ready?]  [Team B: Mana/QP/CS | Ready?]       |
|              [Catalog] [Wheel] [Dice 1d6] [Logs]                                |
+------------------+-------------------------------------------+------------------+
|  LEFT SIDEBAR    |            CENTER STAGE (BOARD)           |  RIGHT SIDEBAR   |
|  (Width: 280px)  |            (Flex-1, Centered)             |  (Width: 340px)  |
|                  |                                           |                  |
|  [Master View]   |   [ Base A (2) ] [ Central (3) ] [ Base B]|  [Master View]   |
|  - Active (3)    |   +-----+-----+-----+-----+-----+-----+   |  - Secret        |
|  - Reserve (3)   |   |  0  |  1  |  2  |  3  |  4  |  5  |   |    Command Queue |
|  - Inventory     |   |     |     |     |     |     |     |   |    (3 Slots)     |
|                  |   |        6x6 Interactive Grid       |   |  - [LOCK TURN]   |
|  [Ruler View]    |   |      + Tokens + SVG Arrows        |   |                  |
|  - All Units     |   |      + Fog of War Overlay         |   |  [Ruler View]    |
|  - Spawn PvE     |   +-----+-----+-----+-----+-----+-----+   |  - Unit Inspector|
|  - Fog Toggle    |                                           |    (God-Mode)    |
|  - [Undo (12)]   |   [Legend Bar: Tile Icons & ZoC Guide]    |  - Secret Orders |
+------------------+-------------------------------------------+------------------+
```

## **3.1 Top Bar HUD (แถบข้อมูลบนสุด — สูง 64px)**

* **ซ้าย:** ป้ายรหัสห้อง (คลิกเพื่อ Copy), เลขเทิร์น (`Turn 4`), และป้ายเฟสปัจจุบัน (`DRAFT` / `EVENT` / `PLANNING` / `RESOLUTION`)  
* **กลาง:**  
  * กล่องสรุป **Team A (แดง)** และ **Team B (น้ำเงิน)** แสดงค่า `Mana`, `QP`, ขีด `Command Spells` (ไอคอน 3 ขีด), ตัวนับ `Kills (X/4)`, และป้ายสถานะ `Waiting...` / `LOCKED`  
  * แถบย่อยด้านล่าง (หรือป้ายกลาง) แสดง **Active Map Event** ประจำเทิร์น (เช่น *"Haste Wind: ทุกตัว \+1 MOV"*) พร้อม Tooltip อ่านคำอธิบายเต็ม  
* **ขวา:** ปุ่มเครื่องมือร่วม 4 ปุ่ม:  
  1. **`Catalog`** (เปิดดู Servant 32+ ตน, ร้านค้า QP และกติกาย่อ)  
  2. **`Wheel`** (เปิดหน้าต่างวงล้อสุ่ม — Ruler กดหมุนได้, Master ดูได้อย่างเดียว)  
  3. **`Dice 1d6`** (เปิดป๊อปอัปทอยเต๋าด่วน)  
  4. **`Logs`** (เปิดแถบเลื่อนดูบันทึกเหตุการณ์ย้อนหลัง 50 รายการ)

# **4\. กระดาน 6x6 ตัวหมาก และ Overlays (Center Stage)**

## **4.1 Zone Switcher Tabs (แท็บสลับ 3 โซน)**

* วางปุ่มแท็บขนาดใหญ่เหนือกระดาน: **`Base A (Red)`** ↔ **`Central Fuyuki`** ↔ **`Base B (Blue)`**  
* แท็บที่เลือกอยู่ไฮไลต์ด้วยแถบสีส้ม (`border-b-4 border-orange-500`)  
* บนแต่ละแท็บมี Badge ตัวเลขเล็กๆ แสดงจำนวน Servant ที่มองเห็นได้ในโซนนั้น เพื่อไม่ให้ลืมตัวละครที่อยู่อีกโซน

## **4.2 การแสดงผลช่องตาราง (Tile Visuals)**

* กระดานขนาด `6x6` สัดส่วนจัตุรัส (`aspect-square`) ช่องละประมาณ `80x80px – 96x96px`  
* มุมซ้ายบนของแต่ละช่องแสดงพิกัดตัวจาง (`A1`–`F6` หรือ `0,0`–`5,5`)  
* **สัญลักษณ์ช่องพิเศษ (วางตรงกลางหรือมุมขวาล่าง):**  
  * **Leyline:** วงเวทสีฟ้า/ส้ม พร้อมป้าย `+2M` หรือ `+3M`  
  * **QP Cache:** ไอคอนหีบสมบัติสีทอง  
  * **Personal Event:** เครื่องหมาย `?` สีส้มเด่น  
  * **Monster Nest:** ไอคอนหัวกะโหลกสีเทาเข้ม  
  * **Safe House / Church:** ไอคอนไม้กางเขน/โล่สีเขียว  
  * **Gate (ช่องเชื่อมโซน):** แถบขอบช่องด้านที่เชื่อมเป็นสีส้มพร้อมลูกศร (`→ Central`, `← Base A`) คลิกที่ป้ายลูกศรเพื่อสลับไปดูโซนปลายทางได้ทันที  
  * **Greater Grail Site (ใจกลาง Central):** ไอคอนถ้วยจอกสีทอง-ส้ม มีตัวนับเทิร์นยึดครอง (`Hold: 1/2`) เมื่อถึงเทิร์นที่ 10  
* **สถานะช่องถูกเคลียร์ (`cleared: true`):** แสดงแถบคาดสีเทาโปร่งและป้ายเล็กๆ คำว่า `CLEARED`  
* **Custom Note จาก GM:** หากช่องมี `customNote` ให้แสดงไอคอนหมุดสีส้มมุมขวาบน เมื่อเอาเมาส์ชี้จะขึ้นข้อความโน้ต

## **4.3 การออกแบบตัวหมาก (Unit Token)**

* วางอยู่กลางช่อง ใช้กรอบสี่เหลี่ยมมนหรือวงกลมพร้อม **ขอบหนา 3px ตามสีฝ่าย** (Team A แดง, Team B น้ำเงิน, PvE เทา/ส้ม)  
* **รูปภาพ \+ Fallback:** ดึงรูปจาก `unit.image` หากโหลดไม่ได้ให้แสดงพื้นหลังสีฝ่ายพร้อมตัวอักษรย่อ 2–3 ตัวของชื่อ (เช่น `ART`, `MEL`, `GIL`)  
* **ข้อมูลบนตัวหมาก (มองเห็นได้ทันทีโดยไม่ต้องคลิก):**  
  * มุมซ้ายบน: ไอคอนคลาสขนาดเล็ก (Saber, Archer ฯลฯ)  
  * มุมขวาบน: จุดสีส้มเรืองแสงเมื่อ `npReady: true` หรือไอคอนรูปตาเมื่อ Ruler กด `Reveal`  
  * ด้านล่าง: หลอด HP แนวนอน \+ ตัวเลขคมชัด (`12/14`)  
  * ด้านบน/ขอบล่าง: แสดง **Custom Buff Tags** เป็นป้าย Pill ขนาดเล็กสูงสุด 2 ป้าย (เช่น `Evade`, `Stun`) และ `+N` หากมีมากกว่า 2 ป้าย  
* **เมื่อเอาเมาส์ชี้ (Hover Tooltip):** แสดงการ์ดย่อ (ชื่อเต็ม, ATK, MOV, Range, Tags ทั้งหมด)

## **4.4 Overlays ช่วยเล่นบนกระดาน**

1. **Movement & ZoC Highlight (Visual Helper):**  
   * เมื่อคลิกเลือก Servant บนกระดาน ช่องที่เดินถึงได้ตามระยะ `MOV` (รวมช่อง Gate) จะไฮไลต์ขอบสีเขียวอ่อน  
   * หากตัวละครติด **Zone of Control (Engaged)** จากศัตรูที่ยืนติด 1 ช่อง ช่องที่เป็นการเดินถอยหนีจะถูกจำกัดระยะ `-1 MOV` และแสดงป้ายเตือนสีส้ม `ZoC (-1)` ให้เห็นชัด (ยกเว้น Assassin)  
2. **Fog of War Overlay (เฉพาะหน้าจอ Master):**  
   * หาก `fogConfig.enabled === true` และฝั่งเรายังไม่มี Servant อยู่ใน Base Zone ของศัตรู โซนฐานทัพศัตรูจะถูกคลุมด้วยม่านสีเทาอ่อน (`bg-slate-200/80 backdrop-blur-[2px]`) พร้อมข้อความ *"Fog of War — ส่ง Servant ข้าม Gate เพื่อเปิดพื้นที่"* และซ่อนตัวหมากศัตรูในโซนนั้น (ยกเว้นตัวที่ `isRevealedToEnemy: true`)  
3. **Command Arrow Overlay (เฉพาะหน้าจอ Ruler):**  
   * เมื่อ Master A หรือ B กดส่งคำสั่งลับ หน้าจอ Ruler จะวาด **SVG Arrow Overlay** ทับบนกระดาน (ลูกศรสีแดง \= Team A, สีน้ำเงิน \= Team B) ชี้จากตำแหน่งปัจจุบันไปยัง `targetPosition` หรือ `targetUnitId` พร้อมป้ายไอคอนแอ็กชันตรงปลายลูกศร  
   * **Collision Alert:** หากปลายลูกศรของ Team A และ Team B ชี้มาที่พิกัดเดียวกันพอดี ให้ไฮไลต์ช่องนั้นด้วยกรอบเส้นประสีส้มเข้มพร้อมป้าย `COLLISION!` เพื่อให้ Ruler สังเกตเห็นทันที

# **5\. หน้าจอฝั่ง Master (Master A / Master B Specific UI)**

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

* **Phase Stepper:** ปุ่มกดเปลี่ยนเฟสตามลำดับ `[Draft]` → `[Event]` → `[Planning]` → `[Resolution]` → **`[End Turn & Next]`**  
  * ปุ่ม **`End Turn & Next`** จะบวกเลขเทิร์น `+1`, แจก `+2 Mana` ให้ทั้ง 2 ฝั่งอัตโนมัติ (เลือกติ๊กยกเว้นได้หากติด Event `Mana Drought`), และเคลียร์คำสั่งลับ `secrets/master_a`, `master_b`  
* **สวิตช์ `Free Drag (God-Mode)`:** เปิดไว้เป็นค่าเริ่มต้นให้ Ruler ลากตัวหมากของใครก็ได้ไปวางช่องไหนก็ได้ทันที (ไม่ติดข้อจำกัด MOV หรือ ZoC)  
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

## **7.2 Dice Roller Modal & Broadcast Toast (1d6)**

* ใครก็ได้ในห้อง (Ruler หรือ Master) สามารถเปิดปุ่ม `Dice 1d6`, ใส่ป้ายกำกับสั้นๆ (เช่น *"Artoria Attack"* หรือ *"QP Cache"*), แล้วกด **`Roll 1d6`**  
* ผลลัพธ์จะอัปเดตผ่าน `diceBroadcast` และเด้งเป็น **Notification Toast** มุมขวาล่างบนจอทั้ง 3 คนพร้อมกัน แสดงเลขลูกเต๋าขนาดใหญ่และแปลผล Combat Bonus ให้อัตโนมัติ (`1–2: +0`, `3–4: +1`, `5–6: +2 CRIT!`) พร้อมบันทึกลง Game Log

## **7.3 Servant Catalog & Reference Modal**

* หน้าต่างขนาดใหญ่แบบ 3 แท็บย่อย:  
  1. **`Servants (32+)`:** ช่องค้นหาชื่อ \+ ปุ่มกรองตามคลาส (Saber, Archer, Lancer, Rider, Caster, Assassin, Berserker) แสดงเป็น Grid การ์ดสีขาวขอบดำ บอก HP, ATK, MOV, Range, Skill, NP และป้ายสถานะว่าตัวไหนถูกดราฟต์ไปแล้ว (`Team A` / `Team B` / `In Pool`)  
  2. **`Mystic Codes (QP Shop)`:** ตารางรายการไอเทมทั้งหมด ราคา QP และคำอธิบายเอฟเฟกต์  
  3. **`Quick Rules`:** สรุปกติกาสำคัญ 1 หน้า (สูตร 1d6, ZoC, ลำดับ Priority 1–4, ผลเรย์จู) เพื่อให้อ้างอิงระหว่างเล่นได้ทันทีโดยไม่ต้องสลับหน้าต่าง

## **7.4 Game Log Drawer**

* แถบ Slide-over ด้านขวา แสดงประวัติการเล่นล่าสุด 50 รายการ แบ่งกลุ่มตามหมายเลขเทิร์น มีตัวกรองดูเฉพาะ `Combat/Dice`, `Events`, หรือ `All`

# **8\. สรุปรายการ Components สำหรับสั่งงาน AntiGravity**

เพื่อให้โค้ดสอดคล้องกับโครงสร้างโฟลเดอร์ใน `02_ARCHITECTURE.md`:

| โฟลเดอร์ | ชื่อ Component หลัก | หน้าที่สำคัญ |
| :---- | :---- | :---- |
| `components/lobby/` | `LobbyView.tsx`, `SeatSelector.tsx` | สร้างห้อง, กรอก Room Code, จอง/รีจอยที่นั่ง |
| `components/board/` | `GameBoard.tsx`, `ZoneTabs.tsx`, `GridTile.tsx`, `UnitToken.tsx`, `CommandArrowsSvg.tsx`, `FogOverlay.tsx` | เรนเดอร์กระดาน 6x6, Drag & Drop (`@dnd-kit/core`), ไฮไลต์ MOV/ZoC, วาดลูกศร SVG และ Fog |
| `components/master/` | `MasterRosterSidebar.tsx`, `SecretCommandPanel.tsx` | แสดง Active/Reserve/Inventory และฟอร์มส่งคำสั่งลับ 3 ช่อง \+ ปุ่ม Lock Turn |
| `components/ruler/` | `RulerControlStrip.tsx`, `RulerToolsSidebar.tsx`, `UnitInspectorPanel.tsx`, `SecretOrdersViewer.tsx`, `TilePopover.tsx` | แผง God-Mode ทั้งหมด, แก้สเตตัส/Tag, จัดการทรัพยากร, เสกมอนสเตอร์ และปุ่ม Undo |
| `components/modals/` | `WheelModal.tsx`, `DiceModal.tsx`, `DiceToast.tsx`, `CatalogModal.tsx`, `GameLogDrawer.tsx` | วงล้อสุ่มแบบซิงก์ 3 จอ, ลูกเต๋า 1d6, คลังข้อมูล 32+ Servant และแถบ Log |

