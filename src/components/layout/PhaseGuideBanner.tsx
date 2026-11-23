import { Compass } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function PhaseGuideBanner() {
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);

  const isRuler = previewRole === 'ruler';
  const myTeam = previewRole === 'master_b' ? 'team_b' : 'team_a';
  const myLocked = !isRuler ? roomState.teams[myTeam].readyLocked : false;
  const bothLocked =
    roomState.teams.team_a.readyLocked && roomState.teams.team_b.readyLocked;

  const getGuideMessage = (): string => {
    switch (roomState.phase) {
      case 'draft':
        return isRuler
          ? 'เฟส Draft: กดปุ่ม Wheel เพื่อสุ่ม Servant ให้ครบทีมละ 6 ตน จากนั้นสลับไปเฟส Deploy'
          : 'เฟส Draft: รอ Ruler สุ่มอัญเชิญ Servant เข้าทีมของคุณให้ครบ 6 ตน';
      case 'deployment':
        if (isRuler) {
          return bothLocked
            ? 'เฟส Deploy: ทั้งสองฝ่ายล็อกจุดเกิดครบแล้ว — เปิดแท็บ Deploy ทางขวาแล้วกด "Deploy All & Start Turn 1"'
            : 'เฟส Deploy: รอ Master A และ Master B จัดทัพ 3 ตัวจริงแบบลับ (ดู Preview ได้ที่แท็บ Deploy)';
        }
        return myLocked
          ? 'เฟส Deploy: คุณล็อกจุดเกิดเรียบร้อยแล้ว — รออีกฝั่งและรอ Ruler กดเริ่มเกม'
          : 'เฟส Deploy: เลือก Servant ตัวจริง 3 ตนลงจุดเกิดทางขวา แล้วกด "LOCK DEPLOYMENT"';
      case 'event':
        return isRuler
          ? 'เฟส Event: กดปุ่ม Wheel → แท็บ Map Event เพื่อสุ่มเหตุการณ์ประจำเทิร์น แล้วกดเปลี่ยนเป็นเฟส Planning'
          : 'เฟส Event: รอ Ruler สุ่ม Map Event ประจำเทิร์นก่อนเริ่มสั่งการ';
      case 'planning':
        if (isRuler) {
          return bothLocked
            ? 'เฟส Planning: Master ทั้งสองฝั่งส่งคำสั่งครบแล้ว! เปลี่ยนเป็นเฟส Resolve และเปิดแท็บ Orders เพื่อเฉลยผล'
            : 'เฟส Planning: รอ Master ทั้ง 2 ฝั่งส่งคำสั่งลับ (สถานะ LOCKED จะขึ้นบนแถบด้านบน)';
        }
        return myLocked
          ? 'เฟส Planning: คุณล็อกคำสั่งลับแล้ว — รออีกฝั่งส่งคำสั่งและรอ Ruler เฉลยผล'
          : 'เฟส Planning: เลือก Stance (Attack/Defensive/Evade) + คำสั่ง Move หรือ Attack/NP (โจมตีก่อนเดิน) แล้วกด "LOCK TURN"';
      case 'resolution':
        return isRuler
          ? 'เฟส Resolve: P1 Guard/Stance/Buff → P2 Combat/NP & สวนกลับ (เปิด Combat Helper) → P3 Move/Evade ถอย 1 ช่อง → P4 End Turn'
          : 'เฟส Resolve: Ruler กำลังเฉลยผล (P1 Stance/Guard → P2 Attack/NP ก่อน Move → P3 เคลื่อนที่/Evade → P4 จบเทิร์น)';
      case 'ended':
        return 'สงครามจอกศักดิ์สิทธิ์สิ้นสุดลงแล้ว — ยินดีกับผู้ชนะ!';
      default:
        return '';
    }
  };

  const text = getGuideMessage();
  if (!text) return null;

  return (
    <div className="flex h-6 shrink-0 items-center justify-center gap-1.5 border-b border-[#C8A253]/20 bg-[#0B101B] px-3 text-[10.5px] text-slate-300">
      <Compass className="h-3 w-3 shrink-0 text-[#C8A253]" />
      <span className="truncate font-medium">{text}</span>
    </div>
  );
}
