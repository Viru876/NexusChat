import { ReactNode } from 'react';

type BadgeColor = 'indigo' | 'violet' | 'cyan' | 'green' | 'red' | 'orange' | 'gray';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colorMap: Record<BadgeColor, string> = {
  indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  gray: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export default function Badge({ children, color = 'indigo', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  );
}
