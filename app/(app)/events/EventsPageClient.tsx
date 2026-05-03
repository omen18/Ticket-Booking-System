"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  MapPin, Calendar, ArrowRight, Search, X, ChevronLeft, ChevronRight,
  Film, Music2, Theater, Laugh, Flame, Star, Clock, Users, Zap,
  TrendingUp, Bell, Heart, Play, Ticket, Trophy,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";

type EventItem = {
  event_id: number;
  event_name: string;
  event_date: string;
  price?: number;
  venue?: { venue_name: string; location: string };
  category?: { category_name: string };
  organizer?: { name: string };
  artists?: { artist_name: string; genre: string }[];
};

// ── Static coming-soon enrichment data (events NOT yet in DB) ────────────────
const COMING_SOON = [
  { id: "cs1", title: "Pushpa 3 – The Reckoning",      date: "2027-01-15", label: "Jan 2027", gradient: "from-[#7c2d12] via-[#c2410c] to-[#ea580c]",   tag: "Action · Telugu/Hindi",    badge: "Upcoming",     interested: 41200 },
  { id: "cs2", title: "KGF Chapter 3",                  date: "2027-02-20", label: "Feb 2027", gradient: "from-[#78350f] via-[#b45309] to-[#d97706]",   tag: "Action · Kannada/Hindi",   badge: "Upcoming",     interested: 63400 },
  { id: "cs3", title: "IPL Finals 2027",                date: "2027-05-20", label: "May 2027", gradient: "from-[#14532d] via-[#15803d] to-[#4ade80]",   tag: "Sports · Cricket",         badge: "Notify Me",    interested: 112000},
  { id: "cs4", title: "Ed Sheeran India Tour 2027",     date: "2027-03-08", label: "Mar 2027", gradient: "from-[#1e1b4b] via-[#4c1d95] to-[#7c3aed]",  tag: "Music · Live Concert",     badge: "Tickets Soon", interested: 95600 },
  { id: "cs5", title: "India vs Pakistan World Cup 2027",date: "2027-06-12", label: "Jun 2027", gradient: "from-[#0c4a6e] via-[#0369a1] to-[#38bdf8]", tag: "Sports · Cricket",         badge: "Notify Me",    interested: 180000},
  { id: "cs6", title: "Avatar 3",                       date: "2027-04-18", label: "Apr 2027", gradient: "from-[#0f172a] via-[#1e3a5f] to-[#0369a1]",  tag: "Sci-Fi · English/Hindi",   badge: "Upcoming",     interested: 78300 },
];

// ── Category icon map — keys match exact DB category_name values ─────────────
const CAT_META: Record<string, { icon: React.ElementType; gradient: string; bg: string }> = {
  Movie:        { icon: Film,       gradient: "from-[#1a1a2e] to-[#0f3460]",    bg: "#1a1a2e" },
  Concert:      { icon: Music2,     gradient: "from-[#2d1b69] to-[#38ef7d]",    bg: "#2d1b69" },
  Music:        { icon: Music2,     gradient: "from-[#2d1b69] to-[#38ef7d]",    bg: "#2d1b69" },
  Theatre:      { icon: Theater,    gradient: "from-[#4a1942] to-[#d7816a]",    bg: "#4a1942" },
  "Comedy Show":{ icon: Laugh,      gradient: "from-[#854d0e] to-[#ffd200]",    bg: "#854d0e" },
  Comedy:       { icon: Laugh,      gradient: "from-[#854d0e] to-[#ffd200]",    bg: "#854d0e" },
  Festival:     { icon: Zap,        gradient: "from-[#134e5e] to-[#71b280]",    bg: "#134e5e" },
  Sports:       { icon: Trophy,     gradient: "from-[#1d4350] to-[#a43931]",    bg: "#1d4350" },
  Event:        { icon: Ticket,     gradient: "from-[#312e81] to-[#7c3aed]",    bg: "#312e81" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

function fmtCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

function seedRating(id: number) {
  return (3.8 + (id % 12) * 0.1).toFixed(1);
}

function seedSeats(id: number) {
  const pct = 30 + (id * 17) % 55;
  return pct;
}

// ── HeroSlider ────────────────────────────────────────────────────────────────
function HeroSlider({ events }: { events: EventItem[] }) {
  const featured = events.slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || featured.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [paused, featured.length]);

  const cur = featured[idx];
  if (!cur) return null;

  const cat = cur.category?.category_name ?? "Event";
  const meta = CAT_META[cat] ?? CAT_META.Event;
  const days = daysUntil(cur.event_date);

  return (
    <div
      className="relative h-[420px] md:h-[480px] w-full overflow-hidden rounded-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={cur.event_id}
          className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Noise overlay */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          {/* Bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Radial ambient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-8 md:px-12 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div key={`content-${cur.event_id}`}
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Tags row */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/90 backdrop-blur-sm border border-white/20">
                {cat.toUpperCase()}
              </span>
              {days > 0 && days <= 14 && (
                <span className="flex items-center gap-1 rounded-full bg-[#ef4444]/80 px-3 py-1 text-[11px] font-bold text-white">
                  <Flame size={10} /> {days === 1 ? "Tomorrow!" : `${days} days left`}
                </span>
              )}
              {days <= 0 && (
                <span className="rounded-full bg-[#16a34a]/80 px-3 py-1 text-[11px] font-bold text-white">On Now</span>
              )}
            </div>

            {/* Title */}
            <h2 className="font-syne text-3xl md:text-5xl font-extrabold text-white leading-tight mb-2 max-w-2xl drop-shadow-lg">
              {cur.event_name}
            </h2>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-white/75 text-sm mb-5">
              {cur.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-white/60" />
                  {cur.venue.venue_name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-white/60" />
                {formatDate(cur.event_date)}
              </span>
              {cur.artists && cur.artists.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={13} className="text-yellow-400" />
                  {cur.artists.map((a) => a.artist_name).join(", ")}
                </span>
              )}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link href={`/events/${cur.event_id}`}>
                <motion.button
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[var(--accent-dark)] shadow-lg"
                  whileHover={{ scale: 1.04, boxShadow: "0 0 0 4px rgba(255,255,255,0.25)" }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Ticket size={15} />
                  Book Tickets
                </motion.button>
              </Link>
              <motion.button
                className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm"
                whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.96 }}
              >
                <Play size={14} fill="white" />
                Trailer
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-5 right-6 z-20 flex items-center gap-1.5">
        {featured.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setIdx(i)}
            animate={{ width: i === idx ? 24 : 6, backgroundColor: i === idx ? "#ffffff" : "rgba(255,255,255,0.4)" }}
            transition={{ duration: 0.3 }}
            className="h-1.5 rounded-full"
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      {featured.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + featured.length) % featured.length)}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % featured.length)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

// ── CategoryQuickNav ──────────────────────────────────────────────────────────
function CategoryQuickNav({ active, onChange }: { active: string; onChange: (c: string) => void }) {
  const cats = ["All", "Movie", "Concert", "Sports", "Comedy Show", "Theatre", "Festival"];
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide px-4 sm:px-0">
      {cats.map((cat) => {
        const meta = CAT_META[cat];
        const Icon = meta?.icon;
        const isActive = active === cat;
        return (
          <motion.button
            key={cat}
            onClick={() => onChange(cat)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.94 }}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <motion.div
              animate={{
                background: isActive ? `linear-gradient(135deg, ${meta?.bg ?? "#127ba3"}, ${meta?.bg ?? "#127ba3"}cc)` : "transparent",
                borderColor: isActive ? "transparent" : "var(--border)",
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-white shadow-sm"
              transition={{ duration: 0.2 }}
            >
              {Icon ? (
                <Icon size={22} style={{ color: isActive ? "white" : meta?.bg ?? "var(--accent)" }} />
              ) : (
                <Ticket size={22} className={isActive ? "text-white" : "text-[var(--accent)]"} />
              )}
            </motion.div>
            <span className={`text-[11px] font-medium ${isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>
              {cat}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── HorizontalRow (shared scroll container) ──────────────────────────────────
function HorizontalRow({ children, title, subtitle, seeAllHref }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  seeAllHref?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between px-4 sm:px-0">
        <div>
          <h3 className="font-syne text-xl font-bold text-[var(--accent-dark)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll("left")} className="rounded-full border border-[var(--border)] bg-white p-1.5 shadow-sm hover:bg-[var(--bg-primary)] transition-colors">
            <ChevronLeft size={14} className="text-[var(--text-secondary)]" />
          </button>
          <button onClick={() => scroll("right")} className="rounded-full border border-[var(--border)] bg-white p-1.5 shadow-sm hover:bg-[var(--bg-primary)] transition-colors">
            <ChevronRight size={14} className="text-[var(--text-secondary)]" />
          </button>
          {seeAllHref && (
            <Link href={seeAllHref} className="ml-1 flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline">
              See all <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 px-4 sm:px-0 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </div>
  );
}

// ── EventPosterCard (portrait, BookMyShow style) ──────────────────────────────
function EventPosterCard({ event, index }: { event: EventItem; index: number }) {
  const cat = event.category?.category_name ?? "Event";
  const meta = CAT_META[cat] ?? CAT_META.Event;
  const days = daysUntil(event.event_date);
  const seatsLeft = seedSeats(event.event_id);
  const rating = seedRating(event.event_id);

  return (
    <Link href={`/events/${event.event_id}`}>
      <motion.div
        className="group relative shrink-0 w-[155px] cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        whileHover={{ y: -4 }}
      >
        {/* Poster */}
        <div className={`relative h-[220px] w-full overflow-hidden rounded-xl bg-gradient-to-br ${meta.gradient}`}>
          {/* Texture */}
          <div className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { const Icon = meta.icon; return <Icon size={48} className="text-white/20 group-hover:text-white/35 transition-colors duration-300" />; })()}
          </div>

          {/* Top tags */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
            {days <= 7 && days > 0 && (
              <span className="rounded-md bg-[#ef4444] px-1.5 py-0.5 text-[9px] font-bold text-white">
                {days}D LEFT
              </span>
            )}
            {days <= 0 && (
              <span className="rounded-md bg-[#16a34a] px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>
            )}
            <span className="ml-auto flex items-center gap-0.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
              <Star size={8} fill="currentColor" /> {rating}
            </span>
          </div>

          {/* Seat availability bar */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="flex items-center justify-between text-[9px] text-white/70 mb-1">
              <span>{seatsLeft}% filled</span>
            </div>
            <div className="h-0.5 w-full rounded-full bg-white/20">
              <motion.div
                className="h-full rounded-full"
                style={{ background: seatsLeft > 70 ? "#ef4444" : seatsLeft > 40 ? "#f59e0b" : "#22c55e" }}
                initial={{ width: 0 }}
                animate={{ width: `${seatsLeft}%` }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Hover overlay */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors duration-200"
          >
            <motion.div
              className="rounded-full bg-white/90 p-2.5 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200"
            >
              <Ticket size={16} className="text-[var(--accent-dark)]" />
            </motion.div>
          </motion.div>
        </div>

        {/* Info below poster */}
        <div className="mt-2 px-0.5">
          <p className="text-[13px] font-bold text-[var(--accent-dark)] line-clamp-2 leading-tight group-hover:text-[var(--accent)] transition-colors">
            {event.event_name}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)] truncate">
            {event.venue?.location ?? "India"}
          </p>
          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
            <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-secondary)]">
              {cat}
            </span>
            {event.artists && event.artists[0] && (
              <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-secondary)] truncate max-w-[80px]">
                {event.artists[0].artist_name}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── ComingSoonCard ───────────────────────────────────────────────────────────
function ComingSoonCard({ item, index }: { item: typeof COMING_SOON[0]; index: number }) {
  const [interested, setInterested] = useState(false);
  const count = item.interested + (interested ? 1 : 0);

  return (
    <motion.div
      className="group relative shrink-0 w-[155px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      {/* Poster */}
      <div className={`relative h-[220px] w-full overflow-hidden rounded-xl bg-gradient-to-br ${item.gradient}`}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badge */}
        <div className="absolute top-2 left-2">
          <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold text-white ${
            item.badge === "Tickets Soon" ? "bg-[var(--accent)]" :
            item.badge === "Upcoming" ? "bg-[#7c3aed]" : "bg-[#0891b2]"
          }`}>
            {item.badge.toUpperCase()}
          </span>
        </div>

        {/* Date chip */}
        <div className="absolute top-2 right-2">
          <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-sm">
            {item.label}
          </span>
        </div>

        {/* Center: coming soon text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Clock size={32} className="text-white/20" />
          <span className="text-[10px] font-bold tracking-widest text-white/30">COMING SOON</span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="text-[13px] font-bold text-[var(--accent-dark)] line-clamp-2 leading-tight">
          {item.title}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{item.tag}</p>

        {/* Interested button */}
        <motion.button
          onClick={() => setInterested((v) => !v)}
          whileTap={{ scale: 0.9 }}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-semibold transition-colors ${
            interested
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          }`}
        >
          <Heart size={10} fill={interested ? "currentColor" : "none"} />
          {interested ? "Interested" : "Notify Me"}
          <span className="text-[9px] opacity-60">· {fmtCount(count)}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── LandscapeEventCard (for concerts/festivals) ───────────────────────────────
function LandscapeEventCard({ event, index }: { event: EventItem; index: number }) {
  const cat = event.category?.category_name ?? "Event";
  const meta = CAT_META[cat] ?? CAT_META.Event;
  const days = daysUntil(event.event_date);

  return (
    <Link href={`/events/${event.event_id}`}>
      <motion.div
        className="group relative shrink-0 w-[280px] overflow-hidden rounded-2xl cursor-pointer border border-[var(--border)] bg-white"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.07, duration: 0.4 }}
        whileHover={{ y: -3, boxShadow: "0 20px 48px rgba(18,123,163,0.14)" }}
      >
        {/* Banner */}
        <div className={`h-[120px] w-full bg-gradient-to-br ${meta.gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { const Icon = meta.icon; return <Icon size={40} className="text-white/15" />; })()}
          </div>
          {/* Category tag */}
          <div className="absolute bottom-2 left-3">
            <span className="rounded-full bg-white/20 border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {cat}
            </span>
          </div>
          {/* Days left */}
          {days > 0 && days <= 30 && (
            <div className="absolute top-2 right-2">
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-sm">
                {days}d away
              </span>
            </div>
          )}
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
            whileHover={{ translateX: "200%" }}
            transition={{ duration: 0.6 }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h4 className="font-bold text-sm text-[var(--accent-dark)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
            {event.event_name}
          </h4>
          <div className="mt-2 space-y-1 text-[12px] text-[var(--text-secondary)]">
            <p className="flex items-center gap-1.5">
              <MapPin size={11} className="text-[var(--accent)] shrink-0" />
              <span className="truncate">{event.venue?.venue_name}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Calendar size={11} className="text-[var(--accent)] shrink-0" />
              {formatDate(event.event_date)}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--accent)]">From ₹{event.price ?? 150}</span>
            <motion.span
              className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold text-white"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Book <ArrowRight size={10} />
            </motion.span>
          </div>
        </div>

        {/* Animated bottom line */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]"
          initial={{ width: "0%" }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </Link>
  );
}

// ── TrendingBadge ────────────────────────────────────────────────────────────
function TrendingBadge({ rank }: { rank: number }) {
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-extrabold text-white shadow-md">
      {rank}
    </div>
  );
}

// ── Full event grid card ──────────────────────────────────────────────────────
function GridEventCard({ event, index }: { event: EventItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 300, damping: 24 });
  const rotateY = useSpring(rawY, { stiffness: 300, damping: 24 });

  const cat = event.category?.category_name ?? "Event";
  const meta = CAT_META[cat] ?? CAT_META.Event;
  const seatsLeft = seedSeats(event.event_id);
  const rating = seedRating(event.event_id);
  const days = daysUntil(event.event_date);

  return (
    <Link href={`/events/${event.event_id}`}>
      <motion.div
        ref={cardRef}
        className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white cursor-pointer"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ y: -5, boxShadow: "0 28px 56px rgba(18,123,163,0.14)" }}
        onMouseMove={(e) => {
          const rect = cardRef.current!.getBoundingClientRect();
          rawY.set((e.clientX - rect.left - rect.width / 2) * 0.01);
          rawX.set(-(e.clientY - rect.top - rect.height / 2) * 0.01);
        }}
        onMouseLeave={() => { rawX.set(0); rawY.set(0); }}
      >
        {/* Banner */}
        <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${meta.gradient}`}>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            {(() => { const Icon = meta.icon; return <Icon size={52} className="text-white/15 group-hover:text-white/25 transition-colors duration-300" />; })()}
          </div>

          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/12 to-transparent"
            whileHover={{ translateX: "200%" }}
            transition={{ duration: 0.65 }}
          />

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="rounded-full bg-white/20 border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              {cat}
            </span>
            {days <= 7 && days > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-[#ef4444]/90 px-2 py-1 text-[10px] font-bold text-white">
                <Flame size={9} /> {days}d
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-bold text-yellow-400 backdrop-blur-sm">
            <Star size={9} fill="currentColor" /> {rating}
          </div>

          {/* Seat bar */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
            <div className="flex justify-between text-[9px] text-white/60 mb-1">
              <span className="flex items-center gap-1"><Users size={8} /> {seatsLeft}% filled</span>
              {seatsLeft > 80 && <span className="text-[#ef4444] font-bold">Almost full!</span>}
            </div>
            <div className="h-0.5 w-full rounded-full bg-white/20">
              <motion.div
                className="h-full rounded-full"
                style={{ background: seatsLeft > 70 ? "#ef4444" : seatsLeft > 40 ? "#f59e0b" : "#22c55e" }}
                initial={{ width: 0 }}
                animate={{ width: `${seatsLeft}%` }}
                transition={{ delay: 0.2 + index * 0.04, duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-bold text-[var(--accent-dark)] group-hover:text-[var(--accent)] transition-colors line-clamp-1 text-sm leading-snug">
              {event.event_name}
            </h2>
            {index < 3 && <TrendingBadge rank={index + 1} />}
          </div>

          <div className="space-y-1 text-[12px] text-[var(--text-secondary)]">
            <p className="flex items-center gap-1.5">
              <MapPin size={11} className="shrink-0 text-[var(--accent)]" />
              <span className="truncate">{event.venue?.venue_name}, {event.venue?.location}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Calendar size={11} className="shrink-0 text-[var(--accent)]" />
              {formatDate(event.event_date)}
            </p>
          </div>

          {event.artists && event.artists.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {event.artists.slice(0, 2).map((a) => (
                <span key={a.artist_name} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                  {a.artist_name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[var(--text-muted)]">From</span>
              <span className="ml-1 text-sm font-extrabold text-[var(--accent)]">₹{event.price ?? 150}</span>
            </div>
            <motion.span
              className="flex items-center gap-1 rounded-xl bg-[var(--accent)] px-3 py-2 text-[11px] font-bold text-white"
              whileHover={{ scale: 1.06, backgroundColor: "#0d6080" }}
              whileTap={{ scale: 0.94 }}
            >
              Book <ArrowRight size={11} />
            </motion.span>
          </div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]"
          initial={{ width: "0%" }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EventsPageClient({ events }: { events: EventItem[] }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(events.map((e) => e.venue?.location).filter(Boolean) as string[]))],
    [events],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "All" && e.category?.category_name !== filter) return false;
      if (city !== "All" && e.venue?.location !== city) return false;
      if (term) {
        const haystack = [e.event_name, e.venue?.venue_name, e.venue?.location, e.category?.category_name]
          .filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [events, filter, city, search]);

  const upcoming = useMemo(() => events.filter((e) => daysUntil(e.event_date) > 0).slice(0, 10), [events]);
  const concerts = useMemo(() => events.filter((e) => ["Concert", "Music", "Festival"].includes(e.category?.category_name ?? "")).slice(0, 8), [events]);
  const movies   = useMemo(() => events.filter((e) => e.category?.category_name === "Movie").slice(0, 8), [events]);
  const sports   = useMemo(() => events.filter((e) => e.category?.category_name === "Sports").slice(0, 6), [events]);
  const comedy   = useMemo(() => events.filter((e) => ["Comedy Show", "Comedy"].includes(e.category?.category_name ?? "")).slice(0, 6), [events]);

  const showGrid = search || filter !== "All" || city !== "All";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      {/* ── Hero Slider ── */}
      <HeroSlider events={events} />

      {/* ── Page body ── */}
      <div className="mx-auto max-w-7xl px-0 sm:px-6 py-8 space-y-10">

        {/* ── City + Search bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row px-4 sm:px-0">
          {/* City select */}
          <div className="relative">
            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)]" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-white pl-8 pr-4 text-sm font-medium text-[var(--accent-dark)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/20 sm:w-44"
            >
              {cities.map((c) => (
                <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, artists, venues..."
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-white pl-9 pr-8 text-sm text-[var(--accent-dark)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent-dark)]">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Category quick nav ── */}
        <CategoryQuickNav active={filter} onChange={setFilter} />

        {/* ── Content: search/filter results OR default sections ── */}
        <AnimatePresence mode="wait">
          {showGrid ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="px-4 sm:px-0 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-syne text-xl font-bold text-[var(--accent-dark)]">
                    {filter !== "All" ? filter : "Search Results"}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} events found</p>
                </div>
                {(filter !== "All" || city !== "All" || search) && (
                  <button
                    onClick={() => { setFilter("All"); setCity("All"); setSearch(""); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                  <Ticket size={40} className="mx-auto mb-4 text-[var(--border)]" />
                  <p className="text-[var(--text-muted)]">No events match your filters.</p>
                </motion.div>
              ) : (
                <div className="grid gap-5 px-4 sm:px-0 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((event, i) => (
                    <GridEventCard key={event.event_id} event={event} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="sections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">

              {/* ── Now Showing ── */}
              {upcoming.length > 0 && (
                <HorizontalRow title="Now Showing & Upcoming" subtitle="Book before seats fill up">
                  {upcoming.map((e, i) => <EventPosterCard key={e.event_id} event={e} index={i} />)}
                </HorizontalRow>
              )}

              {/* ── Coming Soon ── */}
              <HorizontalRow title="Coming Soon" subtitle="Upcoming releases — express your interest early">
                {COMING_SOON.map((item, i) => <ComingSoonCard key={item.id} item={item} index={i} />)}
              </HorizontalRow>

              {/* ── Live Events & Concerts ── */}
              {concerts.length > 0 && (
                <HorizontalRow title="Live Events & Concerts" subtitle="Music, festivals, and more">
                  {concerts.map((e, i) => <LandscapeEventCard key={e.event_id} event={e} index={i} />)}
                </HorizontalRow>
              )}

              {/* ── Movies & Screenings ── */}
              {movies.length > 0 && (
                <HorizontalRow title="Movies & Special Screenings" subtitle="Cinema experiences near you">
                  {movies.map((e, i) => <EventPosterCard key={e.event_id} event={e} index={i} />)}
                </HorizontalRow>
              )}

              {/* ── Sports ── */}
              {sports.length > 0 && (
                <HorizontalRow title="Sports & Stadium Events" subtitle="Cricket, football, kabaddi and more">
                  {sports.map((e, i) => <LandscapeEventCard key={e.event_id} event={e} index={i} />)}
                </HorizontalRow>
              )}

              {/* ── Comedy ── */}
              {comedy.length > 0 && (
                <HorizontalRow title="Comedy Shows" subtitle="Laugh out loud with India's best stand-ups">
                  {comedy.map((e, i) => <LandscapeEventCard key={e.event_id} event={e} index={i} />)}
                </HorizontalRow>
              )}

              {/* ── Trending This Week banner ── */}
              <motion.div
                className="mx-4 sm:mx-0 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f3460] p-6 md:p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-yellow-400" />
                      <span className="font-mono text-[11px] tracking-widest text-yellow-400/80">TRENDING THIS WEEK</span>
                    </div>
                    <h3 className="font-syne text-2xl font-extrabold text-white mb-1">Don&apos;t miss out</h3>
                    <p className="text-sm text-white/60">Over 50,000 people booked tickets this week alone</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center min-w-[80px]">
                      <p className="text-2xl font-extrabold text-white">{events.length}+</p>
                      <p className="text-[10px] text-white/50 mt-0.5">Events</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center min-w-[80px]">
                      <p className="text-2xl font-extrabold text-white">9</p>
                      <p className="text-[10px] text-white/50 mt-0.5">Cities</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center min-w-[80px]">
                      <p className="text-2xl font-extrabold text-white">1L+</p>
                      <p className="text-[10px] text-white/50 mt-0.5">Booked</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Browse All Events ── */}
              <div className="px-4 sm:px-0">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h3 className="font-syne text-xl font-bold text-[var(--accent-dark)]">Browse All Events</h3>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">Showing all {events.length} events</p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((event, i) => (
                    <GridEventCard key={event.event_id} event={event} index={i} />
                  ))}
                </div>
              </div>

              {/* ── Quick Notification CTA ── */}
              <motion.div
                className="mx-4 sm:mx-0 rounded-2xl border border-[var(--border)] bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                    <Bell size={22} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--accent-dark)]">Never miss an event</p>
                    <p className="text-sm text-[var(--text-secondary)]">Get notified when tickets drop for your favourite artists</p>
                  </div>
                </div>
                <motion.button
                  className="shrink-0 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white"
                  whileHover={{ scale: 1.04, backgroundColor: "#0d6080" }}
                  whileTap={{ scale: 0.96 }}
                >
                  Enable Alerts
                </motion.button>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
