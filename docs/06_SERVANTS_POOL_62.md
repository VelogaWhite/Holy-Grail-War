# **คลังข้อมูล Servant Pool (62 ตน) — Fate: Holy Grail War (Custom VTT)**

เอกสารรวบรวมรายชื่อ สเตตัส สกิล และ Noble Phantasm ของ Servant ทั้งหมด **62 ตน** แยกหัวข้อตามประเภทคลาส โดยกำหนดค่า id และพาธ image (/assets/servants/{id}.webp) ให้ตรงตามกฎการตั้งชื่อไฟล์ตัวพิมพ์เล็กไร้สัญลักษณ์พิเศษใน 02\_ARCHITECTURE.md และคุมสเกลให้สมดุลกับสูตรดาเมจ ATK \+ 1d6 (+0/+1/+2) ใน `01_GAME_RULES.md`

# **ภาพรวมสัดส่วนคลาส (Total: 62 Servants)**

| ลำดับ | คลาส (Class) | จำนวน (ตน) | จุดเด่นหลักและค่าพื้นฐาน |
| :---- | :---- | :---- | :---- |
|  8 **Extra** 8 รวมสายพิเศษ: Ruler (2), Avenger (2), Alter Ego (3), Moon Cancer (1)  | **Saber** | 5 | สมดุลสูง HP 13–16, ATK 3–4, MOV 2, Range 1 |
|  2 **Archer** 8 โจมตีไกล Range 2, คุมพื้นที่และดักยิง  | **Archer** | 5 | โจมตีไกล Range 2, คุมพื้นที่และดักยิง |
|  3 **Lancer** 8 เคลื่อนที่ไว MOV 3 (ยกเว้น Leonidas สายแทงก์ MOV 2\)  | **Lancer** | 4 | เคลื่อนที่ไว MOV 3 (ยกเว้น Leonidas สายแทงก์ MOV 2\) |
|  4 **Rider** 7 ความเร็วสูง MOV 3 เดินฟาร์ม QP / ข้าม Gate / พุ่งทะลวง  | **Rider** | 6 | ความเร็วสูง MOV 3 เดินฟาร์ม QP / ข้าม Gate / พุ่งทะลวง |
|  5 **Caster** 7 สนับสนุนทีม ฟื้นฟู ชาร์จ Mana และคุมจังหวะเกม  | **Caster** | 4 | สนับสนุนทีม ฟื้นฟู ชาร์จ Mana และคุมจังหวะเกม |
|  6 **Assassin** 7 `ignoreZoC: true` ไม่ติดโทษลดระยะเดินเมื่อถอยหนี  | **Assassin** | 5 | `ignoreZoC: true` ไม่ติดโทษลดระยะเดินเมื่อถอยหนี |
|  7 **Berserker** 9 ดาเมจพื้นฐานสูง ATK 3–4 เน้นปะทะหนักและแลกเลือด  | **Berserker** | 7 | ดาเมจพื้นฐานสูง ATK 3–4 เน้นปะทะหนักและแลกเลือด |
|  1 **Saber** 8 สมดุลสูง HP 12–16, ATK 3–4, MOV 2–3, Range 1  | **Extra** | 7 | รวมสายพิเศษ: Ruler (2), Avenger (2), Alter Ego (2), Moon Cancer (1) |

*(หมายเหตุสำหรับ `servants.json`: คลาส Extra ใช้ `"servantClass": "Extra"` เพื่อให้ตรงกับ `classes.json` และเพิ่มฟิลด์ `"subClass"` ระบุคลาสย่อยเอาไว้สำหรับแสดงบนการ์ดหรือกรองเพิ่มเติมในอนาคต)*

# **1\. Saber (8 ตน)**

| ชื่อตัวละคร | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Artoria Pendragon | `artoria` | 14 | 3 | 2 | 1 | Mana Burst (2) | Excalibur (5) |
| Artoria Pendragon (Alter) | `artoria_alter` | 13 | 4 | 2 | 1 | Mana Burst (Dark) (2) | Excalibur Morgan (5) |
| Barghest | `barghest` | 16 | 3 | 2 | 1 | Foul Weather (2) | Black Dog Galatine (5) |
| Nero Claudius | `nero_claudius` | 13 | 3 | 2 | 1 | Thrice-Setting Sun (3) | Laus Saint Claudius (5) |
| Siegfried Ibuki Doji `ibuki_doji` 16 4 2 1 Eight-Headed Blessing (2) Yamata-no-Orochi (6) Miyamoto Musashi `miyamoto_musashi` 13 4 2 1 Fifth Form (2) Rikudou Gorin (5) Okita Soji `okita_soji` 12 4 3 1 Shukuchi (2) Mumyou Sandanzuki (4)  | `siegfried` | 15 | 3 | 2 | 1 | Armor of Fafnir (2) | Balmung (5) |

```
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
    "npDesc": "ยิงคลื่นแสงเป็นเส้นตรงระยะ 3 ช่อง สร้างความเสียหาย 7 หน่วยให้ศัตรูทุกตัวในแนวเส้น",
    "image": "/assets/servants/artoria.webp"
  },
  {
    "id": "artoria_alter",
    "name": "Artoria Pendragon (Alter)",
    "servantClass": "Saber",
    "hp": 13,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Mana Burst (Dark)",
    "skillCost": 2,
    "skillDesc": "เพิ่ม +2 ATK ในเทิร์นนี้ แต่เสีย 1 HP จากพลังเวทคลั่ง",
    "npName": "Excalibur Morgan",
    "npCost": 5,
    "npDesc": "ยิงคลื่นแสงมืดเป็นเส้นตรงระยะ 3 ช่อง สร้างความเสียหาย 8 หน่วยให้ศัตรูทุกตัวในแนวเส้น และคืน +1 Mana ให้ทีม",
    "image": "/assets/servants/artoria_alter.webp"
  },
  {
    "id": "barghest",
    "name": "Barghest",
    "servantClass": "Saber",
    "hp": 16,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Foul Weather",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +2 HP ให้ตัวเอง และลบ 1 Buff Tag ของศัตรูที่อยู่ประชิดในระยะ 1 ช่อง",
    "npName": "Black Dog Galatine",
    "npCost": 5,
    "npDesc": "โจมตีศัตรูทุกตัวรอบระยะ 1 ช่อง สร้างความเสียหาย 6 หน่วย หากสังหารเป้าหมายได้ ฟื้นฟู +4 HP ทันที",
    "image": "/assets/servants/barghest.webp"
  },
  {
    "id": "nero_claudius",
    "name": "Nero Claudius",
    "servantClass": "Saber",
    "hp": 13,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Thrice-Setting Sun",
    "skillCost": 3,
    "skillDesc": "ติดป้าย [Guts 2x]: เมื่อ HP ลดเหลือ 0 จะฟื้นคืนชีพที่ 2 HP ทันที (สูงสุด 2 ครั้งตลอดเกม)",
    "npName": "Laus Saint Claudius",
    "npCost": 5,
    "npDesc": "กางโรงละครระยะ 2 ช่องรอบตัว สร้างความเสียหาย 5 หน่วยให้ศัตรูทุกตัวในระยะและทะลุการตั้งรับ Guard",
    "image": "/assets/servants/nero_claudius.webp"
  },
  {
    "id": "siegfried",
    "name": "Siegfried",
    "servantClass": "Saber",
    "hp": 15,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Armor of Fafnir",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [DEF+2]: ลดความเสียหายทุกครั้งที่ได้รับในเทิร์นนี้ลง 2 หน่วย",
    "npName": "Balmung",
    "npCost": 5,
    "npDesc": "ยิงคลื่นดาบระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในระยะ (เพิ่มเป็น 9 หน่วยต่อเป้าหมายสายมังกร เช่น Wyvern, Fafnir, Artoria, Melusine)",
    "image": "/assets/servants/siegfried.webp"

  },

  {
    "id": "ibuki_doji",
    "name": "Ibuki Doji",
    "servantClass": "Saber",
    "hp": 16,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Eight-Headed Blessing",
    "skillCost": 2,
    "skillDesc": "คืน +2 Mana ให้ทีม และในเทิร์นนี้การโจมตีปกติหรือ NP ของ Ibuki ทะลุ Invincible และ Evade ทั้งหมด",
    "npName": "Yamata-no-Orochi (Kusanagi)",
    "npCost": 6,
    "npDesc": "ฟาดฟันคลื่นดาบพื้นที่ 3x3 ด้านหน้าระยะ 2 ช่อง สร้างความเสียหาย 7 หน่วยให้ศัตรูทุกตัว และทำลายการตั้งรับ Guard ทั้งหมด",
    "image": "/assets/servants/ibuki_doji.webp"
  },
  {
    "id": "miyamoto_musashi",
    "name": "Miyamoto Musashi",
    "servantClass": "Saber",
    "hp": 13,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Fifth Form",
    "skillCost": 2,
    "skillDesc": "ในเทิร์นนี้การโจมตีปกติของ Musashi สร้างความเสียหายเพิ่มขึ้น +2 หน่วย และหากโจมตีโดนได้รับ +1 Mana คืน",
    "npName": "Rikudou Gorin - Kurikara Tenshou",
    "npCost": 5,
    "npDesc": "ลบ Custom Buff Tags ทั้งหมดของเป้าหมายก่อน แล้วโจมตีเป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 7 หน่วย (ทะลุ Evade/Invincible)",
    "image": "/assets/servants/miyamoto_musashi.webp"
  },
  {
    "id": "okita_soji",
    "name": "Okita Soji",
    "servantClass": "Saber",
    "hp": 12,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "Shukuchi (Reduced Earth)",
    "skillCost": 2,
    "skillDesc": "เพิ่มงบการเดิน +1.0 MP ในเทิร์นนี้ ติดป้าย [Evade 1x] และได้โบนัสทอยเต๋าโจมตีปกติ +1",
    "npName": "Mumyou Sandanzuki",
    "npCost": 4,
    "npDesc": "พุ่งแทง 3 จังหวะพร้อมกันใส่เป้าหมายเดี่ยวระยะ 1–2 ช่อง สร้างความเสียหาย 7 หน่วย ทะลุทั้ง Guard และ DEF+ ทุกชนิด",
    "image": "/assets/servants/okita_soji.webp"
  }
]
```

# **2\. Archer (8 ตน)**

| ชื่อตัวละคร | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Baobhan Sith | `baobhan_sith` | 11 | 3 | 2 | 2 | Vampirism (Curse) (2) | Fetch Failnaught (5) |
| Chiron | `chiron` | 12 | 3 | 2 | 2 | Wisdom of Divine Gift (2) | Antares Snipe (5) |
| EMIYA | `emiya` | 12 | 3 | 2 | 2 | Eye of the Mind (True) (2) | Unlimited Blade Works (5) |
| Euryale | `euryale` | 10 | 2 | 2 | 2 | Siren Song (2) | Eye of the Euryale (4) |
| Gilgamesh Arjuna `arjuna` 12 4 2 2 Hero of the Endowed (2) Pashupata (5) Durga `durga` 12 3 2 2 Divine Weapons of the Gods (2) Mahishasuramardini (5) Super Orion `super_orion` 15 4 2 2 Stout Arm of Brutality (2) Artemis Agnos (5)  | `gilgamesh` | 12 | 4 | 2 | 2 | Golden Rule (1) | Enuma Elish (6) |

```
[
  {
    "id": "baobhan_sith",
    "name": "Baobhan Sith",
    "servantClass": "Archer",
    "hp": 11,
    "atk": 3,
    "mov": 2,
    "range": 2,
    "skillName": "Vampirism (Curse)",
    "skillCost": 2,
    "skillDesc": "ขโมย 2 Mana จากทีมศัตรูเมื่อมีศัตรูในระยะ 2 ช่อง และติดป้าย [Evade 1x]",
    "npName": "Fetch Failnaught",
    "npCost": 5,
    "npDesc": "ยิงเป้าหมายเดี่ยวระยะ 3 ช่อง สร้างความเสียหาย 6 หน่วย และติดป้าย [Curse -1 HP] นาน 2 เทิร์น",
    "image": "/assets/servants/baobhan_sith.webp"
  },
  {
    "id": "chiron",
    "name": "Chiron",
    "servantClass": "Archer",
    "hp": 12,
    "atk": 3,
    "mov": 2,
    "range": 2,
    "skillName": "Wisdom of Divine Gift",
    "skillCost": 2,
    "skillDesc": "มอบป้าย [ATK+1] และโบนัสทอยเต๋า +1 ให้พันธมิตร 1 ตนในระยะ 2 ช่อง นาน 2 เทิร์น",
    "npName": "Antares Snipe",
    "npCost": 5,
    "npDesc": "ยิงเป้าหมายเดี่ยวระยะ 3 ช่อง (ทะลุสิ่งกีดขวาง) สร้างความเสียหาย 6 หน่วย ลบ Buff Tag 1 ป้าย และทะลุ Evade",
    "image": "/assets/servants/chiron.webp"
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
    "skillDesc": "ติดป้าย [Evade 1x] หลบการโจมตีปกติ 1 ครั้งในเทิร์นนี้",
    "npName": "Unlimited Blade Works",
    "npCost": 5,
    "npDesc": "สร้างความเสียหาย 5 หน่วยให้ศัตรูทุกตัวในระยะ 2 ช่อง และได้รับป้าย [ATK+1] ต่อเนื่อง 2 เทิร์น",
    "image": "/assets/servants/emiya.webp"
  },
  {
    "id": "euryale",
    "name": "Euryale",
    "servantClass": "Archer",
    "hp": 10,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Siren Song",
    "skillCost": 2,
    "skillDesc": "สั่งศัตรู 1 ตัวในระยะ 2 ช่องติดป้าย [Stun] ห้ามเคลื่อนที่ในเทิร์นนี้",
    "npName": "Eye of the Euryale",
    "npCost": 4,
    "npDesc": "ยิงเป้าหมายเดี่ยวระยะ 2 ช่อง สร้างความเสียหาย 5 หน่วย (เพิ่มเป็น 8 หน่วยหากเป้าหมายเป็น Servant ชาย) และลดระยะเดิน -1 เทิร์นถัดไป",
    "image": "/assets/servants/euryale.webp"
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
    "id": "arjuna",
    "name": "Arjuna",
    "servantClass": "Archer",
    "hp": 12,
    "atk": 4,
    "mov": 2,
    "range": 2,
    "skillName": "Hero of the Endowed",
    "skillCost": 2,
    "skillDesc": "ทีมได้รับ +2 Mana ทันที, ฟื้นฟู +2 HP ให้ตัวเอง และติดป้าย [Debuff Immune] ในเทิร์นนี้",
    "npName": "Pashupata",
    "npCost": 5,
    "npDesc": "ปล่อยศรเทพแห่งการทำลายล้างลงพื้นที่ 3x3 ในระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัว (หากเป้าหมาย HP ≤ 5 และทอย 1d6 ได้ 5–6 สังหารทันที; เป้าหมายสาย Divine ทอย 4–6)",
    "image": "/assets/servants/arjuna.webp"
  },
  {
    "id": "durga",
    "name": "Durga",
    "servantClass": "Archer",
    "hp": 12,
    "atk": 3,
    "mov": 2,
    "range": 2,
    "skillName": "Divine Weapons of the Gods",
    "skillCost": 2,
    "skillDesc": "ในเทิร์นนี้การโจมตีปกติหรือ NP สร้างความเสียหายเพิ่มขึ้น +2 หน่วย และโจมตีทะลุ Evade",
    "npName": "Mahishasuramardini",
    "npCost": 5,
    "npDesc": "ระดมศาสตราวุธเทวะโจมตีพื้นที่ 3x3 ในระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัว (เพิ่มเป็น 8 หน่วยต่อเป้าหมายสาย Demonic หรือมอนสเตอร์ PvE)",
    "image": "/assets/servants/durga.webp"
  },
  {
    "id": "super_orion",
    "name": "Super Orion",
    "servantClass": "Archer",
    "hp": 15,
    "atk": 4,
    "mov": 2,
    "range": 2,
    "skillName": "Stout Arm of Brutality",
    "skillCost": 2,
    "skillDesc": "ในเทิร์นนี้การโจมตีปกติของ Super Orion ติด Critical อัตโนมัติ (โบนัส +2 โดยไม่ต้องทอยเต๋า) และทะลุ Evade/Invincible",
    "npName": "Artemis Agnos",
    "npCost": 5,
    "npDesc": "ติดบัฟ [Grand Archer 2T] นาน 2 เทิร์น: ได้รับ +2 ATK, ติดป้าย [Guts] (ฟื้น 3 HP 1 ครั้ง) และลบดีบัฟทั้งหมดของตัวเอง",
    "image": "/assets/servants/super_orion.webp"
  }
]
```

# **3\. Lancer (8 ตน)**

| ชื่อตัวละคร | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Cu Chulainn | `cu_chulainn` | 13 | 3 | 3 | 1 | Battle Continuation (2) | Gae Bolg (4) |
| Leonidas I | `leonidas_i` | 15 | 2 | 2 | 1 | Pride of the Rearguard (2) | Thermopylae Enomotia (4) |
| Melusine | `melusine` | 13 | 4 | 3 | 1 | Ray Horizon (2) | Hollow Heart Albion (5) |
| Scathach Indra `indra` 14 4 3 1 Lord of Thunder (2) Vajra (5) Karna `karna` 14 4 3 1 Kavacha and Kundala (2) Vasavi Shakti (6) Romulus-Quirinus `romulus_quirinus` 14 4 3 1 Throne of Quirinus (2) Per Aspera Ad Astra (5) Vritra `vritra` 13 3 3 1 Demon of Obstacles (2) Asura Sreshtha (5)  | `scathach` | 13 | 4 | 3 | 1 | God Slayer (2) | Gae Bolg Alternative (5) |

```
[
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
    "skillDesc": "ติดป้าย [Guts]: หาก HP ลดเหลือ 0 ภายใน 2 เทิร์นนี้ จะฟื้นกลับมาที่ 3 HP ทันที (1 ครั้ง)",
    "npName": "Gae Bolg",
    "npCost": 4,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1–2 ช่อง สร้างความเสียหาย 6 หน่วย ไม่สามารถหลบหลีกด้วย Evade ได้",
    "image": "/assets/servants/cu_chulainn.webp"
  },
  {
    "id": "leonidas_i",
    "name": "Leonidas I",
    "servantClass": "Lancer",
    "hp": 15,
    "atk": 2,
    "mov": 2,
    "range": 1,
    "skillName": "Pride of the Rearguard",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Taunt] บังคับศัตรูในระยะ 1–2 ช่องที่สั่งโจมตีต้องเล็งมาที่ Leonidas และติดป้าย [Guts] ฟื้น 2 HP",
    "npName": "Thermopylae Enomotia",
    "npCost": 4,
    "npDesc": "ลดความเสียหายที่ได้รับครึ่งหนึ่งตลอด 2 เทิร์น และสะท้อนดาเมจ 2 หน่วยใส่ศัตรูทุกตัวที่โจมตีระยะประชิด",
    "image": "/assets/servants/leonidas_i.webp"
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
    "skillDesc": "ในเทิร์นนี้เพิ่มระยะเดิน +2 MOV (ข้ามสิ่งกีดขวางได้) และติดป้าย [Invincible 1x]",
    "npName": "Hollow Heart Albion",
    "npCost": 5,
    "npDesc": "โจมตีศัตรูทุกตัวในระยะ 2 ช่องรอบตัว สร้างความเสียหาย 6 หน่วย และคืน +2 Mana ให้ทีมเมื่อจบเทิร์น",
    "image": "/assets/servants/melusine.webp"
  },
  {
    "id": "scathach",
    "name": "Scathach",
    "servantClass": "Lancer",
    "hp": 13,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "God Slayer",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Evade 1x] และในเทิร์นนี้โจมตีเป้าหมายสาย Divine หรือบอส PvE แรงขึ้น +2 หน่วย",
    "npName": "Gae Bolg Alternative",
    "npCost": 5,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1–2 ช่อง สร้างความเสียหาย 7 หน่วย และติดป้าย [Stun] เป้าหมาย 1 เทิร์น",
    "image": "/assets/servants/scathach.webp"

  },

  {
    "id": "indra",
    "name": "Indra",
    "servantClass": "Lancer",
    "hp": 14,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "Lord of Thunder",
    "skillCost": 2,
    "skillDesc": "ในเทิร์นนี้เพิ่ม +1 ATK, โจมตีทะลุ Evade และเมื่อจบเทิร์นสร้างความเสียหายสายฟ้าคงที่ 1 หน่วยให้ศัตรูทุกตัวในระยะ 1 ช่องรอบตัว",
    "npName": "Vajra",
    "npCost": 5,
    "npDesc": "ฟาดอัสนีบาตลงพื้นที่ 3x3 ในระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในพื้นที่ และติดป้าย [Shock] ลดงบการเดินของเป้าหมาย -1.0 MP ในเทิร์นถัดไป",
    "image": "/assets/servants/indra.webp"
  },
  {
    "id": "karna",
    "name": "Karna",
    "servantClass": "Lancer",
    "hp": 14,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "Kavacha and Kundala",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [DEF+2] ลดความเสียหายทุกครั้งที่ได้รับในเทิร์นนี้ลง 2 หน่วย และในเทิร์นนี้การโจมตีปกติหรือ NP แรงขึ้น +1 หน่วย (หากใช้ NP จะยกเลิก [DEF+2] ทันที)",
    "npName": "Vasavi Shakti",
    "npCost": 6,
    "npDesc": "ยิงหอกสุริยะเป็นเส้นตรงระยะ 3 ช่อง สร้างความเสียหาย 7 หน่วยให้ศัตรูทุกตัวในแนวเส้น (เพิ่มเป็น 9 หน่วยต่อเป้าหมายสาย Divine และทะลุ Invincible/Guard)",
    "image": "/assets/servants/karna.webp"
  },
  {
    "id": "romulus_quirinus",
    "name": "Romulus-Quirinus",
    "servantClass": "Lancer",
    "hp": 14,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "Throne of Quirinus",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Invincible 1x] และแปะป้าย [ROMA] ให้ศัตรู 1 ตัวในระยะ 2 ช่อง (เป้าหมายที่ติด [ROMA] จะโดน Romulus โจมตีแรงขึ้น +2 หน่วย)",
    "npName": "Per Aspera Ad Astra",
    "npCost": 5,
    "npDesc": "ยิงลำแสงลงพื้นที่ 3x3 ในระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัว (เพิ่มเป็น 8 หน่วยต่อเป้าหมายที่ติด [ROMA]) และพันธมิตรในโซนได้ [ATK+1] 1 เทิร์น",
    "image": "/assets/servants/romulus_quirinus.webp"
  },
  {
    "id": "vritra",
    "name": "Vritra",
    "servantClass": "Lancer",
    "hp": 13,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Demon of Obstacles",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Guts] (ฟื้น 3 HP 1 ครั้ง) และเลือกศัตรู 1 ตัวในระยะ 2 ช่อง ติดป้าย [Block Heal] พร้อมหักงบการเดิน -1.0 MP ในเทิร์นนี้",
    "npName": "Asura Sreshtha",
    "npCost": 5,
    "npDesc": "ปลดปล่อยคลื่นมังกรทมิฬระยะ 2 ช่องรอบตัว สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในระยะ และลดโบนัสทอยเต๋าโจมตีของศัตรูที่โดน -1 ในเทิร์นถัดไป",
    "image": "/assets/servants/vritra.webp"
  }
]
```

# **4\. Rider (7 ตน)**

| ชื่อตัวละคร | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Achilles | `achilles` | 14 | 3 | 3 | 1 | Andreias Amarantos (2) | Troias Tragoidia (5) |
| Astolfo | `astolfo` | 11 | 3 | 3 | 1 | Evaporation of Sanity (1) | Hippogriff (4) |
| Francis Drake | `francis_drake` | 12 | 3 | 3 | 2 | Pioneer of the Stars (2) | Golden Wild Hunt (5) |
| Iskandar | `iskandar` | 14 | 3 | 3 | 1 | Charisma of the Conqueror (2) | Ionioi Hetairoi (6) |
| Medusa | `medusa` | 12 | 3 | 3 | 1 | Mystic Eyes of Petrification (2) | Bellerophon (4) |
| Queen Medb Nemo / Noah `nemo_noah` 13 3 3 2 Noah's Blessing (2) Noah's Ark (5)  | `queen_medb` | 12 | 3 | 3 | 1 | Queen's Discipline (2) | Chariot My Love (5) |

```
[
  {
    "id": "achilles",
    "name": "Achilles",
    "servantClass": "Rider",
    "hp": 14,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Andreias Amarantos",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Invincible 2x] ป้องกันความเสียหาย 2 ครั้ง (ยกเว้นการโจมตีจากตัวละครสาย Divine ตามดุลยพินิจ Ruler)",
    "npName": "Troias Tragoidia",
    "npCost": 5,
    "npDesc": "พุ่งชนเป็นเส้นตรงสูงสุด 3 ช่อง (ย้ายตัวไปจุดปลายทาง) สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในแนวเส้น",
    "image": "/assets/servants/achilles.webp"
  },
  {
    "id": "astolfo",
    "name": "Astolfo",
    "servantClass": "Rider",
    "hp": 11,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Evaporation of Sanity",
    "skillCost": 1,
    "skillDesc": "ทอย 1d6: ออก 1–2 ได้ +2 QP | ออก 3–4 ได้ +1 MOV เทิร์นนี้ | ออก 5–6 ติด [Evade 1x] และได้ +2 Mana",
    "npName": "Hippogriff",
    "npCost": 4,
    "npDesc": "วาร์ปข้ามสิ่งกีดขวางหรือข้าม Gate ไปช่องใดก็ได้ในระยะ 3 ช่อง สร้างความเสียหาย 5 หน่วยรอบจุดลง และติด [Evade 1x]",
    "image": "/assets/servants/astolfo.webp"
  },
  {
    "id": "francis_drake",
    "name": "Francis Drake",
    "servantClass": "Rider",
    "hp": 12,
    "atk": 3,
    "mov": 3,
    "range": 2,
    "skillName": "Pioneer of the Stars",
    "skillCost": 2,
    "skillDesc": "ได้รับ +2 Mana และ +2 QP ทันที และโจมตีทะลุ Evade/Invincible ตลอดเทิร์นนี้",
    "npName": "Golden Wild Hunt",
    "npCost": 5,
    "npDesc": "ระดมยิงปืนใหญ่พื้นที่ 3x3 ในระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยให้ทุกตัวในพื้นที่ และได้รับ +3 QP",
    "image": "/assets/servants/francis_drake.webp"
  },
  {
    "id": "iskandar",
    "name": "Iskandar",
    "servantClass": "Rider",
    "hp": 14,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Charisma of the Conqueror",
    "skillCost": 2,
    "skillDesc": "พันธมิตรทุกตัวในโซนเดียวกันได้รับป้าย [ATK+1] และระยะเดิน +1 MOV ในเทิร์นนี้",
    "npName": "Ionioi Hetairoi",
    "npCost": 6,
    "npDesc": "เรียกกองทัพโจมตีศัตรูทุกตัวที่อยู่ในโซนเดียวกัน สร้างความเสียหาย 5 หน่วยทุกตัว (และ Ruler เสกทหารช่วยขวางช่อง 1 เทิร์น)",
    "image": "/assets/servants/iskandar.webp"
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
    "id": "queen_medb",
    "name": "Queen Medb",
    "servantClass": "Rider",
    "hp": 12,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Queen's Discipline",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +3 HP ให้ตัวเอง และมอบป้าย [ATK+1] ให้พันธมิตรชายทุกตัวในโซนเดียวกัน",
    "npName": "Chariot My Love",
    "npCost": 5,
    "npDesc": "พุ่งโจมตีเป้าหมายเดี่ยวระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วย (เพิ่มเป็น 8 หน่วยหากเป้าหมายเป็น Servant ชาย) และลด ATK เป้าหมาย -1 นาน 1 เทิร์น",
    "image": "/assets/servants/queen_medb.webp"

  },

  {
    "id": "nemo_noah",
    "name": "Nemo / Noah",
    "servantClass": "Rider",
    "hp": 13,
    "atk": 3,
    "mov": 3,
    "range": 2,
    "skillName": "Noah's Blessing",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +2 HP ให้พันธมิตรทุกตัวในระยะ 2 ช่อง และในเทิร์นนี้พันธมิตรเดินผ่านช่องแม่น้ำ (water) ใช้เพียง 1.0 MP โดยไม่ติดดีบัฟ Exposed",
    "npName": "Noah's Ark (Great Flood)",
    "npCost": 5,
    "npDesc": "ซัดคลื่นมหาอุทกภัยพื้นที่ 3x2 ด้านหน้า สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในพื้นที่ กระแทกถอยหลัง 1 ช่อง และคืน +2 Mana ให้ทีม",
    "image": "/assets/servants/nemo_noah.webp"
  }
]
```

# **5\. Caster (7 ตน)**

| ชื่อตัวละคร | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Medea | `medea` | 11 | 2 | 2 | 2 | Rapid Words of Divine (0) | Rule Breaker (4) |
| Merlin | `merlin` | 12 | 2 | 2 | 2 | Illusion (3) | Garden of Avalon (5) |
| Nursery Rhyme | `nursery_rhyme` | 11 | 2 | 2 | 2 | Meanwhile... (2) | Nursery Rhyme (4) |
| Xuanzang Sanzang Queen of Sheba `queen_of_sheba` 11 2 2 2 Charisma of Wealth (1) Three Enigmas (4) Scheherazade `scheherazade` 12 2 2 2 Storyteller's Survival (2) Alf Layla wa-Layla (5) Tamamo no Mae `tamamo_no_mae` 11 2 2 2 Fox's Wedding (2) Suiten Nikkou Amaterasu (5)  | `xuanzang_sanzang` | 12 | 3 | 2 | 1 | High-Speed Sutra Chanting (0) | Five Elements Mountain (5) |

```
[
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
    "skillDesc": "ใช้ Action ในเทิร์นนี้ชาร์จ +3 Mana ให้ทีมทันที (คูลดาวน์ 2 เทิร์น)",
    "npName": "Rule Breaker",
    "npCost": 4,
    "npDesc": "โจมตีระยะประชิด 1 ช่อง สร้างความเสียหาย 4 หน่วย ลบ Custom Buff Tags ทั้งหมดของเป้าหมาย และขโมย 2 Mana จากทีมศัตรู",
    "image": "/assets/servants/medea.webp"
  },
  {
    "id": "merlin",
    "name": "Merlin",
    "servantClass": "Caster",
    "hp": 12,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Illusion",
    "skillCost": 3,
    "skillDesc": "มอบป้าย [Invincible 1x] ให้พันธมิตรทุกตัวในโซนเดียวกันในเทิร์นนี้",
    "npName": "Garden of Avalon",
    "npCost": 5,
    "npDesc": "ติดบัฟ [Avalon 2T] นาน 2 เทิร์น: พันธมิตรทุกตัวฟื้นฟู +2 HP และทีมได้รับ +2 Mana เพิ่มเติมทุกจบเทิร์น",
    "image": "/assets/servants/merlin.webp"
  },
  {
    "id": "nursery_rhyme",
    "name": "Nursery Rhyme",
    "servantClass": "Caster",
    "hp": 11,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Meanwhile...",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +3 HP, ลบดีบัฟทั้งหมดของตัวเอง และสามารถสลับตำแหน่งกับพันธมิตร 1 ตนในโซนเดียวกันได้",
    "npName": "Nursery Rhyme (Jabberwock)",
    "npCost": 4,
    "npDesc": "โจมตีเป้าหมายในระยะ 2 ช่องและช่องข้างเคียง สร้างความเสียหาย 5 หน่วย และลด Mana ทีมศัตรู -2 หน่วย",
    "image": "/assets/servants/nursery_rhyme.webp"
  },
  {
    "id": "xuanzang_sanzang",
    "name": "Xuanzang Sanzang",
    "servantClass": "Caster",
    "hp": 12,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "High-Speed Sutra Chanting",
    "skillCost": 0,
    "skillDesc": "ใช้ Action ชาร์จ +3 Mana ให้ทีม และติดสถานะ [NP Ready] ทันที (คูลดาวน์ 2 เทิร์น)",
    "npName": "Five Elements Mountain",
    "npCost": 5,
    "npDesc": "ซัดฝ่ามือใส่เป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 8 หน่วย และกระแทกเป้าหมายถอยหลังไป 2 ช่อง",
    "image": "/assets/servants/xuanzang_sanzang.webp"

  },

  {
    "id": "queen_of_sheba",
    "name": "Queen of Sheba",
    "servantClass": "Caster",
    "hp": 11,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Charisma of Wealth",
    "skillCost": 1,
    "skillDesc": "ทีมได้รับ +2 QP ทันที และมอบป้าย [ATK+1] ให้พันธมิตรทุกตัวในระยะ 2 ช่องในเทิร์นนี้",
    "npName": "Three Enigmas",
    "npCost": 4,
    "npDesc": "เรียกจินน์โจมตีเป้าหมายเดี่ยวระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วย ลด ATK เป้าหมาย -1 นาน 1 เทิร์น และได้รับ +2 QP เมื่อจบเทิร์น",
    "image": "/assets/servants/queen_of_sheba.webp"
  },
  {
    "id": "scheherazade",
    "name": "Scheherazade",
    "servantClass": "Caster",
    "hp": 12,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Storyteller's Survival",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Guts] (ฟื้น 3 HP 1 ครั้ง) และเลือกศัตรู 1 ตัวในระยะ 2 ช่องติดป้าย [ATK-1] นาน 2 เทิร์น",
    "npName": "Alf Layla wa-Layla",
    "npCost": 5,
    "npDesc": "กางนิทานพันหนึ่งราตรีระยะ 2 ช่องรอบตัว สร้างความเสียหาย 5 หน่วยให้ศัตรูทุกตัวในระยะ (เพิ่มเป็น 8 หน่วยต่อเป้าหมายสาย King เช่น Artoria, Gilgamesh, Iskandar, Morgan, Nero) และลด Mana ทีมศัตรู -1",
    "image": "/assets/servants/scheherazade.webp"
  },
  {
    "id": "tamamo_no_mae",
    "name": "Tamamo no Mae",
    "servantClass": "Caster",
    "hp": 11,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Fox's Wedding",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +3 HP ให้พันธมิตร 1 ตนในระยะ 2 ช่อง และมอบป้าย [NP+2 DMG] เพิ่มความเสียหาย NP ครั้งถัดไปของเป้าหมาย +2 หน่วย",
    "npName": "Suiten Nikkou Amaterasu Yano Shizuishi",
    "npCost": 5,
    "npDesc": "ฟื้นฟู +3 HP ให้พันธมิตรทุกตัวในโซนเดียวกัน, คืน +3 Mana ให้ทีม และลดค่า Skill Cooldown ของพันธมิตรทุกตัวในโซนลง 1 เทิร์นทันที",
    "image": "/assets/servants/tamamo_no_mae.webp"
  }
]
```

# **6\. Assassin (7 ตน) — `ignoreZoC: true`**

| ชื่อตัวละคร | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Hassan of the Cursed Arm | `hassan_of_the_cursed_arm` | 11 | 3 | 3 | 1 | Protection from Wind (2) | Zabaniya: Heartbeat (4) |
| Hassan of the Hundred | `hassan_of_the_hundred` | 12 | 3 | 3 | 1 | Librarian of Knowledge (2) | Zabaniya: Illusion (5) |
| King Hassan | `king_hassan` | 15 | 4 | 2 | 1 | Battle Continuation EX (3) | Azrael (5) |
| Sasaki Kojiro | `sasaki_kojiro` | 10 | 3 | 3 | 1 | Eye of the Mind (False) (1) | Tsubame Gaeshi (4) |
| Stheno Jack the Ripper `jack_the_ripper` 11 3 3 1 Information Erasure (2) Maria the Ripper (4) Koyanskaya of Light `koyanskaya_of_light` 11 3 3 2 Innocent Munitions (2) Izutsuya \- Tunguska Nine Drive (5)  | `stheno` | 10 | 2 | 3 | 1 | Vampirism (1) | Smile of the Stheno (4) |

```
[
  {
    "id": "hassan_of_the_cursed_arm",
    "name": "Hassan of the Cursed Arm",
    "servantClass": "Assassin",
    "hp": 11,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Protection from Wind",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Evade 2x] และซ่อนตัวจาก Fog of War ของศัตรู 1 เทิร์น",
    "npName": "Zabaniya (Delusional Heartbeat)",
    "npCost": 4,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 6 หน่วย หากเป้าหมาย HP เหลือ 5 หรือน้อยกว่า มีโอกาสสังหารทันทีเมื่อทอย 1d6 ได้ 5–6",
    "image": "/assets/servants/hassan_of_the_cursed_arm.webp"
  },
  {
    "id": "hassan_of_the_hundred",
    "name": "Hassan of the Hundred Personas",
    "servantClass": "Assassin",
    "hp": 12,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Librarian of Stored Knowledge",
    "skillCost": 2,
    "skillDesc": "เทิร์นนี้เพิ่ม +1 MOV และเปิดเผยตำแหน่งศัตรู 1 ตัวในโซนเดียวกันทะลุ Fog of War",
    "npName": "Zabaniya (Delusional Illusion)",
    "npCost": 5,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1–2 ช่อง สร้างความเสียหาย 6 หน่วย และสามารถย้ายตัวเองไปช่องว่างรอบเป้าหมายได้ทันทีหลังโจมตี",
    "image": "/assets/servants/hassan_of_the_hundred.webp"
  },
  {
    "id": "king_hassan",
    "name": "First Hassan (King Hassan)",
    "servantClass": "Assassin",
    "hp": 15,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Battle Continuation (EX)",
    "skillCost": 3,
    "skillDesc": "ติดป้าย [Guts]: เมื่อ HP เหลือ 0 ฟื้นกลับมาที่ 5 HP ทันที (1 ครั้ง) และได้ [ATK+1] ในเทิร์นถัดไป",
    "npName": "Azrael",
    "npCost": 5,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 8 หน่วย ทะลุ Evade/Guts (หากเป้าหมาย HP ≤ 6 และทอย 1d6 ได้ 5–6 สังหารทันที)",
    "image": "/assets/servants/king_hassan.webp"
  },
  {
    "id": "sasaki_kojiro",
    "name": "Sasaki Kojiro",
    "servantClass": "Assassin",
    "hp": 10,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Eye of the Mind (False)",
    "skillCost": 1,
    "skillDesc": "ติดป้าย [Evade 1x] และได้โบนัสทอยเต๋าโจมตี +1 ในเทิร์นนี้",
    "npName": "Tsubame Gaeshi",
    "npCost": 4,
    "npDesc": "ฟัน 3 จังหวะพร้อมกันใส่เป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 7 หน่วย ทะลุทั้ง Evade และ Guard",
    "image": "/assets/servants/sasaki_kojiro.webp"
  },
  {
    "id": "stheno",
    "name": "Stheno",
    "servantClass": "Assassin",
    "hp": 10,
    "atk": 2,
    "mov": 3,
    "range": 1,
    "skillName": "Vampirism",
    "skillCost": 1,
    "skillDesc": "ขโมย 2 Mana จากทีมศัตรูเมื่ออยู่ในระยะ 2 ช่อง และลดระยะเดินของเป้าหมาย -1 ในเทิร์นนี้",
    "npName": "Smile of the Stheno",
    "npCost": 4,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 2 ช่อง ดาเมจ 4 หน่วย ลบ Buff Tag ทั้งหมด และหากเป็น Servant ชายติดป้าย [Stun] 1 เทิร์น (สังหารทันทีหาก HP ≤ 4 และทอยได้ 6)",
    "image": "/assets/servants/stheno.webp"

  },

  {
    "id": "jack_the_ripper",
    "name": "Jack the Ripper",
    "servantClass": "Assassin",
    "hp": 11,
    "atk": 3,
    "mov": 3,
    "range": 1,
    "skillName": "Information Erasure",
    "skillCost": 2,
    "skillDesc": "ลบ Custom Buff Tags ทั้งหมดของศัตรู 1 ตัวในระยะ 1 ช่อง และ Jack ติดป้าย [Evade 1x] พร้อมซ่อนตัวจาก Fog of War 1 เทิร์น",
    "npName": "Maria the Ripper",
    "npCost": 4,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 6 หน่วย (เพิ่มเป็น 8 หน่วยหากเป้าหมายเป็น Servant หญิง) และทะลุ Guard",
    "image": "/assets/servants/jack_the_ripper.webp"
  },
  {
    "id": "koyanskaya_of_light",
    "name": "Koyanskaya of Light",
    "servantClass": "Assassin",
    "hp": 11,
    "atk": 3,
    "mov": 3,
    "range": 2,
    "skillName": "Innocent Munitions (NFF Support)",
    "skillCost": 2,
    "skillDesc": "เลือกพันธมิตร 1 ตนในระยะ 2 ช่อง: รีเซ็ต Skill Cooldown เป็น 0 ทันทีและมอบป้าย [ATK+1] ในเทิร์นนี้ (เป้าหมายเสีย 1 HP จากสัญญา NFF)",
    "npName": "Izutsuya - Tunguska Nine Drive",
    "npCost": 5,
    "npDesc": "ระดมยิงปืนใหญ่พื้นที่ 3x3 ในระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในพื้นที่, ลด Mana ทีมศัตรู -1 และคืน +2 Mana ให้ทีมตัวเอง",
    "image": "/assets/servants/koyanskaya_of_light.webp"
  }
]
```

# **7\. Berserker (9 ตน)**

| ชื่อตัวละคร | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Frankenstein | `frankenstein` | 13 | 4 | 2 | 1 | Galvanism (1) | Blasted Tree (4) |
| Heracles | `heracles` | 16 | 4 | 2 | 1 | God Hand (3) | Nine Lives (5) |
| Lancelot (Berserker) | `lancelot` | 14 | 4 | 3 | 1 | Eternal Arms Mastery (2) | Knight of Owner (5) |
| Minamoto no Raiko | `minamoto_no_raiko` | 14 | 4 | 2 | 1 | Mana Burst (Lightning) (2) | Goou Shourai (5) |
| Morgan | `morgan` | 13 | 4 | 2 | 2 | Charisma of Desire (2) | Roadless Camelot (6) |
| Nightingale | `nightingale` | 14 | 3 | 2 | 1 | Nurse of Steel (2) | Nightingale Pledge (5) |
| Spartacus Cu Chulainn (Alter) `cu_chulainn_alter` 15 4 2 1 Protection from Arrows (Cursed) (2) Curruid Coinchenn (5) Sen no Rikyu `sen_no_rikyu` 13 3 2 1 Wabi-Sabi (2) Ichigo Ichie (5)  | `spartacus` | 15 | 3 | 2 | 1 | Unyielding Will (2) | Crying Warmonger (4) |

```
[
  {
    "id": "frankenstein",
    "name": "Frankenstein",
    "servantClass": "Berserker",
    "hp": 13,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Galvanism",
    "skillCost": 1,
    "skillDesc": "ได้รับ +2 Mana ให้ทีมทันที และเพิ่มความเสียหาย NP ครั้งถัดไป +1 หน่วย",
    "npName": "Blasted Tree",
    "npCost": 4,
    "npDesc": "ระเบิดสายฟ้าพื้นที่ 3x3 รอบตัวเอง สร้างความเสียหาย 7 หน่วยให้ทุกตัวในระยะ แต่ Frankenstein ติดป้าย [Stun] ในเทิร์นถัดไป",
    "image": "/assets/servants/frankenstein.webp"
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
    "skillDesc": "ติดป้าย [Guts 2x]: เมื่อ HP ลดเหลือ 0 จะฟื้นคืนชีพที่ 4 HP ทันที (สูงสุด 2 ครั้งตลอดเกม)",
    "npName": "Nine Lives",
    "npCost": 5,
    "npDesc": "ฟาดฟันเป้าหมายเดี่ยวระยะ 1 ช่องอย่างต่อเนื่อง สร้างความเสียหาย 8 หน่วยและทำลายการตั้งรับ Guard",
    "image": "/assets/servants/heracles.webp"
  },
  {
    "id": "lancelot",
    "name": "Lancelot (Berserker)",
    "servantClass": "Berserker",
    "hp": 14,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "Eternal Arms Mastery",
    "skillCost": 2,
    "skillDesc": "ในเทิร์นนี้การโจมตีปกติติด Critical ง่ายขึ้น (ทอย 1d6 ได้ 3–6 นับเป็นโบนัส +2 CRIT!)",
    "npName": "Knight of Owner",
    "npCost": 5,
    "npDesc": "ยิงปืนกลเป็นพื้นที่ระยะ 2 ช่องด้านหน้า สร้างความเสียหาย 6 หน่วยให้ทุกตัวในระยะ และขโมยไอเทมสุ่ม 1 ชิ้นหากสังหารได้",
    "image": "/assets/servants/lancelot.webp"
  },
  {
    "id": "minamoto_no_raiko",
    "name": "Minamoto no Raiko",
    "servantClass": "Berserker",
    "hp": 14,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Mana Burst (Lightning)",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Evade 1x] และในเทิร์นนี้การโจมตีปกติหรือ NP สร้างความเสียหายเพิ่ม +2 หน่วย",
    "npName": "Goou Shourai - Tenmoukaikai",
    "npCost": 5,
    "npDesc": "สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในระยะ 2 ช่องรอบตัว (เพิ่มเป็น 8 หน่วยต่อมอนสเตอร์ PvE)",
    "image": "/assets/servants/minamoto_no_raiko.webp"
  },
  {
    "id": "morgan",
    "name": "Morgan",
    "servantClass": "Berserker",
    "hp": 13,
    "atk": 4,
    "mov": 2,
    "range": 2,
    "skillName": "Charisma of Desire",
    "skillCost": 2,
    "skillDesc": "พันธมิตรทุกตัวในโซนเดียวกันได้รับป้าย [ATK+1] และทีมได้รับ +2 Mana ทันที",
    "npName": "Roadless Camelot",
    "npCost": 6,
    "npDesc": "โจมตีพื้นที่ 3x3 ในระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วยทุกตัว พร้อมติดป้าย [Curse -1 HP] และลด ATK ศัตรู -1 นาน 1 เทิร์น",
    "image": "/assets/servants/morgan.webp"
  },
  {
    "id": "nightingale",
    "name": "Nightingale",
    "servantClass": "Berserker",
    "hp": 14,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Nurse of Steel",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +4 HP ให้ตัวเองหรือพันธมิตร 1 ตนในระยะ 2 ช่อง และลบดีบัฟทั้งหมด",
    "npName": "Nightingale Pledge",
    "npCost": 5,
    "npDesc": "ฟื้นฟู +4 HP ให้พันธมิตรทุกตัวในโซนเดียวกัน และทำให้ศัตรูทุกตัวในระยะ 2 ช่องสร้างความเสียหายลดลงครึ่งหนึ่งในเทิร์นนี้",
    "image": "/assets/servants/nightingale.webp"
  },
  {
    "id": "spartacus",
    "name": "Spartacus",
    "servantClass": "Berserker",
    "hp": 15,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Unyielding Will",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +2 HP ทันที และติดป้าย [Guts] ฟื้นคืนชีพที่ 3 HP (1 ครั้ง)",
    "npName": "Crying Warmonger",
    "npCost": 4,
    "npDesc": "ระเบิดพลังรอบตัวระยะ 1 ช่อง สร้างความเสียหาย 4 + ครึ่งหนึ่งของ HP ที่เสียไป (ปัดลง, สูงสุด 9 หน่วย) และฟื้นฟู +3 HP หลังใช้",
    "image": "/assets/servants/spartacus.webp"

  },

  {
    "id": "cu_chulainn_alter",
    "name": "Cu Chulainn (Alter)",
    "servantClass": "Berserker",
    "hp": 15,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Protection from Arrows (Cursed)",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Evade 2x] หลบการโจมตี 2 ครั้ง และลด ATK ของศัตรูที่ยืนประชิดระยะ 1 ช่องลง -1 ในเทิร์นนี้",
    "npName": "Curruid Coinchenn",
    "npCost": 5,
    "npDesc": "สวมเกราะกระดูกติดป้าย [DEF+1] ในเทิร์นนี้ แล้วโจมตีเป้าหมายเดี่ยวระยะ 1 ช่อง สร้างความเสียหาย 8 หน่วย (ทะลุ Guard)",
    "image": "/assets/servants/cu_chulainn_alter.webp"
  },
  {
    "id": "sen_no_rikyu",
    "name": "Sen no Rikyu",
    "servantClass": "Berserker",
    "hp": 13,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Wabi-Sabi (Tea Ceremony)",
    "skillCost": 2,
    "skillDesc": "มอบ +2 Mana ให้ทีม และเลือกได้ 1 อย่าง: ฟื้นฟู +3 HP ให้ตัวเอง หรือติดป้าย [Evade 1x]",
    "npName": "Ichigo Ichie",
    "npCost": 5,
    "npDesc": "แผ่คลื่นชาดำระยะ 2 ช่องรอบตัว สร้างความเสียหาย 6 หน่วยให้ศัตรูทุกตัวในระยะ และติดป้าย [Curse -1 HP] นาน 2 เทิร์น",
    "image": "/assets/servants/sen_no_rikyu.webp"
  }
]
```

# **8\. Extra (8 ตน — Ruler / Avenger / Alter Ego / Moon Cancer)**

| ชื่อตัวละคร | คลาสย่อย | id | HP | ATK | MOV | Range | Skill (Mana) | Noble Phantasm (Mana) |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Amakusa Shiro | Ruler | `amakusa_shiro` | 14 | 3 | 2 | 1 | Baptism Sacrament (1) | Twin Arm \- Big Crunch (5) |
| Jeanne d'Arc | Ruler | `jeanne_darc` | 16 | 2 | 2 | 1 | True Name Discernment (2) | Luminosite Eternelle (5) |
| Angra Mainyu | Avenger | `angra_mainyu` | 10 | 2 | 3 | 1 | Annihilation Wish (1) | Verg Avesta (4) |
| Jeanne d'Arc (Alter) | Avenger | `jeanne_darc_alter` | 12 | 4 | 2 | 1 | Ephemeral Dream (2) | La Grondement Du Haine (5) |
| Meltryllis | Alter Ego | `meltryllis` | 12 | 4 | 3 | 1 | Crime Ballet (2) | Sarasvati Meltout (5) |
| Passionlip | Alter Ego | `passionlip` | 16 | 3 | 2 | 1 | Masochistic Constitution (2) | Brynhildr Romantia (5) |
| BB Okita Soji (Alter) Alter Ego `okita_soji_alter` 14 4 2 1 Continuity (2) Zekken \- Mukyuu Sandan (5)  | Moon Cancer | `bb` | 13 | 2 | 2 | 2 | Ten Crowns (2) | C.C.C. (5) |

```
[
  {
    "id": "amakusa_shiro",
    "name": "Amakusa Shiro",
    "servantClass": "Extra",
    "subClass": "Ruler",
    "hp": 14,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Baptism Sacrament",
    "skillCost": 1,
    "skillDesc": "ติดป้าย [Mana+1/T]: ทีมได้รับ +1 Mana พิเศษเพิ่มเติมทุกจบเทิร์น นาน 3 เทิร์น",
    "npName": "Twin Arm - Big Crunch",
    "npCost": 5,
    "npDesc": "ลบ Buff Tag (Evade/Invincible/Guard) ของศัตรูทุกตัวในระยะ 2 ช่องก่อน แล้วจึงสร้างความเสียหาย 5 หน่วยใส่ทุกตัว",
    "image": "/assets/servants/amakusa_shiro.webp"
  },
  {
    "id": "jeanne_darc",
    "name": "Jeanne d'Arc",
    "servantClass": "Extra",
    "subClass": "Ruler",
    "hp": 16,
    "atk": 2,
    "mov": 2,
    "range": 1,
    "skillName": "True Name Discernment",
    "skillCost": 2,
    "skillDesc": "สั่งศัตรู 1 ตัวในระยะ 2 ช่องห้ามใช้ NP ในเทิร์นนี้ และเปิดเผยตำแหน่งทะลุ Fog of War",
    "npName": "Luminosite Eternelle",
    "npCost": 5,
    "npDesc": "มอบป้าย [Invincible 1x] และฟื้นฟู +2 HP ให้พันธมิตรทุกตัวในโซนเดียวกัน แต่ Jeanne ติดป้าย [Stun] ในเทิร์นถัดไป",
    "image": "/assets/servants/jeanne_darc.webp"
  },
  {
    "id": "angra_mainyu",
    "name": "Angra Mainyu",
    "servantClass": "Extra",
    "subClass": "Avenger",
    "hp": 10,
    "atk": 2,
    "mov": 3,
    "range": 1,
    "skillName": "Annihilation Wish",
    "skillCost": 1,
    "skillDesc": "ในเทิร์นนี้เพิ่ม +2 ATK และ +1 MOV แต่เสีย 2 HP ตอนจบเทิร์น",
    "npName": "Verg Avesta",
    "npCost": 4,
    "npDesc": "ตั้งรับในเทิร์นนี้ เมื่อจบเฟสต่อสู้จะสะท้อนความเสียหายที่ตัวเองเพิ่งได้รับคูณ 1.5 (ปัดขึ้น) ใส่ศัตรูทุกตัวในระยะ 2 ช่อง ทะลุ Guard/Evade",
    "image": "/assets/servants/angra_mainyu.webp"
  },
  {
    "id": "jeanne_darc_alter",
    "name": "Jeanne d'Arc (Alter)",
    "servantClass": "Extra",
    "subClass": "Avenger",
    "hp": 12,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Ephemeral Dream",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Invincible 1x] และเพิ่ม +2 ATK ในเทิร์นนี้ แต่เสีย 1 HP",
    "npName": "La Grondement Du Haine",
    "npCost": 5,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 1–2 ช่อง สร้างความเสียหาย 8 หน่วย และติดป้าย [Block Heal] ห้ามฟื้นฟู HP นาน 2 เทิร์น",
    "image": "/assets/servants/jeanne_darc_alter.webp"
  },
  {
    "id": "meltryllis",
    "name": "Meltryllis",
    "servantClass": "Extra",
    "subClass": "Alter Ego",
    "hp": 12,
    "atk": 4,
    "mov": 3,
    "range": 1,
    "skillName": "Crime Ballet",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Evade 2x] และเพิ่มระยะเดิน +1 MOV ในเทิร์นนี้",
    "npName": "Sarasvati Meltout",
    "npCost": 5,
    "npDesc": "พุ่งโจมตีเป้าหมายเดี่ยวระยะ 2 ช่อง สร้างความเสียหาย 7 หน่วย และลบ Buff Tag ทั้งหมดของเป้าหมาย",
    "image": "/assets/servants/meltryllis.webp"
  },
  {
    "id": "passionlip",
    "name": "Passionlip",
    "servantClass": "Extra",
    "subClass": "Alter Ego",
    "hp": 16,
    "atk": 3,
    "mov": 2,
    "range": 1,
    "skillName": "Masochistic Constitution",
    "skillCost": 2,
    "skillDesc": "ติดป้าย [Taunt] และ [DEF+2] ลดความเสียหายที่ได้รับลง 2 หน่วยทุกครั้งในเทิร์นนี้",
    "npName": "Brynhildr Romantia",
    "npCost": 5,
    "npDesc": "โจมตีศัตรูทุกตัวในระยะ 1 ช่อง สร้างความเสียหาย 6 หน่วย และฟื้นฟู +3 HP ให้พันธมิตรทุกตัวในโซนเดียวกัน",
    "image": "/assets/servants/passionlip.webp"
  },
  {
    "id": "bb",
    "name": "BB",
    "servantClass": "Extra",
    "subClass": "Moon Cancer",
    "hp": 13,
    "atk": 2,
    "mov": 2,
    "range": 2,
    "skillName": "Ten Crowns",
    "skillCost": 2,
    "skillDesc": "ฟื้นฟู +3 HP, ลบดีบัฟทั้งหมด และมอบป้าย [Debuff Immune] ให้พันธมิตร 1 ตน",
    "npName": "C.C.C. (Cursed Cutting Crater)",
    "npCost": 5,
    "npDesc": "โจมตีเป้าหมายเดี่ยวระยะ 2 ช่อง สร้างความเสียหาย 6 หน่วย ลบป้าย Evade/Invincible และคืน +2 Mana ให้ทีม",
    "image": "/assets/servants/bb.webp"

  },

  {
    "id": "okita_soji_alter",
    "name": "Okita Soji (Alter)",
    "servantClass": "Extra",
    "subClass": "Alter Ego",
    "hp": 14,
    "atk": 4,
    "mov": 2,
    "range": 1,
    "skillName": "Continuity (Counter Force)",
    "skillCost": 2,
    "skillDesc": "คืน +1 Mana ให้ทีม และในเทิร์นนี้การโจมตีปกติหรือ NP สร้างความเสียหายเพิ่มขึ้น +2 หน่วย",
    "npName": "Zekken - Mukyuu Sandan",
    "npCost": 5,
    "npDesc": "ฟาดฟันลำแสงมิติเป็นเส้นตรงระยะ 3 ช่อง สร้างความเสียหาย 7 หน่วยให้ศัตรูทุกตัวในแนวเส้น (เพิ่มเป็น 8 หน่วยต่อเป้าหมายคลาส Extra หรือบอส PvE)",
    "image": "/assets/servants/okita_soji_alter.webp",
  }
]
```

# **คำแนะนำการนำไปรวมเป็น `src/data/servants.json` ด้วย AntiGravity**

1. นำเอกสารนี้ไปวางในโฟลเดอร์ `docs/` (เช่น `docs/06_SERVANTS_POOL_62.md`)  
2. นำรูป `.webp` ทั้ง 62 ใบวางใน `public/assets/servants/` แล้วสั่ง AntiGravity เปลี่ยนชื่อไฟล์ให้ตรงกับค่า `id` ทั้งหมด และรวม JSON ทั้ง 8 บล็อกในเอกสารนี้เป็นไฟล์ `src/data/servants.json` ไฟล์เดียว (Array ขนาด 62 รายการ)

