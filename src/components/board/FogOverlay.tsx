import { CloudFog } from 'lucide-react';

interface FogOverlayProps {
  zoneName: string;
}

export function FogOverlay({ zoneName }: FogOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#090B10]/82 backdrop-blur-[2px]">
      <div className="clip-tactical-sm flex flex-col items-center border border-[#C8A253]/35 bg-[#111622]/95 px-6 py-4 text-center shadow-2xl">
        <CloudFog className="mb-2 h-8 w-8 text-[#C8A253]/80" />
        <div className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
          FOG OF WAR
        </div>
        <p className="mt-1 text-xs font-medium text-slate-300">
          {zoneName} ถูกหมอกสงครามปกคลุมอยู่
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          ส่ง Servant ข้าม Gate เข้าไปในโซนนี้ หรือใช้ Watchtower / ไอเทมสอดแนมเพื่อเปิดพื้นที่
        </p>
      </div>
    </div>
  );
}
