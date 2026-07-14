import { Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Video,
  ClipboardList,
  Search,
  FolderOpen,
  Bell,
  Github,
  Mail,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';
import HeroScene from '../components/three/HeroScene';
import Navbar from '../components/landing/Navbar';
import ScrollProgress from '../components/landing/ScrollProgress';
import BackToTop from '../components/landing/BackToTop';
import ChatPreview from '../components/landing/ChatPreview';
import TiltCard from '../components/landing/TiltCard';
import CountUp from '../components/landing/CountUp';
import Testimonials from '../components/landing/Testimonials';
import DemoSection from '../components/landing/DemoSection';

const features = [
  {
    icon: Zap,
    emoji: '⚡',
    title: 'Real-Time Chat',
    desc: 'Instant messaging with typing indicators, reactions, and message threading.',
  },
  {
    icon: Video,
    emoji: '📹',
    title: 'Video Calling',
    desc: 'Crystal-clear HD video calls with screen sharing and call recording.',
  },
  {
    icon: ClipboardList,
    emoji: '📋',
    title: 'Task Management',
    desc: 'Kanban boards to track work, assign tasks, and hit your deadlines.',
  },
  {
    icon: Search,
    emoji: '🔍',
    title: 'Powerful Search',
    desc: 'Find any message, file, or task across all your workspaces instantly.',
  },
  {
    icon: FolderOpen,
    emoji: '📁',
    title: 'File Sharing',
    desc: 'Share images, documents, and files with instant preview and download.',
  },
  {
    icon: Bell,
    emoji: '🎯',
    title: 'Smart Notifications',
    desc: 'Never miss what matters with intelligent notification filtering.',
  },
];

const steps = [
  { n: '01', title: 'Create Workspace', desc: 'Set up your team space in 30 seconds.' },
  { n: '02', title: 'Invite Your Team', desc: 'Add members and organize into channels.' },
  { n: '03', title: 'Start Collaborating', desc: 'Chat, call, and manage tasks together.' },
];

const techBadges = [
  'React',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Socket.IO',
  'WebRTC',
  'Prisma',
  'TailwindCSS',
];

const stats = [
  { to: 50, suffix: 'ms', label: 'Median message latency' },
  { to: 100, suffix: '+', label: 'Concurrent users per call' },
  { to: 99, suffix: '.9%', label: 'Realtime uptime' },
  { to: 8, suffix: '', label: 'Core integrations built-in' },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  // Track cursor position for the hero spotlight glow.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div className="min-h-screen bg-void text-text-primary">
      <ScrollProgress />
      <Navbar />
      <BackToTop />

      {/* ---------- HERO ---------- */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="spotlight relative flex min-h-screen items-center overflow-hidden pt-20"
      >
        <div className="absolute inset-0">
          <Suspense fallback={<div className="h-full w-full bg-void" />}>
            <HeroScene />
          </Suspense>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-transparent to-void" />
        <div className="noise-overlay pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
          {/* Left: copy */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass mb-6 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-indigo-300"
            >
              <Sparkles size={14} /> Real-Time Team Collaboration
            </motion.span>

            <motion.h1
              variants={stagger}
              initial="hidden"
              animate="show"
              className="max-w-xl text-4xl font-black leading-tight md:text-6xl lg:text-7xl"
            >
              <motion.span variants={fadeUp} className="block">
                Connect Your Team,
              </motion.span>
              <motion.span variants={fadeUp} className="block">
                Supercharge Your
              </motion.span>
              <motion.span variants={fadeUp} className="block text-gradient">
                Workflow.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-6 max-w-lg text-text-secondary"
            >
              NexusChat brings real-time messaging, video calls, and task management into one
              beautiful workspace. Built for modern teams.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <Link to="/register" className="btn-primary animate-pulse-glow px-7 py-3 text-lg">
                Launch App
              </Link>
              <a href="#demo" className="btn-ghost px-7 py-3 text-lg">
                Watch Demo ↓
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              {['⚡ < 50ms latency', '🔒 End-to-end secure', '👥 100+ concurrent'].map((s, i) => (
                <span
                  key={s}
                  className="glass rounded-full px-3 py-1 text-xs text-text-secondary"
                  style={{ animation: `float 3s ease-in-out ${i * 0.4}s infinite` }}
                >
                  {s}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: live chat mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="hidden justify-self-center lg:flex"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <ChatPreview />
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-secondary"
        >
          <MousePointerClick size={22} />
        </motion.div>
      </section>

      {/* ---------- STATS STRIP ---------- */}
      <section className="border-y border-white/5 bg-bg-dark px-6 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-gradient md:text-4xl">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-text-secondary md:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="grid-bg relative bg-bg-dark px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black md:text-5xl">Everything your team needs</h2>
            <p className="mt-3 text-text-secondary">One platform. Infinite possibilities.</p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <TiltCard className="glass group h-full rounded-2xl p-6 transition hover:border-indigo-500/60 hover:shadow-glow">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/15 text-2xl transition group-hover:scale-110 group-hover:bg-indigo-500/25">
                    {f.emoji}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-text-primary">{f.title}</h3>
                  <p className="text-sm text-text-secondary">{f.desc}</p>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how-it-works" className="bg-void px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-3xl font-black md:text-5xl">How it works</h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="relative grid grid-cols-1 gap-10 md:grid-cols-3"
          >
            <div className="absolute left-0 right-0 top-8 hidden border-t-2 border-dashed border-indigo-500/30 md:block" />
            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center"
              >
                <div className="z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand text-xl font-black text-white shadow-glow transition hover:scale-110">
                  {s.n}
                </div>
                <h3 className="mb-1 text-lg font-bold">{s.title}</h3>
                <p className="max-w-xs text-sm text-text-secondary">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="bg-bg-dark px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black md:text-5xl">Loved by modern teams</h2>
          <p className="mt-3 text-text-secondary">Don't just take our word for it.</p>
        </div>
        <Testimonials />
      </section>

      {/* ---------- TECH SHOWCASE (marquee) ---------- */}
      <section id="tech" className="overflow-hidden bg-void px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-10 text-2xl font-bold text-text-secondary">
            Built with a modern, battle-tested stack
          </h2>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-void to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-void to-transparent" />
          <div className="marquee-track gap-4">
            {[...techBadges, ...techBadges].map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="glass mx-2 flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-medium text-text-primary transition hover:border-indigo-500/60 hover:shadow-glow"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PRODUCT DEMO (autoplays on scroll) ---------- */}
      <DemoSection />

      {/* ---------- CTA BANNER ---------- */}
      <section className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="animate-gradient mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 p-12 text-center shadow-glow-lg"
        >
          <h2 className="text-3xl font-black text-white md:text-4xl">
            Ready to transform how your team works?
          </h2>
          <p className="mt-3 text-white/80">Get started for free. No credit card required.</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-white px-8 py-3 font-bold text-void transition hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link to="/login" className="text-sm text-white/90 hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-indigo-500/20 bg-void px-6 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand font-black text-white">
                N
              </span>
              <span className="text-lg font-bold">NexusChat</span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              Where Teams Connect, Create, and Collaborate.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-text-primary">Links</span>
            <a href="#" className="text-text-secondary hover:text-white">
              Home
            </a>
            <a href="#features" className="text-text-secondary hover:text-white">
              Features
            </a>
            <a
              href="https://github.com/Viru876"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-white"
            >
              GitHub
            </a>
          </div>

          <div className="text-sm">
            <span className="font-semibold text-text-primary">Crafted by Virendra Singh</span>
            <p className="mt-1 text-text-secondary">IEC2024015 | IIIT Allahabad</p>
            <a
              href="https://github.com/Viru876"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-text-secondary hover:text-white"
            >
              <Github size={14} /> github.com/Viru876
            </a>
            <a
              href="mailto:shekhawatvirendrasingh876@gmail.com"
              className="flex items-center gap-1 text-text-secondary hover:text-white"
            >
              <Mail size={14} /> shekhawatvirendrasingh876@gmail.com
            </a>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-white/5 pt-6 text-center text-xs text-text-secondary">
          © 2025 NexusChat by Virendra Singh | MIT License
        </div>
      </footer>
    </div>
  );
}
