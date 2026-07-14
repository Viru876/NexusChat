import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Hash,
  Users,
  Search,
  Paperclip,
  Video,
  Mic,
  PhoneOff,
  Plus,
  FileText,
  Sparkles,
} from 'lucide-react';
import ChatPreview from './ChatPreview';

/**
 * Real video file location. Drop an actual screen-recording at
 * `client/public/demo.mp4` and this section will automatically detect and
 * play it in place of the animated slide tour below — no code changes needed.
 */
const REAL_VIDEO_SRC = '/demo.mp4';

interface Slide {
  id: string;
  duration: number; // ms
  title: string;
  /** Short on-screen caption shown under the mockup. */
  caption: string;
  /** Longer narrator line — shown in the teleprompter panel for voiceover recording. */
  narration: string;
  render: () => JSX.Element;
}

/** Mini video-call mockup used inside the demo tour. */
function CallSlideMockup() {
  return (
    <div className="glass flex h-full w-full max-w-sm flex-col items-center justify-between rounded-2xl p-6 shadow-glow-lg">
      <div className="flex w-full items-center justify-between text-xs text-text-secondary">
        <span>02:14</span>
        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-300">Live</span>
      </div>
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-brand text-2xl font-black text-white">
        RV
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-indigo-400"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </div>
      <p className="text-sm font-semibold text-text-primary">Rahul Verma</p>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
          <Mic size={16} />
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
          <Video size={16} />
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white">
          <PhoneOff size={16} />
        </span>
      </div>
    </div>
  );
}

/** Mini Kanban board mockup used inside the demo tour. */
function TaskSlideMockup() {
  const columns = [
    { title: 'To Do', color: '#64748b', cards: ['Design review'] },
    { title: 'In Progress', color: '#06b6d4', cards: ['API integration', 'Landing page'] },
    { title: 'Done', color: '#10b981', cards: ['Auth flow'] },
  ];
  return (
    <div className="glass grid w-full max-w-md grid-cols-3 gap-2 rounded-2xl p-4 shadow-glow-lg">
      {columns.map((col) => (
        <div key={col.title} className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
            {col.title}
          </div>
          {col.cards.map((c, i) => (
            <motion.div
              key={c}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="rounded-lg bg-white/5 p-2 text-[11px] text-text-primary"
            >
              {c}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Mini search / file sharing mockup used inside the demo tour. */
function SearchSlideMockup() {
  return (
    <div className="glass w-full max-w-sm rounded-2xl p-4 shadow-glow-lg">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
        <Search size={14} className="text-text-secondary" />
        <span className="text-sm text-text-secondary">launch checklist...</span>
      </div>
      {[
        { icon: Hash, label: '#product-launch', sub: '"Final checklist attached" — Aditi' },
        { icon: Paperclip, label: 'launch-checklist.pdf', sub: 'Shared 2 days ago' },
        { icon: Users, label: 'Rahul Verma', sub: 'Product designer' },
      ].map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.15 }}
          className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
        >
          <r.icon size={16} className="text-indigo-400" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-text-primary">{r.label}</p>
            <p className="truncate text-[10px] text-text-secondary">{r.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Intro / outro title-card mockup. */
function TitleSlideMockup({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-brand text-4xl font-black text-white shadow-glow-lg">
        N
      </span>
      <h3 className="text-2xl font-black text-gradient">NexusChat</h3>
      <p className="max-w-xs text-sm text-text-secondary">{subtitle}</p>
    </div>
  );
}

const slides: Slide[] = [
  {
    id: 'intro',
    duration: 6000,
    title: 'Welcome to NexusChat',
    caption: 'Where teams connect, create, and collaborate — all in one place.',
    narration:
      "Hey, welcome to NexusChat — a real-time collaboration platform built for modern teams. " +
      "In the next minute, I'll show you exactly how it works: messaging, video calls, task boards, and search, all in one workspace.",
    render: () => (
      <TitleSlideMockup subtitle="Real-time messaging, video calls, and task management in one beautiful workspace." />
    ),
  },
  {
    id: 'chat',
    duration: 8000,
    title: 'Real-Time Chat',
    caption: 'Messages, reactions, and typing indicators sync instantly — no refresh needed.',
    narration:
      "Let's start with chat. Every message you send goes out instantly over a live socket connection — " +
      "no refreshing, no delay. You get typing indicators, emoji reactions, threaded replies, and read receipts, " +
      "so conversations feel as fast as texting.",
    render: () => <ChatPreview />,
  },
  {
    id: 'call',
    duration: 7000,
    title: 'HD Video Calling',
    caption: 'Jump on a call straight from any channel or DM with one click.',
    narration:
      "Need to talk face to face? Click the video icon on any direct message or channel and NexusChat " +
      "starts a peer-to-peer video call right in the browser — no plugins, no downloads. Mute, toggle your camera, " +
      "or end the call, all from one clean control bar.",
    render: () => <CallSlideMockup />,
  },
  {
    id: 'tasks',
    duration: 7000,
    title: 'Kanban Task Boards',
    caption: 'Drag tasks across To Do, In Progress, and Done to keep everyone aligned.',
    narration:
      "Every workspace also gets its own Kanban board. Create a task, assign it to a teammate, set a priority " +
      "and due date, then just drag it across To Do, In Progress, and Done as work moves forward.",
    render: () => <TaskSlideMockup />,
  },
  {
    id: 'search',
    duration: 7000,
    title: 'Search Everything',
    caption: 'Find any message, file, or teammate across your entire workspace instantly.',
    narration:
      "And when you need to find something — a message, a shared file, or a teammate — the search bar " +
      "looks across your entire workspace and surfaces results instantly.",
    render: () => <SearchSlideMockup />,
  },
  {
    id: 'outro',
    duration: 6000,
    title: 'Ready when you are',
    caption: 'Create your workspace in seconds and start collaborating today.',
    narration:
      "That's NexusChat — real-time chat, video calls, and task management in one place. " +
      "Creating your workspace takes about thirty seconds and it's completely free to get started. " +
      "Let's go build something together.",
    render: () => <TitleSlideMockup subtitle="Free to get started. No credit card required." />,
  },
];

/**
 * Inline product-tour section for the bottom of the landing page. Rather
 * than a click-to-open modal, this autoplays as soon as it scrolls into
 * view (and pauses again once scrolled past), like a native video embed.
 *
 * Drop a real recording at `client/public/demo.mp4` and it plays that file
 * (muted-autoplay, same in-view behavior) instead of the animated tour.
 */
export default function DemoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.5, margin: '0px 0px -10% 0px' });

  const [hasRealVideo, setHasRealVideo] = useState<boolean | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showScript, setShowScript] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  const playing = inView && !manuallyPaused;

  // Probe for a real video file once, on mount. Dev servers (and some static
  // hosts) return 200 + index.html for unknown paths instead of a 404, so we
  // also verify the response is actually a video before trusting it.
  useEffect(() => {
    let cancelled = false;
    fetch(REAL_VIDEO_SRC, { method: 'HEAD' })
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        const isVideo = res.ok && contentType.startsWith('video/');
        if (!cancelled) setHasRealVideo(isVideo);
      })
      .catch(() => !cancelled && setHasRealVideo(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Play/pause the real <video> element to match in-view + manual state.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !hasRealVideo) return;
    if (playing) {
      el.play().catch(() => {
        /* autoplay may be blocked until user interacts — ignore */
      });
    } else {
      el.pause();
    }
  }, [playing, hasRealVideo]);

  // Drive the story-style progress bar / auto-advance for the animated tour.
  useEffect(() => {
    if (hasRealVideo || !playing) {
      clearInterval(tickRef.current);
      return;
    }
    const duration = slides[slideIndex].duration;
    const stepMs = 50;
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (stepMs / duration) * 100;
        if (next >= 100) {
          setSlideIndex((i) => (i + 1) % slides.length);
          return 0;
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(tickRef.current);
  }, [hasRealVideo, playing, slideIndex]);

  const goTo = (index: number) => {
    const clamped = (index + slides.length) % slides.length;
    setSlideIndex(clamped);
    setProgress(0);
  };

  return (
    <section id="demo" className="bg-void px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-4xl text-center"
      >
        <span className="glass mb-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-indigo-300">
          <Sparkles size={14} /> See it in action
        </span>
        <h2 className="text-3xl font-black md:text-5xl">Take a 45-second tour</h2>
        <p className="mt-3 text-text-secondary">
          This plays automatically as you scroll — no clicking required.
        </p>
      </motion.div>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        className="glass mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl shadow-glow-lg"
      >
        {hasRealVideo ? (
          // ---------- Real recorded video, if present ----------
          <video
            ref={videoRef}
            src={REAL_VIDEO_SRC}
            loop
            muted={muted}
            playsInline
            onError={() => setHasRealVideo(false)}
            className="aspect-video w-full bg-black"
          />
        ) : (
          // ---------- Animated narrated feature tour ----------
          <div className="relative aspect-video w-full bg-gradient-to-br from-bg-dark via-void to-bg-dark p-6">
            {/* Story-style progress bars */}
            <div className="mb-4 flex gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/15"
                  aria-label={`Go to slide ${i + 1}`}
                >
                  <div
                    className="h-full bg-gradient-brand"
                    style={{
                      width: i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%',
                      transition: i === slideIndex ? 'none' : 'width 0.2s',
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Slide content */}
            <div className="flex h-[calc(100%-3.5rem)] items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slides[slideIndex].id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="flex w-full flex-col items-center gap-4 text-center"
                >
                  <div className="flex w-full items-center justify-center">
                    {slides[slideIndex].render()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      {slides[slideIndex].title}
                    </h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
                      {slides[slideIndex].caption}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3">
              <button
                onClick={() => goTo(slideIndex - 1)}
                className="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setManuallyPaused((p) => !p)}
                className="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => setMuted((m) => !m)}
                className="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={() => goTo(slideIndex + 1)}
                className="rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setShowScript((s) => !s)}
                className={`rounded-full p-2 text-white transition ${
                  showScript ? 'bg-indigo-500' : 'bg-black/40 hover:bg-black/60'
                }`}
                aria-label="Toggle narration script"
                title="Show narration script (for recording a voiceover)"
              >
                <FileText size={16} />
              </button>
            </div>

            {/* Teleprompter: current narration line, for reading aloud while recording */}
            <AnimatePresence>
              {showScript && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="absolute inset-x-4 bottom-16 rounded-xl border border-indigo-500/40 bg-black/80 p-4 backdrop-blur-md"
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                    Narrator script — scene {slideIndex + 1} of {slides.length}
                  </p>
                  <p className="text-sm leading-relaxed text-white">
                    {slides[slideIndex].narration}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <p className="text-sm font-semibold text-text-primary">NexusChat — Product Tour</p>
          <a href="/register" className="btn-primary px-4 py-1.5 text-sm">
            <Plus size={14} /> Try it yourself
          </a>
        </div>
      </motion.div>
    </section>
  );
}
