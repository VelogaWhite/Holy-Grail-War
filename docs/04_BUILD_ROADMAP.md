# **04\_BUILD\_ROADMAP.md — Fate: Holy Grail War**

# **Phased Build & AntiGravity Execution Plan**

แผนลำดับขั้นการพัฒนาเว็บแอป **Fate: Holy Grail War (Custom VTT)** แบ่งเป็น 5 ขั้นตอน (Pre-Flight \+ 4 Phases) เพื่อคุมขอบเขตการทำงานของ AI Coding Agent (AntiGravity) ให้สร้างทีละส่วน ทดสอบได้จริงทุกเฟส ไม่รวบทำทีเดียวจนโค้ดพัง และปลอดภัยภายใต้โควตาฟรีของ **Firebase Spark Plan**

---

# **0\. ภาพรวมลำดับการทำงาน (Roadmap Overview)**

| เฟส (Phase) | เป้าหมายหลัก (Milestone) | ทดสอบได้อย่างไร (Verification) |
| :---- | :---- | :---- |
| **Phase 0: Pre-Flight** | ตั้งโปรเจกต์ Vite \+ React \+ Tailwind \+ Firebase Spark และวางไฟล์เอกสาร/JSON | รัน `npm run dev` ขึ้นหน้าว่างได้โดยไม่มี Error และเชื่อม Firebase Config ครบ |
| **Phase 1: Static Board & Data** | เรนเดอร์กระดาน 3 โซน (6x6), อ่าน `src/data/*.json`, แสดงตัวหมาก \+ Fallback และ Catalog | สลับแท็บ 3 โซน เห็นช่องพิเศษครบ เปิดดูการ์ด 32+ Servant ได้ (ยังไม่ต่อ Firestore) |
| **Phase 2: Ruler God-Mode (Local)** | ระบบ Drag & Drop, Unit Inspector, Custom Tags, เสกมอนสเตอร์, ไฮไลต์ MOV/ZoC และปุ่ม Undo | เล่นจำลองคนเดียวบนเครื่องได้เหมือนบอร์ดเกม ลากหมาก แก้ HP/Mana และกด Undo ได้จริง |
| **Phase 3: Real-time & Secret WEGO** | เชื่อม Firestore (Spark), Lobby 3 ที่นั่ง, Security Rules, Fog of War, ส่งคำสั่งลับ \+ ลูกศร SVG | เปิดเบราว์เซอร์ 3 หน้าต่างพร้อมกัน (Ruler / Master A / Master B) ซิงก์ Real-time และกันแอบดูคำสั่งลับได้จริง |
| **Phase 4: Wheels, Dice & Deploy** | วงล้อสุ่ม 3 แบบซิงก์ 3 จอ, ลูกเต๋า 1d6 Toast, Game Log, ปรับ UI และ Deploy ขึ้น Firebase Hosting | เล่นจริงครบตั้งแต่ Draft \-\> เทิร์น 1-10 \-\> จบเกม และเปิดลิงก์ Hosting ให้เพื่อนเข้าได้ |

## **กฎการทำงานร่วมกับ AntiGravity (Workflow Rules)**

* **ทำทีละเฟสเท่านั้น:** ห้ามสั่งสร้าง Phase 3 ก่อนที่ Phase 1 และ 2 จะรันผ่านและตรวจสอบตาม Acceptance Criteria แล้ว  
* **Commit Git ทุกครั้งที่จบเฟส:** เมื่อผ่านการทดสอบในแต่ละเฟสให้สั่ง `git commit` เก็บจุดเซฟไว้ทันที เผื่อเฟสถัดไป AI แก้โค้ดพังจะได้ย้อนกลับได้  
* **ยึดเอกสารเป็น Source of Truth:** วางไฟล์ `01_GAME_RULES.md`, `02_ARCHITECTURE.md`, `03_UI_SPEC.md`, `04_BUILD_ROADMAP.md` ไว้ในโฟลเดอร์ `docs/` ของโปรเจกต์ แล้วอ้างอิงชื่อไฟล์ตรงๆ ทุกครั้งที่สั่งงาน

---

# **Phase 0: Pre-Flight Setup (เตรียมโปรเจกต์และ Firebase Spark)**

## **สิ่งที่ต้องเตรียมด้วยตัวเองก่อนสั่ง AntiGravity**

1. **สร้างโปรเจกต์บน Firebase Console (Spark Plan ฟรี):**  
   * เปิดใช้งาน **Authentication** \-\> Sign-in method \-\> เปิด **Anonymous**  
   * เปิดใช้งาน **Cloud Firestore** \-\> เลือก Region `asia-southeast1` (Singapore) \-\> เริ่มด้วย Production Mode (เดี๋ยวเราจะ Deploy `firestore.rules` ทับ)  
   * เปิดใช้งาน **Hosting** และจดค่า Web App Config มาใส่ในไฟล์ `.env.local` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`)  
2. **ตั้งโครงสร้างโฟลเดอร์เริ่มต้น:**  
   * สร้างโปรเจกต์ React \+ TypeScript ด้วย Vite และติดตั้งแพ็กเกจหลัก: `tailwindcss`, `lucide-react`, `zustand`, `@dnd-kit/core`, `firebase`  
   * นำไฟล์เอกสารทั้ง 4 ไฟล์ใส่ไว้ในโฟลเดอร์ `docs/`  
   * เตรียมโฟลเดอร์ `public/assets/` (`servants/`, `monsters/`, `classes/`, `items/`) — ไม่จำเป็นต้องใส่รูปครบตั้งแต่แรก เพราะระบบมี Image Fallback

## **Checklist จบ Phase 0**

- [ ] รัน `npm run dev` เปิดหน้าเว็บได้ปกติ ไม่มี TypeScript Error  
- [ ] มีไฟล์ `.env.local` และใส่ไว้ใน `.gitignore` เรียบร้อยแล้ว  
- [ ] ติดตั้ง `firebase-tools` (`npm i -g firebase-tools`) และรัน `firebase login` เรียบร้อย

---

# **Phase 1: Static Board, Types & Data Loader (Local Prototype)**

**เป้าหมาย:** สร้างโครงสร้าง Type, โหลดข้อมูลจาก `src/data/*.json` มาแสดงกระดาน 3 โซน 6x6 พร้อมตัวหมากตัวอย่าง และหน้าต่าง Servant Catalog ด้วย Theme สว่าง-ดำ-ส้ม ตาม 03\_UI\_SPEC.md (ยังไม่ต้องเชื่อมต่อ Firestore)

## **รายการงานใน Phase 1**

- [ ] สร้าง `src/types/game.ts` ตาม TypeScript Interfaces ใน `02_ARCHITECTURE.md` ครบทุกโมเดล  
- [ ] สร้างชุดไฟล์ข้อมูลตั้งต้นใน `src/data/`: `classes.json`, `servants.json` (ใส่โครงอย่างน้อย 8–10 ตัวก่อนเพื่อเทสต์ แล้วค่อยเติมครบ 32+), `monsters.json`, `items.json`, `events.json`, `maps.json` (ผัง 3 โซน 6x6 \+ พิกัด Gate และช่องพิเศษ)  
- [ ] สร้าง `src/utils/assetHelper.ts` รองรับทั้ง Local Path (`/assets/...`), External URL และ Image Fallback (วงกลมสีฝ่าย \+ ตัวอักษรย่อ \+ ไอคอนคลาส)  
- [ ] สร้าง Layout 3 คอลัมน์เต็มจอ (`h-screen overflow-hidden`) \+ Top Bar HUD ตามธีม High-Contrast Light Tactical UI (`bg-slate-50`, ตัวอักษรดำ, สีเน้นส้ม `#F97316`)  
- [ ] สร้าง `ZoneTabs.tsx`, `GameBoard.tsx`, `GridTile.tsx` (แสดงไอคอน Leyline, QP Cache, Personal Event `?`, Monster Nest, Safe House, Gate, Grail Site) และ `UnitToken.tsx` (หลอด HP, ขอบสีฝ่าย, ป้าย Tags)  
- [ ] สร้าง `CatalogModal.tsx` (3 แท็บ: Servants พร้อมช่องค้นหาและกรองคลาส, Mystic Codes, Quick Rules)

## **Copy-Paste Prompt สำหรับสั่ง AntiGravity (Phase 1\)**

```
อ่านเอกสาร docs/02_ARCHITECTURE.md และ docs/03_UI_SPEC.md แล้วดำเนินการเฉพาะ Phase 1 ตาม docs/04_BUILD_ROADMAP.md เท่านั้น (ยังไม่ต้องเชื่อม Firebase หรือทำระบบ Drag & Drop):
1. สร้าง src/types/game.ts ให้ตรงกับ Section 6 ของ 02_ARCHITECTURE.md
2. สร้างไฟล์ Mock JSON ใน src/data/ (classes.json, servants.json อย่างน้อย 8 ตัวครบทุกคลาส, monsters.json, items.json, events.json, maps.json ขนาด 6x6 จำนวน 3 โซนพร้อม Gate เหนือ/กลาง/ใต้)
3. สร้าง UI หลักแบบ 3-Column Full Viewport (Light Theme: พื้นขาว/slate-50, ตัวอักษรดำ, สีเน้นส้ม, ทีม A แดง, ทีม B น้ำเงิน) พร้อม Top Bar HUD, แท็บสลับ 3 โซน, กระดาน 6x6, UnitToken ที่มี Image Fallback และ CatalogModal
4. วาง Mock State ใน Zustand store เพื่อแสดงยูนิตตัวอย่างฝั่งละ 3 ตัวและมอนสเตอร์บนกระดานให้เห็นภาพชัดเจน
```

## **Acceptance Criteria (เกณฑ์ผ่าน Phase 1\)**

- [ ] กดสลับแท็บ `Base A` / `Central` / `Base B` และคลิกป้ายลูกศรตรงช่อง Gate เพื่อข้ามไปดูโซนถัดไปได้ทันที  
- [ ] เมื่อไม่มีไฟล์รูปใน `public/assets/` ตัวหมากแสดง Fallback สีตามฝ่ายและตัวอักษรย่อได้สวยงาม ไม่ขึ้นไอคอนรูปร้าว  
- [ ] เปิด `CatalogModal` ค้นหาชื่อและกรองคลาส Servant ได้ลื่นไหล และกระดาน 6x6 อยู่พอดีจอ 1280x720 โดยไม่ต้องสโครลหน้าหลัก

---

# **Phase 2: Ruler God-Mode & Local Board Mechanics**

**เป้าหมาย:** ทำให้กระดาน "เล่นได้จริงแบบ Local" เหมือนบอร์ดเกมบนโต๊ะ โดยใส่เครื่องมือ GM/Ruler God-Mode ครบชุด, ระบบคำนวณระยะเดิน/ZoC และระบบ Undo ใน Zustand

## **รายการงานใน Phase 2**

- [ ] สร้าง `src/utils/gridMath.ts`: คำนวณระยะเดิน (BFS / Manhattan) รองรับการข้าม Gate 3 โซน (นับเป็น 1 ก้าว) และเช็กสถานะ **Zone of Control (ZoC)** ลดระยะเดิน \-1 เมื่อถอยหนีจากศัตรูที่ยืนติด 1 ช่อง (ยกเว้นคลาสที่ `ignoreZoC: true` เช่น Assassin)  
- [ ] ผูก `@dnd-kit/core` เข้ากับ `GameBoard.tsx` และ `UnitToken.tsx` ให้ Ruler ลากหมากข้ามช่องได้อิสระเมื่อเปิด `Free Drag (God-Mode)`  
- [ ] สร้าง `RulerControlStrip.tsx`: Phase Stepper, ปุ่ม `End Turn & Next` (บวกเทิร์น \+ แจก \+2 Mana อัตโนมัติ), สวิตช์ `Free Drag`, `Fog of War` และปุ่ม `Undo` (ใช้ Local `historyStack` เก็บย้อนหลัง 15 จังหวะใน Zustand)  
- [ ] สร้าง `UnitInspectorPanel.tsx`: คลิกยูนิตแล้วแก้ HP / Max HP / ATK / MOV สดๆ, ปุ่มวาร์ปข้ามโซนด่วน (`Base A` / `Central` / `Base B`), สวิตช์ `NP Ready` / `Reveal`, เปลี่ยนสถานะ `Active / Reserve / Defeated`, และระบบแปะ/ลบ Custom Buff Tags \+ Quick-Tags (`Guard`, `Evade 1x`, `Stun`, `Guts`, `Engaged`)  
- [ ] สร้าง `RulerToolsSidebar.tsx`: กล่องปรับ Mana / QP / เรย์จู / Kills ของทั้งสองฝั่ง, ปุ่มแจกไอเทม, ปุ่ม `Spawn Monster`, `Spawn Greater Grail` และ `Reset All Cleared Tiles`  
- [ ] สร้าง `TilePopover.tsx`: คลิกขวาหรือคลิกช่องว่างเพื่อสลับ `Cleared`, ปัก `Custom Note` หรือเสกมอนสเตอร์ลงช่องนั้นทันที

## **Copy-Paste Prompt สำหรับสั่ง AntiGravity (Phase 2\)**

```
อ้างอิง docs/01_GAME_RULES.md, docs/02_ARCHITECTURE.md และ docs/03_UI_SPEC.md ให้ดำเนินการเฉพาะ Phase 2 ตาม docs/04_BUILD_ROADMAP.md (ทำงานบน Local Zustand Store ไปก่อน ยังไม่ต้องต่อ Firestore):
1. สร้าง src/utils/gridMath.ts คำนวณช่องเดินได้ตาม MOV, การข้าม Gate 3 โซน และไฮไลต์เตือน ZoC (-1 MOV เมื่อถอยหนีจากศัตรูระยะ 1 ช่อง ยกเว้น Assassin) โดยเป็นแค่ Visual Helper ห้ามบล็อกการลากของ Ruler
2. เพิ่มระบบ Free Drag & Drop ด้วย @dnd-kit/core ให้ลากตัวหมากไปวางช่องไหนก็ได้
3. สร้าง RulerControlStrip (พร้อม Local Undo Stack 15 ขั้น), RulerToolsSidebar (แก้ Mana/QP/เรย์จู, เสกมอนสเตอร์/จอก, รีเซ็ต Cleared), UnitInspectorPanel (แก้สเตตัส, วาร์ปข้ามโซน, Quick-Tags) และ TilePopover
4. เพิ่มสวิตช์ชั่วคราวบน Top Bar สำหรับจำลองสลับมุมมอง Ruler / Master A / Master B เพื่อทดสอบการแสดงผล
```

## **Acceptance Criteria (เกณฑ์ผ่าน Phase 2\)**

- [ ] ลาก Servant ข้ามช่อง, วาร์ปข้ามโซน, ลด HP, แปะ Tag `Evade 1x` และเสก Wyvern ลงช่องได้ทันที  
- [ ] กดปุ่ม `Undo` ย้อนกลับการลากหมากหรือแก้เลขได้ต่อเนื่องสูงสุด 15 ครั้งโดยไม่ค้าง  
- [ ] คลิกที่ตัวละครที่ยืนติดศัตรู 1 ช่องแล้วกระดานไฮไลต์เตือน `ZoC (-1)` ถูกต้อง (และ Assassin ไม่ติดโทษ ZoC)

---

# **Phase 3: Firebase Spark Real-time Sync, Lobby & Secret WEGO Turns**

**เป้าหมาย:** เชื่อมต่อ Firebase Firestore (Spark Plan) แยกบทบาท 3 เครื่องจริง, ป้องกันแอบดูคำสั่งลับด้วย Security Rules, ใส่ Fog of War และระบบสั่งการลับพร้อมลูกศร SVG Overlay

## **รายการงานใน Phase 3**

- [ ] สร้าง `src/services/firebase.ts`: ตั้งค่า Firebase App, Firestore และเรียก `signInAnonymously()` อัตโนมัติตอนเปิดแอป  
- [ ] สร้าง `src/services/roomService.ts`: ฟังก์ชันสร้างห้องสุ่มรหัส 6 หลัก, จอง/รีจอยที่นั่ง (`seats`), อัปเดต `rooms/{roomId}` และอ่าน/เขียนเอกสารลับ `secrets/master_a`, `secrets/master_b`  
- [ ] เขียน `firestore.rules` ตาม Section 8 ของ `02_ARCHITECTURE.md` และ Deploy กฎขึ้นโปรเจกต์เพื่อล็อกสิทธิ์การอ่าน/เขียนเอกสารความลับ  
- [ ] สร้าง `LobbyView.tsx` และ `SeatSelector.tsx` (รองรับ Optional 4-Digit Ruler PIN และปุ่ม `Reset Seat` ของ Ruler)  
- [ ] สร้างหน้าจอฝั่ง Master: `MasterRosterSidebar.tsx` (Active 3 / Reserve 3 / Inventory \+ ปุ่ม Locate), `FogOverlay.tsx` (ปิด Base Zone ศัตรูจนกว่าจะส่งตัวข้าม Gate หรือ Ruler กด Reveal) และ `SecretCommandPanel.tsx` (เลือก Action, กด Pick Tile/Unit จิ้มบนกระดาน, ใส่ Note และกด `LOCK TURN`)  
- [ ] สร้างฝั่งรับคำสั่งของ Ruler: `SecretOrdersViewer.tsx` (เทียบคำสั่ง Team A / Team B พร้อมช่องติ๊กเช็ก Priority 1-4 และปุ่ม Unlock) และ `CommandArrowsSvg.tsx` (วาดลูกศรแดง/น้ำเงินซ้อนกันบนกระดาน \+ ป้าย `COLLISION!` เมื่อปลายทางชนกัน)  
- [ ] ตรวจสอบ **AntiGravity Guardrails** ทั้งหมด (ห้าม `updateDoc` ใน `useEffect`, Cleanup ทุก `onSnapshot`, ยิง Write เฉพาะตอน `onDragEnd` หรือกด Save / Debounce 400ms)

## **Copy-Paste Prompt สำหรับสั่ง AntiGravity (Phase 3\)**

```
อ้างอิง docs/02_ARCHITECTURE.md (Section 4, 5, 8, 9) และ docs/03_UI_SPEC.md (Section 2, 4.4, 5, 6.3) ให้ดำเนินการ Phase 3 ตาม docs/04_BUILD_ROADMAP.md:
1. เชื่อมต่อ Firebase (Spark Plan: Anonymous Auth + Cloud Firestore) ผ่าน src/services/firebase.ts และ roomService.ts ใช้โครงสร้าง 1 เอกสารหลัก rooms/{roomId} + 2 เอกสารความลับ secrets/master_a และ secrets/master_b
2. สร้างไฟล์ firestore.rules ให้ตรงตามสเปกเพื่อป้องกัน Master แอบอ่านคำสั่งลับอีกฝั่ง
3. สร้าง LobbyView + SeatSelector พร้อมรองรับ Rejoin Seat เมื่อรีเฟรชหน้าเว็บ
4. สร้างหน้าจอ Master (MasterRosterSidebar, FogOverlay, SecretCommandPanel ที่มีปุ่ม Pick Tile/Unit และ LOCK TURN) และหน้าจอ Ruler (SecretOrdersViewer + CommandArrowsSvg ที่แจ้งเตือน COLLISION! เมื่อปลายลูกศรชนกัน)
5. ปฏิบัติตาม AntiGravity Guardrails ใน 02_ARCHITECTURE.md Section 9 อย่างเคร่งครัด: ห้ามยิง updateDoc ใน useEffect ที่ผูกกับ onSnapshot, ต้อง unsubscribe ทุกครั้ง และยิง write เฉพาะตอนจบ User Action เท่านั้น
```

## **Acceptance Criteria (เกณฑ์ผ่าน Phase 3\)**

- [ ] เปิด 3 หน้าต่างพร้อมกัน (Normal \+ Incognito 2 หน้าต่าง) เข้าห้องเดียวกันเป็น `Ruler`, `Master A`, `Master B` ได้ครบ  
- [ ] เมื่อ `Master A` กด `LOCK TURN` ฝั่ง `Master B` เห็นแค่สถานะว่า A ล็อกแล้วแต่ไม่เห็นคำสั่ง ส่วนฝั่ง `Ruler` เห็นคำสั่งและเส้นลูกศรสีแดงขึ้นทันที  
- [ ] เมื่อ `Ruler` ลากตัวหมากหรือลด HP จอของทั้ง `Master A` และ `Master B` อัปเดตภายใน 1 วินาที และเปิด Network/Firestore Usage ดูแล้วไม่เกิดการยิง Write รัวๆ เอง  
- [ ] `FogOverlay` ซ่อนยูนิตใน Base Zone ของศัตรูบนหน้าจอ Master ถูกต้อง และเปิดเผยเมื่อมี Servant เดินข้าม Gate เข้าไป

---

# **Phase 4: Built-in Wheels, Dice, Full Data & Deployment**

**เป้าหมาย:** เติมฟีเจอร์สร้างบรรยากาศบอร์ดเกมให้สมบูรณ์ (วงล้อสุ่มซิงก์ 3 จอ, ลูกเต๋า 1d6, Game Log), เติมข้อมูล Servant ครบ 32+ ตน และ Deploy ขึ้น Firebase Hosting เพื่อเล่นจริง

## **รายการงานใน Phase 4**

- [ ] สร้าง `WheelModal.tsx`: รองรับ 3 โหมด (`Servant Draft`, `Map Event`, `Personal Event`) ใช้ฟิลด์ `wheelBroadcast` ให้วงล้อหมุนและหยุดที่ผลลัพธ์ตรงกันทั้ง 3 จอ พร้อมปุ่ม `Assign to Team A / Team B / Stray Boss` (ตัดชื่อออกจาก `draftPoolRemaining` อัตโนมัติ) และ `Set as Active Turn Event`  
- [ ] สร้าง `DiceModal.tsx` และ `DiceToast.tsx`: ทอยเต๋า `1d6` ซิงก์ผ่าน `diceBroadcast` เด้งแจ้งเตือนพร้อมแปลผล Combat Bonus (`1-2: +0`, `3-4: +1`, `5-6: +2 CRIT!`) และบันทึกลง Log อัตโนมัติ  
- [ ] สร้าง `GameLogDrawer.tsx`: แสดงประวัติการเล่น 50 รายการล่าสุด แบ่งตามเทิร์นและมีตัวกรองหมวดหมู่  
- [ ] เติมข้อมูลจริงให้ครบในโฟลเดอร์ `src/data/` (`servants.json` ครบ 32+ ตน, `events.json` ครบทั้ง Map Events และ Personal Events, `items.json` ครบชุดร้านค้า QP) และนำรูปไอคอนมาวางใน `public/assets/`  
- [ ] สร้าง `firebase.json` ตั้งค่า SPA Rewrite (`** -> /index.html`) และ `Cache-Control: public, max-age=604800` สำหรับ `/assets/**`  
- [ ] รัน `npm run build` และ Deploy ด้วย `firebase deploy --only hosting,firestore:rules`

## **Copy-Paste Prompt สำหรับสั่ง AntiGravity (Phase 4\)**

t  
อ้างอิง docs/03\_UI\_SPEC.md (Section 7\) และ docs/02\_ARCHITECTURE.md (Section 10\) ให้ดำเนินการ Phase 4 ตาม docs/04\_BUILD\_ROADMAP.md:

1. สร้าง WheelModal.tsx รองรับ 3 วงล้อ (Servant Draft, Map Event, Personal Event) ซิงก์อนิเมชันและผลลัพธ์ผ่าน wheelBroadcast ไปยังทุกจอพร้อมกัน พร้อมปุ่ม Assign Team / Spawn Stray Boss / Set Active Map Event สำหรับ Ruler  
2. สร้าง DiceModal.tsx และ DiceToast.tsx สำหรับทอย 1d6 ซิงก์ผ่าน diceBroadcast พร้อมแสดงโบนัสดาเมจ (1-2: \+0, 3-4: \+1, 5-6: \+2 CRIT\!)  
3. สร้าง GameLogDrawer.tsx แสดงประวัติย้อนหลัง 50 รายการล่าสุดพร้อมตัวกรอง  
4. สร้างไฟล์ firebase.json ตั้งค่า Hosting SPA Rewrite และ Cache-Control 7 วันสำหรับ /assets/\*\* จากนั้นรัน npm run build ตรวจสอบให้ผ่านโดยไม่มี TypeScript error

```

### Acceptance Criteria (เกณฑ์ผ่าน Phase 4)

* [ ] Ruler กดหมุนวงล้อ Draft -> จอ Master A และ B เด้งวงล้อหมุนพร้อมกัน หยุดที่ตัวละครเดียวกัน และเมื่อกด Assign ชื่อนั้นหายออกจากวงล้อทันที
* [ ] กดทอยเต๋า 1d6 จากหน้าจอใครก็ได้ -> Toast เด้งครบทั้ง 3 จอและบันทึกเข้า Game Log ถูกต้อง
* [ ] `npm run build` ผ่าน 100% และเปิดลิงก์ `https://<project-id>.web.app` เข้าห้องเล่นข้ามเครื่อง/ข้ามเน็ตได้จริง

---

# เช็กลิสต์ทดสอบก่อนนัดเพื่อนเล่นจริง (Pre-Game Dry Run & Spark Safety)

1. **ทดสอบจบ 1 รอบย่อ (3 หน้าต่าง):** ลองเปิด 3 หน้าต่างเล่นเองตั้งแต่ Create Room -> Draft ฝั่งละ 6 ตัว -> ลง 3 ตัว -> เทิร์น 1 หมุน Map Event -> ส่งคำสั่งลับ 2 ฝั่งให้เดินชนช่องเดียวกัน (เช็กป้าย `COLLISION!`) -> กด `Undo` -> กด `End Turn & Next`
2. **ตรวจโควตา Firebase Spark:** หลังจบการทดสอบ 3–4 เทิร์น ให้เปิด Firebase Console -> Firestore -> **Usage** เช็กยอด Read/Write (ปกติควรอยู่ที่หลักร้อยครั้งเท่านั้น หากพุ่งหลักพันหรือหมื่นแสดงว่ามี Loop รั่ว ต้องตรวจ `useEffect` ทันที)
3. **ตรวจความพร้อมรูปภาพและตัวอักษร:** ลองเปิด `CatalogModal` ไล่เช็กชื่อ สเตตัส และรูปของ Servant ทั้ง 32+ ตนว่าไม่มีคำผิดหรือสเตตัสหลุดสเกล
```

