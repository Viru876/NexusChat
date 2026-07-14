import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  color: string;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Ananya Gupta',
    role: 'Product Lead, Orbit Labs',
    initials: 'AG',
    color: '#6366f1',
    quote:
      'We replaced three separate tools with NexusChat. Threads and the Kanban board alone saved our team hours every week.',
  },
  {
    name: 'Karan Mehta',
    role: 'Engineering Manager, Flux',
    initials: 'KM',
    color: '#8b5cf6',
    quote:
      'The video calling just works — no plugins, no lag. Our standups moved here on day one and never left.',
  },
  {
    name: 'Priya Nair',
    role: 'Founder, Studio Nine',
    initials: 'PN',
    color: '#06b6d4',
    quote:
      "It feels fast and looks incredible. Our remote team finally has one place that doesn't feel like a chore to open.",
  },
];

/**
 * Auto-advancing testimonial carousel with manual prev/next controls and
 * dot indicators.
 */
export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  const current = testimonials[index];

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="relative min-h-[220px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="glass rounded-2xl p-8"
          >
            <div className="mb-3 flex justify-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <p className="text-lg text-text-primary">&ldquo;{current.quote}&rdquo;</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: current.color }}
              >
                {current.initials}
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">{current.name}</p>
                <p className="text-xs text-text-secondary">{current.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
          className="rounded-full p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-indigo-400' : 'w-2 bg-white/20'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
          className="rounded-full p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
          aria-label="Next testimonial"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
