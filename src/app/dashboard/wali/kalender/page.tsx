"use client";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { EventType } from "@/lib/types";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const EVENT_CONFIG: Record<EventType, { label: string; color: string; bg: string }> = {
  libur_nasional: { label: "Libur Nasional", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  libur_sekolah:  { label: "Libur Sekolah",  color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  ujian:          { label: "Ujian",           color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
  kegiatan:       { label: "Kegiatan",        color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  rapat:          { label: "Rapat",           color: "#10b981", bg: "rgba(16,185,129,0.15)" },
};

export default function KalenderAkademikPage() {
  const { events } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = monthStart.getDay();
  const paddedDays = [
    ...Array(startPad).fill(null),
    ...calDays,
  ];

  const getEventsForDay = (day: Date) =>
    events.filter(e => {
      const d = new Date(day.toISOString().split("T")[0]);
      return d >= new Date(e.startDate) && d <= new Date(e.endDate);
    });

  const sortedEvents = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="animate-fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Kalender Akademik</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Jadwal, ujian, libur, dan kegiatan sekolah.</p>
        </div>
      </div>

      <div className="calendar-layout">
        {/* Calendar */}
        <div className="glass-card" style={{ padding: 24 }}>
          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--text-primary)" }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
            </div>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--text-primary)" }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            <div style={{ minWidth: 500 }}>
              {/* Day headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4, marginBottom: 8 }}>
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", padding: "4px 0" }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4 }}>
                {paddedDays.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />;
                  const dayEvents = getEventsForDay(day);
                  const isCurrentDay = isToday(day);
                  return (
                    <div key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      style={{ minHeight: 64, padding: 6, borderRadius: 8, cursor: "pointer",
                        background: isCurrentDay ? "rgba(99,102,241,0.15)" : selectedDay && isSameDay(day, selectedDay) ? "var(--bg-glass)" : "transparent",
                        border: isCurrentDay ? "1px solid var(--accent-primary)" : "1px solid transparent",
                        transition: "all 0.15s" }}
                      onMouseEnter={e => { if (!isCurrentDay) e.currentTarget.style.background = "var(--bg-glass)"; }}
                      onMouseLeave={e => { if (!isCurrentDay && !(selectedDay && isSameDay(day, selectedDay))) e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ fontSize: 13, fontWeight: isCurrentDay ? 800 : 500, color: isCurrentDay ? "var(--accent-primary)" : "var(--text-secondary)", marginBottom: 4 }}>
                        {day.getDate()}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {dayEvents.slice(0, 2).map(ev => (
                          <div key={ev.id} style={{ fontSize: 9, fontWeight: 600, padding: "1px 4px", borderRadius: 3,
                            background: EVENT_CONFIG[ev.type].bg, color: EVENT_CONFIG[ev.type].color,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>+{dayEvents.length - 2} lagi</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.color }} />
                <span style={{ color: "var(--text-muted)" }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Selected day events */}
          {selectedDay && (
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--accent-primary)" }}>
                {format(selectedDay, "EEEE, dd MMMM", { locale: idLocale })}
              </div>
              {getEventsForDay(selectedDay).length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>Tidak ada event</div>
              ) : (
                getEventsForDay(selectedDay).map(ev => (
                  <div key={ev.id} style={{ padding: "10px 12px", borderRadius: 8,
                    background: EVENT_CONFIG[ev.type].bg, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: EVENT_CONFIG[ev.type].color }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{ev.description}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Semua Event</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sortedEvents.map(ev => (
                <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                  background: "var(--bg-glass)", borderRadius: 10, position: "relative" }}>
                  <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: EVENT_CONFIG[ev.type].color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {format(new Date(ev.startDate), "dd MMM", { locale: idLocale })}
                      {ev.startDate !== ev.endDate && ` – ${format(new Date(ev.endDate), "dd MMM yyyy", { locale: idLocale })}`}
                    </div>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10,
                      background: EVENT_CONFIG[ev.type].bg, color: EVENT_CONFIG[ev.type].color }}>
                      {EVENT_CONFIG[ev.type].label}
                    </span>
                  </div>
                </div>
              ))}
              {sortedEvents.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "16px 0" }}>Belum ada event</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
