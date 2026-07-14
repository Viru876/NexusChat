import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';

interface PreviewMessage {
  id: number;
  name: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  seen?: boolean;
}

const script: PreviewMessage[] = [
  { id: 1, name: 'Aditi Sharma', initials: 'AS', color: '#6366f1', text: 'Deployed the new build 🚀', time: '10:02', seen: true },
  { id: 2, name: 'Rahul Verma', initials: 'RV', color: '#8b5cf6', text: 'Nice! Video call to review it?', time: '10:03', seen: true },
  { id: 3, name: 'You', initials: 'YOU', color: '#06b6d4', text: "On it — starting the call now.", time: '10:03', seen: false },
];

/**
 * A looping, self-animating chat window used as a decorative element in the
 * hero section. Purely presentational — no real socket connection.
 */
export default function ChatPreview() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function play() {
      while (!cancelled) {
        setVisibleCount(0);
        setTyping(false);
        await wait(600);
        for (let i = 0; i < script.length; i++) {
          setTyping(true);
          await wait(900);
          if (cancelled) return;
          setTyping(false);
          setVisibleCount(i + 1);
          await wait(1400);
        }
        await wait(2200);
      }
    }

    function wait(ms: number) {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    play();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="glass w-full max-w-sm overflow-hidden rounded-2xl shadow-glow-lg">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-sm font-semibold text-text-primary">#product-launch</span>
        <span className="ml-auto text-xs text-text-secondary">3 online</span>
      </div>

      <div className="flex min-h-[220px] flex-col gap-3 p-4">
        <AnimatePresence initial={false}>
          {script.slice(0, visibleCount).map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={`flex items-start gap-2 ${m.name === 'You' ? 'flex-row-reverse' : ''}`}
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: m.color }}
              >
                {m.initials}
              </span>
              <div className={`max-w-[75%] ${m.name === 'You' ? 'items-end text-right' : ''}`}>
                <div
                  className={`rounded-xl px-3 py-1.5 text-sm ${
                    m.name === 'You'
                      ? 'bg-indigo-500/30 text-white'
                      : 'bg-white/5 text-text-primary'
                  }`}
                >
                  {m.text}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-text-secondary">
                  {m.time}
                  {m.name === 'You' &&
                    (m.seen ? <CheckCheck size={12} className="text-cyan-400" /> : <Check size={12} />)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 px-1 text-xs text-text-secondary"
          >
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
            </span>
            typing...
          </motion.div>
        )}
      </div>
    </div>
  );
}
