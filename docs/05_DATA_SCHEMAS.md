# **คลังข้อมูลเกม (`src/data/*.json`) — Fate: Holy Grail War (Custom VTT)**

เอกสารรวมโครงสร้าง Schema และข้อมูลตั้งต้นสำหรับไฟล์ JSON ทั้ง 7 ไฟล์ในโฟลเดอร์ `src/data/` ออกแบบให้โปรแกรม React \+ TypeScript Import ไปใช้งานได้โดยตรง และสามารถเพิ่ม/ลด/ปรับสมดุลตัวละคร FGO, มอนสเตอร์, ไอเทม, อีเวนต์ หรือแผนที่ได้ทันทีโดยไม่ต้องแก้ไขโค้ดเกม

# **สรุปไฟล์ในโฟลเดอร์ `src/data/`**

| ชื่อไฟล์ | หน้าที่หลัก | การนำไปใช้ในโปรแกรม |
| :---- | :---- | :---- |
| `classes.json` | กฎพื้นฐานประจำคลาส (MOV, Range, ignoreZoC, ไอคอน) | ใช้กำหนดค่าเริ่มต้นของคลาส, ตัวกรองใน Catalog และกฎ ZoC ใน `gridMath.ts` |
| `servants.json` | ชุดตัวอย่าง Servant Pool (คลังฉบับเต็ม 43 ตน แยกไว้ในเอกสาร Grail\_War\_Servants) | ใช้แสดงใน Servant Catalog, วงล้อ Draft และสร้าง `BoardUnit` |
| `monsters.json` | ข้อมูลมอนสเตอร์ PvE 3 ระดับ (Tier 1–3) | ใช้ในเมนู `Spawn Monster` ของ Ruler และแสดงรางวัลการกำจัด |
| `items.json` | รายการไอเทม Mystic Codes สำหรับร้านค้า QP และการดรอป | ใช้แสดงในแท็บ QP Shop และเมนูกดแจกไอเทม `+ Give Item` ของ Ruler |
| `events.json` | รายการ Map Events (12 แบบ) และ Personal Events (12 แบบ) | ใช้เป็นข้อมูลวงล้อสุ่มใน `WheelModal.tsx` พร้อมน้ำหนักการสุ่ม (`weight`) |
| `terrains.json` | ข้อมูล 6 ภูมิประเทศพื้นฐาน (moveCost, combatNote, stealth, highGround ฯลฯ) | ใช้คำนวณการเคลื่อนที่, โบนัสคำนวณการต่อสู้ และเรนเดอร์สี/ไอคอนภูมิประเทศบนกระดาน |
| `maps.json` | ผังกระดาน 3 โซน (`base_a`, `central`, `base_b`) ขนาด 10x7 แนวนอน 2-Layer ไม่สมมาตร | ใช้เรนเดอร์ช่องพิเศษและภูมิประเทศบน `GameBoard.tsx` และคำนวณการข้ามโซนใน `gridMath.ts` |

# **1\. `src/data/classes.json` (ข้อมูลคลาสและกฎประจำคลาส)**

รองรับ 7 คลาสหลักตามกติกาใน 01\_GAME\_RULES.md พร้อมเผื่อคลาสพิเศษ (Extra) กรณีเลือกตัวละคร FGO นอก 7 คลาสหลักเข้ามาใส่ใน Pool 32+ ตน:n  
\[  
{  
"id": "Saber",  
"label": "Saber",  
"baseMov": 2,  
"baseRange": 1,  
"ignoreZoC": false,  
"icon": "/assets/classes/saber.svg",  
"color": "\#2563EB",  
"traitNote": "สมดุลสูง ทั้งพลังชีวิตและพลังโจมตีระยะประชิด"  
},  
{  
"id": "Archer",  
"label": "Archer",  
"baseMov": 2,  
"baseRange": 2,  
"ignoreZoC": false,  
"icon": "/assets/classes/archer.svg",  
"color": "\#DC2626",  
"traitNote": "โจมตีระยะไกล 2 ช่อง เหมาะสำหรับคุมพื้นที่และดักยิง"  
},  
{  
"id": "Lancer",  
"label": "Lancer",  
"baseMov": 3,  
"baseRange": 1,  
"ignoreZoC": false,  
"icon": "/assets/classes/lancer.svg",  
"color": "\#0284C7",  
"traitNote": "ความคล่องตัวสูง (MOV 3\) เดินไล่ล่าและคุมโซนกลางได้ไว"  
},  
{  
"id": "Rider",  
"label": "Rider",  
"baseMov": 3,  
"baseRange": 1,  
"ignoreZoC": false,  
"icon": "/assets/classes/rider.svg",  
"color": "\#EA580C",  
"traitNote": "เคลื่อนที่ไว (MOV 3\) เหมาะกับการฟาร์ม QP และข้าม Gate"  
},  
{  
"id": "Caster",  
"label": "Caster",  
"baseMov": 2,  
"baseRange": 2,  
"ignoreZoC": false,  
"icon": "/assets/classes/caster.svg",  
"color": "\#7C3AED",  
"traitNote": "ระยะโจมตี 2 ช่อง เน้นสกิลสนับสนุน ฟื้นฟู และคุมมานา"  
},  
{  
"id": "Assassin",  
"label": "Assassin",  
"baseMov": 3,  
"baseRange": 1,  
"ignoreZoC": true,  
"icon": "/assets/classes/assassin.svg",  
"color": "\#475569",  
"traitNote": "Presence Concealment: ไม่ติดโทษลดระยะเดิน (-1 MOV) จาก Zone of Control เมื่อถอยหนี"  
},  
{  
"id": "Berserker",  
"label": "Berserker",  
"baseMov": 2,  
"baseRange": 1,  
"ignoreZoC": false,  
"icon": "/assets/classes/berserker.svg",  
"color": "\#991B1B",  
"traitNote": "พลังโจมตีพื้นฐานสูงสุด แต่เน้นแลกเลือดและต้องการการดูแลจาก Master"  
},  
{  
"id": "Extra",  
"label": "Extra",  
"baseMov": 2,  
"baseRange": 1,  
"ignoreZoC": false,  
"icon": "/assets/classes/extra.svg",  
"color": "\#D97706",  
"traitNote": "คลาสพิเศษ (Ruler, Avenger, Alter Ego, Foreigner, Pretender) กำหนดสเตตัสเฉพาะตัวบนการ์ด"  
}  
\]

# **2\. `src/data/servants.json` (คลัง Servant 43 ตน)**

## **เกณฑ์สเกลสมดุลสำหรับตอนเติมตัวละคร FGO ให้ครบ 43 ตน**

เพื่อให้เกมบาลานซ์กับสูตรดาเมจ `ATK + 1d6 (+0/+1/+2)` ใน `01_GAME_RULES.md`:  
**HP:** 10–16 หน่วย (ตัวบาง/สายตีไกล/Assassin: 10–12 \| สายสมดุล: 12–14 \| สายแทงก์/Berserker/ตัวใหญ่: 14–16)  
**ATK:** 2–4 หน่วย (สายซัพพอร์ต: 2 \| ทั่วไป: 3 \| สายตีแรง/Berserker: 4\)  
**Skill Mana Cost:** 1–3 Mana \| **NP Mana Cost:** 4–6 Mana (สร้างดาเมจประมาณ 5–8 หน่วย หรือให้เอฟเฟกต์พลิกเกม)  
**การตั้งชื่อไฟล์รูป:** ตั้ง `id` เป็นภาษาอังกฤษตัวเล็กไร้ช่องว่าง (ใช้ `_`) ให้ตรงกับไฟล์ใน `public/assets/servants/{id}.webp` (หรือวาง URL รูปโดยตรงก็ได้)

## **ชุดข้อมูลตัวอย่างตั้งต้น (10 ตน ครบทุกคลาส — พร้อมใช้รัน Phase 1 ทันที)**

```json
[
  {
    "id": "artoria",
    "name": "Artoria Pendragon",
    "servantClass": "Saber",
    "hp": 14,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Mana Burst",
    "skillCost": 2,
    "skillDesc": "ในเทิร์นนี้การโจมตีปกติหรือ NP ของ Artoria สร้างความเสียหายเพิ่มขึ้น +2 หน่วย",
    "npName": "Excalibur",
    "npCost": 5,
    "npDesc": "ยิงคลื่นแสงเป็นเส้นตรงระยะ 3 ช่อง สร้างความเสียหาย 7 หน่วยให้ศัตรูทุกตัวในแนวเส้น (ทะลุ Guard ได้บางส่วนตามดุลยพินิจ Ruler)",
    "image": "/assets/servants/artoria.webp"
  },
  {
    "id": "gilgamesh",
    "name": "Gilgamesh",
    "servantClass": "Archer",
    "hp": 12,
    "atk": 4,
    "mov": 2,
    "range": 2,
    "skillName": "Golden Rule",
    "skillCost": 1,
    "skillDesc": "เมื่อจบเทิร์นนี้ ได้รับ +2 QP และ +1 Mana เพิ่มเติมทันที",
    "npName": "Enuma Elish",
    "npCost": 6,
    "npDesc": "โจมตีพื้นที่ 3x3 รอบเป้าหมายในระยะ 2 ช่อง สร้างความเสียหาย 7 หน่วย และทำลายบัฟ Evade/Guard ของเป้าหมายทั้งหมด",
    "image": "/assets/servants/gilgamesh.webp"
  },
  {
    "id": "emiya",
    "name": "EMIYA",
    "servantClass": "Archer",
    "hp": 12,
    "atk": 3,
    "mov": 2,
    "range": 2,
    "skillName": "Eye of the Mind (True)",
    "skillCost": 2,
    "skillDesc": "ได้รับป้าย [Evade 1x] หลบการโจมตีปกติ 1 ครั้งในเทิร์นนี้",
    "npName": "Unlimited Blade Works",
    "npCost": 5,
    "npDesc": "สร้างความเสียหาย 5 หน่วยให้ศัตรูทุกตัวในระยะ 2 ช่อง และได้รับ +1 ATK ต่อเนื่อง 2 เทิร์น",
    "image": "/assets/servants/emiya.webp"
  },
  {
    "id": "cu_chulainn",
    "name": "Cu Chulainn",
    "servantClass": "Lancer",
    "hp": 13,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Battle Continuation",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Guts]: หาก HP ลดเหลือ 0 ใน 2 เทิร์นนี้ จะฟื้นกลับมาที่ 3 HP ทันที (1 ครั้ง)",
    "npName": "Gae Bolg",
    "npCost": 4,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1–2 ช่อง สร้างความเสียหาย 6 หน่วย ไม่สามารถหลบหลีกด้วย Evade ได้",
    "image": "/assets/servants/cu_chulainn.webp"
  },
  {
    "id": "melusine",
    "name": "Melusine",
    "servantClass": "Lancer",
    "hp": 13,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "Ray Horizon",
    "skillCost": 2,
    "skillDesc": "ในเทิร์นนี้เพิ่มระยะเดิน +2 MOV (ข้ามสิ่งกีดขวางได้) และได้รับป้าย [Invincible 1x]",
    "npName": "Hollow Heart Albion",
    "npCost": 5,
    "npDesc": "โจมตีศัตรูทุกตัวในระยะ 2 ช่องรอบตัว สร้างความเสียหาย 6 หน่วย และได้รับ +2 Mana คืนเมื่อจบเทิร์น",
    "image": "/assets/servants/melusine.webp"
  },
  {
    "id": "medusa",
    "name": "Medusa",
    "servantClass": "Rider",
    "hp": 12,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Mystic Eyes of Petrification",
    "skillCost": 2,
    "skillDesc": "เลือกศัตรู 1 ตัวในระยะ 2 ช่อง ติดป้าย [Stun] ห้ามเคลื่อนที่ในเทิร์นถัดไป",
    "npName": "Bellerophon",
    "npCost": 4,
    "npDesc": "พุ่งชนเป็นเส้นตรงระยะ 3 ช่อง (ย้ายตำแหน่งตัวเองไปจุดปลายทาง) สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวที่ผ่าน",
    "image": "/assets/servants/medusa.webp"
  },
  {
    "id": "medea",
    "name": "Medea",
    "servantClass": "Caster",
    "hp": 11,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Rapid Words of Divine",
    "skillCost": 0,
    "skillDesc": "ใช้ Action ในเทิร์นนี้เพื่อชาร์จ +3 Mana ให้ทีมทันที (คูลดาวน์ 2 เทิร์น)",
    "npName": "Rule Breaker",
    "npCost": 4,
    "npDesc": "โจมตีระยะประชิด 1 ช่อง สร้างความเสียหาย 4 หน่วย ลบ Custom Buff Tags ทั้งหมดของเป้าหมาย และขโมย 2 Mana จากทีมศัตรู",
    "image": "/assets/servants/medea.webp"
  },
  {
    "id": "castoria",
    "name": "Artoria Caster",
    "servantClass": "Caster",
    "hp": 12,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Charisma of Hope",
    "skillCost": 2,
    "skillDesc": "พันธมิตรทุกตัวในโซนเดียวกันได้ +1 ATK ในเทิร์นนี้ และทีมได้รับ +1 Mana",
    "npName": "Around Caliburn",
    "npCost": 5,
    "npDesc": "มอบป้าย [Anti-Purge Def] (กันดาเมจ 1 ครั้ง ทะลุไม่ได้) และฟื้นฟู +3 HP ให้พันธมิตรทุกตัวในระยะ 2 ช่อง",
    "image": "/assets/servants/castoria.webp"
  },
  {
    "id": "hassan_cursed_arm",
    "name": "Hassan of the Cursed Arm",
    "servantClass": "Assassin",
    "hp": 11,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Protection from Wind",
    "skillCost": 2,
    "skillDesc": "ได้รับป้าย [Evade 2x] และซ่อนตัวจาก Fog of War ของศัตรู 1 เทิร์น",
    "npName": "Zabaniya",
    "npCost": 4,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 6 หน่วย หากเป้าหมาย HP เหลือ 5 หรือน้อยกว่ามีโอกาสสังหารทันทีเมื่อทอย 1d6 ได้ 5–6",
    "image": "/assets/servants/hassan_cursed_arm.webp"
  },
  {
    "id": "heracles",
    "name": "Heracles",
    "servantClass": "Berserker",
    "hp": 16,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "God Hand (Twelve Labors)",
    "skillCost": 3,
    "skillDesc": "ติดป้าย [Guts 2x]: เมื่อ HP เหลือ 0 จะฟื้นคืนชีพที่ 4 HP (สูงสุด 2 ครั้งตลอดเกม)",
    "npName": "Nine Lives",
    "npCost": 5,
    "npDesc": "ฟาดฟันเป้าหมายระยะ 1 ช่องอย่างต่อเนื่อง สร้างความเสียหาย 8 หน่วยและลดพลังป้องกันเป้าหมาย",
    "image": "/assets/servants/heracles.webp"
  }
]
```

## **เทมเพลตว่างสำหรับก๊อปปี้เติมตัวละครเพิ่ม (ให้ครบ 43 ตน)**

```
  {
    "id": "servant_id_here",
    "name": "Servant Display Name",
    "servantClass": "Saber | Archer | Lancer | Rider | Caster | Assassin | Berserker | Extra",
    "hp": 12,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "ชื่อสกิล",
    "skillCost": 2,
    "skillDesc": "คำอธิบายผลของสกิลสำหรับให้ผู้เล่นและ Ruler อ่าน",
    "npName": "ชื่อ Noble Phantasm",
    "npCost": 5,
    "npDesc": "คำอธิบายผลและระยะของท่าไม้ตาย",
    "image": "/assets/servants/servant_id_here.webp"
  }
```

# **3\. `src/data/monsters.json` (มอนสเตอร์ PvE 3 ระดับ)**

มอนสเตอร์จะยืนประจำช่องและโจมตีสวนกลับเมื่อโดนโจมตีแต่ยังไม่ตาย (ตาม `01_GAME_RULES.md` หมวด 8):

```
[
  {
    "id": "skeleton",
    "name": "Dragon Tooth Warrior (Skeleton)",
    "tier": 1,
    "hp": 4,
    "atk": 1,
    "mov": 0,
    "range": 1,
    "rewardMana": 2,
    "rewardQp": 0,
    "dropItemRarity": null,
    "rewardNote": "เลือกได้ระหว่าง +2 Mana หรือ +2 QP",
    "image": "/assets/monsters/skeleton.webp"
  },
  {
    "id": "homunculus",
    "name": "Stray Homunculus",
    "tier": 1,
    "hp": 4,
    "atk": 1,
    "mov": 0,
    "range": 1,
    "rewardMana": 0,
    "rewardQp": 2,
    "dropItemRarity": null,
    "rewardNote": "เลือกได้ระหว่าง +2 QP หรือ +2 Mana",
    "image": "/assets/monsters/homunculus.webp"
  },
  {
    "id": "wyvern",
    "name": "Fuyuki Wyvern",
    "tier": 2,
    "hp": 8,
    "atk": 3,
    "mov": 0,
    "range": 1,
    "rewardMana": 0,
    "rewardQp": 5,
    "dropItemRarity": "common",
    "rewardNote": "+5 QP และสุ่มการ์ดไอเทมระดับ Common 1 ใบ",
    "image": "/assets/monsters/wyvern.webp"
  },
  {
    "id": "chimera",
    "name": "Crimson Chimera",
    "tier": 2,
    "hp": 9,
    "atk": 3,
    "mov": 0,
    "range": 1,
    "rewardMana": 2,
    "rewardQp": 4,
    "dropItemRarity": "common",
    "rewardNote": "+2 Mana, +4 QP และสุ่มการ์ดไอเทมระดับ Common 1 ใบ",
    "image": "/assets/monsters/chimera.webp"
  },
  {
    "id": "fafnir",
    "name": "Evil Dragon Fafnir",
    "tier": 3,
    "hp": 14,
    "atk": 4,
    "mov": 0,
    "range": 2,
    "rewardMana": 8,
    "rewardQp": 4,
    "dropItemRarity": "rare",
    "rewardNote": "+8 Mana, +4 QP, ไอเทมระดับ Rare 1 ชิ้น และผู้สังหารได้บัฟ +1 ATK ถาวร",
    "image": "/assets/monsters/fafnir.webp"
  }
]
```

*(หมายเหตุ: สำหรับบอส **Stray Servant** ที่เกิดจาก Map Event ให้ Ruler กดปุ่ม `Spawn as Stray Boss` จากหน้าต่าง Wheel Modal ระบบจะสร้างยูนิตจาก `servants.json` ที่สุ่มได้ โดยปรับเป็น `owner: "neutral"`, ตั้ง HP อ้างอิง 12–14 และให้รางวัลระดับ Tier 3\)*

# **4\. `src/data/items.json` (ไอเทม Mystic Codes & ร้านค้า QP)**

ผู้เล่นสามารถซื้อไอเทมได้เมื่อยืนอยู่ที่ช่อง `Safe House / Church` หรือได้รับจากการกำจัดมอนสเตอร์และ Personal Events:

```
[
  {
    "id": "dragon_vein_crystal",
    "name": "Dragon Vein Crystal",
    "rarity": "common",
    "qpCost": 3,
    "effectDesc": "เพิ่ม +3 Mana ให้ทีมทันทีเมื่อกดใช้",
    "icon": "/assets/items/dragon_vein_crystal.webp"
  },
  {
    "id": "black_keys",
    "name": "Black Keys (กุญแจดำ)",
    "rarity": "common",
    "qpCost": 3,
    "effectDesc": "โจมตีระยะไกล 3 ช่อง สร้างความเสียหายคงที่ 2 หน่วย (ไม่ต้องทอยเต๋า)",
    "icon": "/assets/items/black_keys.webp"
  },
  {
    "id": "golden_apple",
    "name": "Golden Apple",
    "rarity": "common",
    "qpCost": 4,
    "effectDesc": "ฟื้นฟู +4 HP ให้ Servant 1 ตน และเพิ่มระยะเดิน +1 MOV ในเทิร์นนั้น",
    "icon": "/assets/items/golden_apple.webp"
  },
  {
    "id": "protection_of_arrows",
    "name": "Rune of Evasion",
    "rarity": "common",
    "qpCost": 4,
    "effectDesc": "มอบป้าย [Evade 1x] ป้องกันความเสียหายจากการโจมตี 1 ครั้งให้ Servant 1 ตน",
    "icon": "/assets/items/protection_of_arrows.webp"
  },
  {
    "id": "gandr_shot",
    "name": "Gandr Curse",
    "rarity": "common",
    "qpCost": 3,
    "effectDesc": "ยิงคำสาประยะ 2 ช่อง ทำให้ศัตรูติดป้าย [Stun] ลดระยะเดินเหลือ 0 ในเทิร์นนี้",
    "icon": "/assets/items/gandr_shot.webp"
  },
  {
    "id": "clairvoyance_scroll",
    "name": "Familiar Recon (สอดแนม)",
    "rarity": "common",
    "qpCost": 2,
    "effectDesc": "สั่งให้ Ruler เปิดเผยตำแหน่ง Servant ศัตรู 1 ตน (หรือทั้งโซน Base ศัตรู) ทะลุ Fog of War เป็นเวลา 2 เทิร์น",
    "icon": "/assets/items/clairvoyance_scroll.webp"
  },
  {
    "id": "kaleidoscope_shard",
    "name": "Kaleidoscope Shard",
    "rarity": "rare",
    "qpCost": 6,
    "effectDesc": "เพิ่ม +5 Mana ให้ทีมทันที และปลดสถานะ [NP Ready] ให้ Servant 1 ตน",
    "icon": "/assets/items/kaleidoscope_shard.webp"
  },
  {
    "id": "saint_quartz",
    "name": "Saint Quartz",
    "rarity": "rare",
    "qpCost": 8,
    "effectDesc": "ชุบชีวิต Servant ที่ถูกกำจัดไปแล้ว 1 ตนกลับมาที่ Base Zone ด้วย HP ครึ่งหลอด (ปัดขึ้น) และลดยอด Kills ของศัตรูลง 1 (แต่ไม่ลดจำนวนวิญญาณใน ภาชนะจอกศักดิ์สิทธิ์ ที่ถูกกลืนไปแล้ว หรือให้ขึ้นอยู่กับ Ruler)",
    "icon": "/assets/items/saint_quartz.webp"
  }
]
```

# **5\. `src/data/events.json` (Map Events & Personal Events สำหรับวงล้อสุ่ม)**

แบ่งเป็น 2 อาร์เรย์ชัดเจน (mapEvents สำหรับหมุนทุกต้นเทิร์น และ personalEvents สำหรับช่อง ?) โดยฟิลด์ weight ใช้กำหนดจำนวนช่อง/โอกาสสุ่มบนวงล้อ:

```json
{
  "mapEvents": [
    {
      "id": "mana_surge",
      "title": "Mana Surge (กระแสเวทไหลบ่า)",
      "description": "ทั้งสองฝ่ายได้รับ +2 Mana ทันที",
      "weight": 2
    },
    {
      "id": "haste_wind",
      "title": "Haste Wind (สายลมเร่งความเร็ว)",
      "description": "Servant ทุกตนบนกระดานได้รับระยะเดิน +1 MOV ในเทิร์นนี้",
      "weight": 2
    },
    {
      "id": "supply_drop",
      "title": "Supply Drop (เสบียงจอกศักดิ์สิทธิ์)",
      "description": "Ruler วางจุดเก็บไอเทมระดับ Common/Rare 1 ชิ้นไว้ใจกลางโซน Central ใครเดินถึงก่อนหยิบได้ทันที",
      "weight": 2
    },
    {
      "id": "mana_drought",
      "title": "Mana Drought (ชีพจรเวทแห้งเหือด)",
      "description": "เทิร์นนี้ งดแจก +2 Mana ประจำเทิร์นของทั้งสองฝ่าย",
      "weight": 1
    },
    {
      "id": "dense_fog",
      "title": "Dense Fog (หมอกเวทมนตร์ปกคลุม)",
      "description": "ระยะโจมตีไกล (Ranged และ NP) ลดลงเหลือสูงสุด 1 ช่องในเทิร์นนี้",
      "weight": 1
    },
    {
      "id": "bloodlust",
      "title": "Bloodlust (จิตสังหารปะทุ)",
      "description": "ทุกการโจมตีได้รับ +1 ATK แต่ห้ามใช้คำสั่ง Guard ในเทิร์นนี้",
      "weight": 1
    },
    {
      "id": "black_market",
      "title": "Kirei's Black Market (ตลาดมืดโบสถ์)",
      "description": "เทิร์นนี้ไอเทมทุกชิ้นในร้านค้า QP ลดราคาลง 2 QP (ขั้นต่ำ 1 QP) ซื้อได้ฝั่งละ 1 ชิ้น",
      "weight": 1
    },
    {
      "id": "spatial_distortion",
      "title": "Spatial Distortion (มิติบิดเบี้ยว)",
      "description": "แต่ละฝ่ายสามารถเลือกสลับตำแหน่ง Servant ของตัวเอง 1 คู่บนกระดานได้ฟรี (ข้ามโซนได้)",
      "weight": 1
    },
    {
      "id": "grail_mud",
      "title": "Grail Mud (โคลนแห่งจอก)",
      "description": "Servant ที่ยืนอยู่ช่องขอบสุดของกระดาน (x=0, x=9, y=0 หรือ y=6) โดนดาเมจคงที่ 1 หน่วยตอนจบเทิร์น",
      "weight": 1
    },
    {
      "id": "leyline_overload",
      "title": "Leyline Overload (ชีพจรคลั่ง)",
      "description": "ช่อง Leyline ทุกช่องให้ +4 Mana ในเทิร์นนี้ แต่ผู้ที่ยืนจะได้รับดาเมจ 1 หน่วย",
      "weight": 1
    },
    {
      "id": "command_resonance",
      "title": "Command Resonance (เรย์จูสั่นพ้อง)",
      "description": "ฝ่ายที่มีจำนวน Kills น้อยกว่า (หรือ HP รวมน้อยกว่าหากเท่ากัน) ได้รับ +1 Command Spell (สูงสุดไม่เกิน 3 ขีด)",
      "weight": 1
    },
    {
      "id": "stray_servant",
      "title": "Stray Servant! (วีรชนเร่ร่อนบุก)",
      "description": "Ruler หมุนวงล้อ Draft Pool ที่เหลือ 1 ครั้ง ตัวที่ออกจะเกิดเป็นบอสกลางโซน Central (HP 12, ATK 4) ใครฆ่าได้ +6 Mana และไอเทม Rare 1 ชิ้น",
      "weight": 1
    }
  ],
  "personalEvents": [
    {
      "id": "hidden_spring",
      "title": "บ่อน้ำพุพลังเวท",
      "description": "Servant ตนนี้ฟื้นฟู +3 HP และทีมได้รับ +1 Mana",
      "weight": 2
    },
    {
      "id": "abandoned_chest",
      "title": "คลังสมบัติที่ถูกทิ้งร้าง",
      "description": "ได้รับ +4 QP ทันที",
      "weight": 2
    },
    {
      "id": "found_mystic_code",
      "title": "พบ Mystic Code ตกหล่น",
      "description": "สุ่มรับไอเทมระดับ Common 1 ชิ้นเข้ากระเป๋าทีมฟรี",
      "weight": 2
    },
    {
      "id": "cursed_trap",
      "title": "กับดักอาคมโบราณ",
      "description": "Servant ตนนี้โดนความเสียหายคงที่ 2 หน่วย",
      "weight": 2
    },
    {
      "id": "weapon_resonance",
      "title": "อาวุธสั่นพ้อง",
      "description": "ติดป้าย [ATK+1] ให้ Servant ตนนี้เป็นเวลา 2 เทิร์น",
      "weight": 1
    },
    {
      "id": "phantom_ambush",
      "title": "มอนสเตอร์ซุ่มโจมตี!",
      "description": "Ruler เสกมอนสเตอร์ Tier 1 (Skeleton) 1 ตัวลงช่องข้างเคียง และมอนสเตอร์ตีใส่ทันที 1 ดาเมจ",
      "weight": 1
    },
    {
      "id": "secret_shortcut",
      "title": "ทางลัดมิติ",
      "description": "สามารถเลือกย้าย Servant ตนนี้ไปช่องว่างใดก็ได้ในระยะ 2 ช่อง (หรือวาร์ปกลับ Safe House ของทีม)",
      "weight": 1
    },
    {
      "id": "mana_leak",
      "title": "รอยรั่ววงเวท",
      "description": "ทีมเสีย -2 Mana (ขั้นต่ำเหลือ 0)",
      "weight": 1
    },
    {
      "id": "church_blessing",
      "title": "พรแห่งโบสถ์ฟุยุกิ",
      "description": "ได้รับป้าย [Evade 1x] ป้องกันการโจมตี 1 ครั้ง",
      "weight": 1
    },
    {
      "id": "scout_insight",
      "title": "เบาะแสศัตรู",
      "description": "Ruler เปิดเผยตำแหน่ง Servant ศัตรู 1 ตนที่ถูก Fog of War บังอยู่เป็นเวลา 1 เทิร์น",
      "weight": 1
    },
    {
      "id": "np_charge_burst",
      "title": "ประจุโฮกุฉับพลัน",
      "description": "ทีมได้รับ +3 Mana ทันที",
      "weight": 1
    },
    {
      "id": "golden_fragment",
      "title": "เศษเสี้ยวแห่งจอก",
      "description": "ได้รับไอเทมระดับ Rare 1 ชิ้น หรือเลือกเปลี่ยนเป็น +6 QP ทันที",
      "weight": 1
    }
  ]
}
```

กำหนดคุณสมบัติการเคลื่อนที่ โบนัสการต่อสู้ การซ่อนตัว และสีพื้นหลังของแต่ละภูมิประเทศ:

```json
[
  {
    "id": "open",
    "label": "ที่โล่ง",
    "moveCost": 1,
    "startRoadBonus": 0,
    "combatNote": "ไม่มีบัฟหรือดีบัฟ มองเห็นชัดเจน",
    "stealth": false,
    "highGround": false,
    "bgColor": "#1A2421",
    "icon": "plains"
  },
  {
    "id": "road",
    "label": "ถนน",
    "moveCost": 1,
    "startRoadBonus": 1,
    "combatNote": "เมื่อเริ่มเคลื่อนที่จากช่องถนน ได้รับโบนัส +1 MOV ในเทิร์นนั้น (สูงสุด +1/เทิร์น)",
    "stealth": false,
    "highGround": false,
    "bgColor": "#1E2430",
    "icon": "road"
  },
  {
    "id": "building",
    "label": "ตึก",
    "moveCost": 2,
    "sameTerrainMoveCost": 1,
    "startRoadBonus": 0,
    "combatNote": "ปีนขึ้นจากพื้นราบใช้ 2 MOV (ข้ามตึกติดกันใช้ 1) | High Ground: โจมตีพื้นล่าง +1 ATK และคลาสตีไกล +1 Range",
    "stealth": false,
    "highGround": true,
    "bgColor": "#242B3D",
    "icon": "building"
  },
  {
    "id": "forest",
    "label": "ป่า",
    "moveCost": 2,
    "startRoadBonus": 0,
    "combatNote": "เดินเข้าใช้ 2 MOV | Stealth: ศัตรูที่อยู่นอกป่ามองไม่เห็นจนกว่าจะประชิด 1 ช่องหรือเข้าป่า และลดดาเมจตีไกลจากนอกป่า -1",
    "stealth": true,
    "highGround": false,
    "bgColor": "#132A1E",
    "icon": "trees"
  },
  {
    "id": "ruins",
    "label": "ซากปรักฯ",
    "moveCost": 1,
    "startRoadBonus": 0,
    "combatNote": "Cover: ลดความเสียหายจากการโจมตีปกติที่ได้รับลง 1 หน่วย",
    "stealth": false,
    "highGround": false,
    "bgColor": "#29231E",
    "icon": "landmark"
  },
  {
    "id": "water",
    "label": "แม่น้ำ",
    "moveCost": 2,
    "startRoadBonus": 0,
    "combatNote": "เดินผ่านใช้ 2 MOV | Exposed: ไม่มีที่กำบัง รับความเสียหายเพิ่มขึ้น +1 หากสู้ในน้ำ",
    "stealth": false,
    "highGround": false,
    "bgColor": "#0F2537",
    "icon": "waves"
  }
]
```

# **6\. `src/data/terrains.json` (ข้อมูล 6 ภูมิประเทศพื้นฐาน)**

# **7\. `src/data/maps.json` (ผังแผนที่ 3 โซน ขนาด 10×7 แนวนอน ไม่สมมาตร)**

```
{
  "cols": 10,
  "rows": 7,
  "gates": [
    {
      "id": "gate_a_north",
      "label": "North Gate",
      "from": { "zone": "base_a", "x": 9, "y": 1 },
      "to": { "zone": "central", "x": 0, "y": 1 }
    },
    {
      "id": "gate_a_mid",
      "label": "Mid Gate",
      "from": { "zone": "base_a", "x": 9, "y": 3 },
      "to": { "zone": "central", "x": 0, "y": 3 }
    },
    {
      "id": "gate_a_south",
      "label": "South Gate",
      "from": { "zone": "base_a", "x": 9, "y": 5 },
      "to": { "zone": "central", "x": 0, "y": 5 }
    },
    {
      "id": "gate_b_north",
      "label": "North Gate",
      "from": { "zone": "central", "x": 9, "y": 1 },
      "to": { "zone": "base_b", "x": 0, "y": 1 }
    },
    {
      "id": "gate_b_mid",
      "label": "Mid Gate",
      "from": { "zone": "central", "x": 9, "y": 3 },
      "to": { "zone": "base_b", "x": 0, "y": 3 }
    },
    {
      "id": "gate_b_south",
      "label": "South Gate",
      "from": { "zone": "central", "x": 9, "y": 5 },
      "to": { "zone": "base_b", "x": 0, "y": 5 }
    }
  ],
  "zones": {
    "base_a": {
      "id": "base_a",
      "name": "Mount Enzo & Ryudou Temple (Base A)",
      "owner": "team_a",
      "terrainGrid": [
        ["forest", "forest", "forest", "ruins", "ruins", "forest", "forest", "open", "open", "open"],
        ["open", "road", "road", "road", "road", "road", "road", "road", "road", "open"],
        ["forest", "forest", "open", "ruins", "ruins", "open", "forest", "forest", "open", "open"],
        ["open", "road", "road", "road", "road", "road", "road", "road", "road", "open"],
        ["ruins", "ruins", "open", "forest", "forest", "open", "ruins", "ruins", "open", "open"],
        ["open", "road", "road", "road", "road", "road", "road", "road", "road", "open"],
        ["forest", "forest", "forest", "ruins", "ruins", "forest", "forest", "open", "open", "open"]
      ],
      "specialTiles": [
        { "x": 0, "y": 1, "type": "spawn_a", "label": "Spawn A1" },
        { "x": 0, "y": 3, "type": "spawn_a", "label": "Spawn A2" },
        { "x": 0, "y": 5, "type": "spawn_a", "label": "Spawn A3" },
        { "x": 1, "y": 3, "type": "safe_house", "label": "Red Safe House (+2 HP / Shop)" },
        { "x": 3, "y": 0, "type": "leyline", "manaBonus": 2, "label": "Leyline (+2 Mana)" },
        { "x": 3, "y": 6, "type": "leyline", "manaBonus": 2, "label": "Leyline (+2 Mana)" },
        { "x": 4, "y": 1, "type": "qp_cache", "label": "QP Cache (1d6)" },
        { "x": 4, "y": 5, "type": "qp_cache", "label": "QP Cache (1d6)" },
        { "x": 2, "y": 2, "type": "personal_event", "label": "Personal Event (?)" },
        { "x": 2, "y": 4, "type": "personal_event", "label": "Personal Event (?)" },
        { "x": 6, "y": 2, "type": "monster_nest", "monsterId": "skeleton", "tier": 1, "label": "Nest (Tier 1)" },
        { "x": 6, "y": 4, "type": "monster_nest", "monsterId": "homunculus", "tier": 1, "label": "Nest (Tier 1)" },
        { "x": 5, "y": 0, "type": "watchtower", "label": "Watchtower (Scout)" },
        { "x": 5, "y": 6, "type": "blood_altar", "label": "Blood Altar (Sacrifice)" },

        { "x": 7, "y": 3, "type": "workshop", "label": "Magus Workshop (3 QP -> ATK+1 / DEF+1)" },
        { "x": 8, "y": 1, "type": "teleporter", "targetZone": "central", "targetX": 1, "targetY": 1, "label": "Leyline Portal" },
        { "x": 9, "y": 1, "type": "gate", "targetZone": "central", "label": "Gate -> Central" },
        { "x": 9, "y": 3, "type": "gate", "targetZone": "central", "label": "Gate -> Central" },
        { "x": 9, "y": 5, "type": "gate", "targetZone": "central", "label": "Gate -> Central" }
      ]
    },
    "central": {
      "id": "central",
      "name": "Fuyuki City Center & Great Bridge",
      "owner": "neutral",
      "terrainGrid": [
        ["open", "open", "building", "building", "water", "water", "building", "building", "open", "open"],
        ["road", "road", "road", "road", "road", "road", "road", "road", "road", "road"],
        ["forest", "open", "ruins", "open", "water", "water", "open", "ruins", "open", "forest"],
        ["road", "road", "road", "road", "road", "road", "road", "road", "road", "road"],
        ["forest", "open", "ruins", "open", "water", "water", "open", "ruins", "open", "forest"],
        ["road", "road", "road", "road", "road", "road", "road", "road", "road", "road"],
        ["open", "open", "building", "building", "water", "water", "building", "building", "open", "open"]
      ],
      "specialTiles": [
        { "x": 0, "y": 1, "type": "gate", "targetZone": "base_a", "label": "Gate -> Base A" },
        { "x": 0, "y": 3, "type": "gate", "targetZone": "base_a", "label": "Gate -> Base A" },
        { "x": 0, "y": 5, "type": "gate", "targetZone": "base_a", "label": "Gate -> Base A" },
        { "x": 9, "y": 1, "type": "gate", "targetZone": "base_b", "label": "Gate -> Base B" },
        { "x": 9, "y": 3, "type": "gate", "targetZone": "base_b", "label": "Gate -> Base B" },
        { "x": 9, "y": 5, "type": "gate", "targetZone": "base_b", "label": "Gate -> Base B" },
        { "x": 1, "y": 3, "type": "summoning_altar", "label": "Summoning Altar (West)" },
        { "x": 8, "y": 3, "type": "summoning_altar", "label": "Summoning Altar (East)" },
        { "x": 3, "y": 0, "type": "leyline", "manaBonus": 3, "label": "Major Leyline (+3 Mana)" },
        { "x": 6, "y": 6, "type": "leyline", "manaBonus": 3, "label": "Major Leyline (+3 Mana)" },
        { "x": 4, "y": 1, "type": "safe_house", "label": "Fuyuki Church (+2 HP / Shop)" },
        { "x": 5, "y": 1, "type": "personal_event", "label": "Personal Event (?)" },
        { "x": 2, "y": 2, "type": "monster_nest", "monsterId": "wyvern", "tier": 2, "label": "Nest (Tier 2)" },
        { "x": 7, "y": 4, "type": "monster_nest", "monsterId": "chimera", "tier": 2, "label": "Nest (Tier 2)" },
        { "x": 2, "y": 5, "type": "qp_cache", "label": "QP Cache (1d6)" },
        { "x": 7, "y": 1, "type": "qp_cache", "label": "QP Cache (1d6)" },
        { "x": 3, "y": 5, "type": "personal_event", "label": "Personal Event (?)" },
        { "x": 4, "y": 0, "type": "monster_nest", "monsterId": "fafnir", "tier": 3, "label": "Boss Nest (Tier 3)" },
        { "x": 4, "y": 3, "type": "grail_site", "label": "Greater Grail Sanctuary (West)" },
        { "x": 5, "y": 3, "type": "grail_site", "label": "Greater Grail Sanctuary (East)" },
        { "x": 1, "y": 1, "type": "teleporter", "targetZone": "central", "targetX": 8, "targetY": 5, "label": "North Portal" },
        { "x": 8, "y": 5, "type": "teleporter", "targetZone": "central", "targetX": 1, "targetY": 1, "label": "South Portal" },
        { "x": 6, "y": 0, "type": "watchtower", "label": "Bridge Watchtower" },

        { "x": 3, "y": 6, "type": "workshop", "label": "Central Workshop (3 QP -> ATK+1 / DEF+1)" },
        { "x": 5, "y": 6, "type": "blood_altar", "label": "Central Blood Altar" }
      ]
    },
    "base_b": {
      "id": "base_b",
      "name": "Shinto City & Port (Base B)",
      "owner": "team_b",
      "terrainGrid": [
        ["open", "open", "open", "building", "building", "water", "water", "building", "building", "building"],
        ["open", "road", "road", "road", "road", "road", "road", "road", "road", "open"],
        ["open", "open", "building", "building", "open", "water", "water", "building", "building", "building"],
        ["open", "road", "road", "road", "road", "road", "road", "road", "road", "open"],
        ["open", "open", "building", "building", "open", "water", "water", "building", "building", "building"],
        ["open", "road", "road", "road", "road", "road", "road", "road", "road", "open"],
        ["open", "open", "open", "building", "building", "water", "water", "building", "building", "building"]
      ],
      "specialTiles": [
        { "x": 9, "y": 1, "type": "spawn_b", "label": "Spawn B1" },
        { "x": 9, "y": 3, "type": "spawn_b", "label": "Spawn B2" },
        { "x": 9, "y": 5, "type": "spawn_b", "label": "Spawn B3" },
        { "x": 8, "y": 3, "type": "safe_house", "label": "Blue Safe House (+2 HP / Shop)" },
        { "x": 6, "y": 0, "type": "leyline", "manaBonus": 2, "label": "Leyline (+2 Mana)" },
        { "x": 6, "y": 6, "type": "leyline", "manaBonus": 2, "label": "Leyline (+2 Mana)" },
        { "x": 5, "y": 1, "type": "qp_cache", "label": "QP Cache (1d6)" },
        { "x": 5, "y": 5, "type": "qp_cache", "label": "QP Cache (1d6)" },
        { "x": 7, "y": 2, "type": "personal_event", "label": "Personal Event (?)" },
        { "x": 7, "y": 4, "type": "personal_event", "label": "Personal Event (?)" },
        { "x": 3, "y": 2, "type": "monster_nest", "monsterId": "skeleton", "tier": 1, "label": "Nest (Tier 1)" },
        { "x": 3, "y": 4, "type": "monster_nest", "monsterId": "homunculus", "tier": 1, "label": "Nest (Tier 1)" },
        { "x": 4, "y": 0, "type": "watchtower", "label": "Port Watchtower" },
        { "x": 4, "y": 6, "type": "blood_altar", "label": "Shinto Blood Altar" },

        { "x": 2, "y": 3, "type": "workshop", "label": "Shinto Workshop (3 QP -> ATK+1 / DEF+1)" },
        { "x": 1, "y": 5, "type": "teleporter", "targetZone": "central", "targetX": 8, "targetY": 5, "label": "Shinto Portal" },
        { "x": 0, "y": 1, "type": "gate", "targetZone": "central", "label": "Gate -> Central" },
        { "x": 0, "y": 3, "type": "gate", "targetZone": "central", "label": "Gate -> Central" },
        { "x": 0, "y": 5, "type": "gate", "targetZone": "central", "label": "Gate -> Central" }
      ]
    }
  }
}
```

# **วิธีนำเอกสารชุดนี้ไปใช้กับ AntiGravity**

1. ดาวน์โหลดเอกสารทั้ง 4 ฉบับ (`01_GAME_RULES.md`, `02_ARCHITECTURE.md`, `03_UI_SPEC.md`, `04_BUILD_ROADMAP.md`) เป็นไฟล์ `.md` แล้ววางไว้ในโฟลเดอร์ `docs/` ของโปรเจกต์  
2. ก๊อปปี้ JSON ทั้ง 7 บล็อกด้านบนไปสร้างไฟล์ใน `src/data/` (หรือวางเอกสารนี้ไว้เป็น `docs/05_DATA_SCHEMAS.md` แล้วสั่ง AntiGravity แตกออกเป็น 7 ไฟล์ใน `src/data/` อัตโนมัติใน Phase 1\)  
3. เมื่อระบบ Phase 1–3 ทำงานเรียบร้อยแล้ว ค่อยเพิ่มรายชื่อตัวละคร FGO ที่คุณเลือกเองลงใน `src/data/servants.json` ให้ครบ 43 ตน และนำรูปไอคอนมาวางใน `public/assets/servants/`

