"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListChecks,
  Plus,
  Send,
} from "lucide-react";
import { Button } from "./ui/button";
import { Thumbnail } from "./media";
import type { Project, State, Status } from "@/lib/model";
const statuses: Status[] = [
  "Draft",
  "In Progress",
  "Needs Review",
  "In Human Review",
  "Ready to Publish",
  "Published",
];
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const pretty = (date: string) =>
  new Date(`${date}T12:00`).toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
const slug = (s: string) => s.replaceAll(" ", "-").toLowerCase();
export default function Publishing({
  state,
  update,
  open,
  create,
  notify,
}: {
  state: State;
  update: (p: Project) => void;
  open: (id: string) => void;
  create: (idea?: string, sample?: boolean, date?: string) => void;
  notify: (s: string) => void;
}) {
  const today = iso(new Date());
  const [view, setView] = useState("Calendar"),
    [month, setMonth] = useState(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }),
    [selected, setSelected] = useState(today);
  const on = (date: string) => state.projects.filter((p) => p.date === date);
  const overdue = (p: Project) =>
    Boolean(p.date) && p.date < today && p.status !== "Published";
  const setStatus = (p: Project, status: string) => {
    if (
      status === "Published" &&
      !confirm(
        "Have you published this post yourself? UnStuck has no connected social integration.",
      )
    )
      return;
    update({ ...p, status: status as Status });
    notify(
      status === "Published"
        ? "Recorded as manually published."
        : "Status updated.",
    );
  };
  const row = (p: Project) => (
    <div key={p.id} className="pub-row">
      <Thumbnail media={state.media.find((m) => m.id === p.mediaIds[0])} />
      <div>
        <b>{p.title}</b>
        <small>
          {p.platform}
          {overdue(p) ? " · Overdue" : ""}
        </small>
      </div>
      <input
        type="date"
        aria-label={`Date for ${p.title}`}
        value={p.date}
        onChange={(e) => update({ ...p, date: e.target.value })}
      />
      <select
        aria-label={`Status of ${p.title}`}
        value={p.status}
        onChange={(e) => setStatus(p, e.target.value)}
      >
        {statuses.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <Button variant="ghost" size="sm" onClick={() => open(p.id)}>
        Open <ArrowUpRight size={14} />
      </Button>
    </div>
  );
  // Calendar cells: Monday-first, padded to whole weeks.
  const first = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((first + days) / 7) * 7 },
    (_, i) =>
      i < first || i >= first + days
        ? ""
        : iso(new Date(month.getFullYear(), month.getMonth(), i - first + 1)),
  );
  const shift = (n: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const week = iso(new Date(Date.now() + 7 * 864e5));
  const groups: [string, Project[]][] = [
    ["Overdue", state.projects.filter(overdue)],
    [
      "Due in the next 7 days",
      state.projects.filter(
        (p) => p.date >= today && p.date <= week && p.status !== "Published",
      ),
    ],
    [
      "Later",
      state.projects.filter((p) => p.date > week && p.status !== "Published"),
    ],
    [
      "No date yet",
      state.projects.filter((p) => !p.date && p.status !== "Published"),
    ],
    ["Published", state.projects.filter((p) => p.status === "Published")],
  ];
  const undated = state.projects.filter((p) => !p.date);
  return (
    <>
      <div className="filter-row pub-toolbar">
        {view === "Calendar" ? (
          <div className="row cal-nav">
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => shift(-1)}
            >
              <ChevronLeft size={17} />
            </button>
            <h2 aria-live="polite">
              {month.toLocaleDateString([], { month: "long", year: "numeric" })}
            </h2>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() => shift(1)}
            >
              <ChevronRight size={17} />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const d = new Date();
                setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(today);
              }}
            >
              Today
            </Button>
          </div>
        ) : (
          <h2>
            {view === "Schedule" ? "What’s due, soonest first" : "All posts"}
          </h2>
        )}
        <div className="segmented" role="group" aria-label="View">
          {(
            [
              ["Calendar", CalendarDays],
              ["Schedule", ListChecks],
              ["Content", LayoutGrid],
            ] as const
          ).map(([name, Icon]) => (
            <button
              key={name}
              className={view === name ? "active" : ""}
              aria-pressed={view === name}
              onClick={() => setView(name)}
            >
              <Icon size={14} /> {name}
            </button>
          ))}
        </div>
      </div>
      {view === "Calendar" && (
        <div className="cal-layout">
          <div className="cal">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="cal-head">
                {d}
              </span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={i} className="cal-cell blank" />;
              const posts = on(date);
              return (
                <button
                  key={date}
                  className={`cal-cell ${date === today ? "today" : ""} ${date === selected ? "selected" : ""}`}
                  aria-label={`${pretty(date)}, ${posts.length} post${posts.length === 1 ? "" : "s"}`}
                  aria-pressed={date === selected}
                  onClick={() => setSelected(date)}
                >
                  <span className="cal-day">{Number(date.slice(8))}</span>
                  {posts.slice(0, 2).map((p) => (
                    <span
                      key={p.id}
                      className={`cal-chip st-${slug(p.status)} ${overdue(p) ? "late" : ""}`}
                    >
                      {p.title}
                    </span>
                  ))}
                  {posts.length > 2 && (
                    <span className="cal-more">+{posts.length - 2} more</span>
                  )}
                  {posts.length > 0 && (
                    <span className="cal-pop" aria-hidden="true">
                      {posts.map((p) => (
                        <span key={p.id}>
                          <b>{p.title}</b>
                          {p.status === "Published"
                            ? "Published"
                            : overdue(p)
                              ? `Overdue · ${p.status}`
                              : `To publish · ${p.status}`}{" "}
                          · {p.platform}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <aside className="card cal-detail" aria-live="polite">
            <span className="eyebrow">
              {selected === today
                ? "TODAY"
                : selected < today
                  ? "PAST"
                  : "UPCOMING"}
            </span>
            <h3>{pretty(selected)}</h3>
            {on(selected).length === 0 && (
              <p className="muted">Nothing planned for this day.</p>
            )}
            {on(selected).map((p) => (
              <div key={p.id} className="cal-post">
                <Thumbnail
                  media={state.media.find((m) => m.id === p.mediaIds[0])}
                />
                <div>
                  <b>{p.title}</b>
                  <small>
                    {p.platform} ·{" "}
                    {p.status === "Published"
                      ? "Published"
                      : overdue(p)
                        ? "Overdue"
                        : "To publish"}
                  </small>
                  <p>{p.caption.split("\n")[0]}</p>
                  <select
                    aria-label={`Status of ${p.title}`}
                    value={p.status}
                    onChange={(e) => setStatus(p, e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <div className="row wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => open(p.id)}
                    >
                      Open & export <ArrowUpRight size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => update({ ...p, date: "" })}
                    >
                      Unschedule
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="cal-add">
              {undated.length > 0 && (
                <select
                  aria-label="Schedule an existing post on this day"
                  value=""
                  onChange={(e) => {
                    const p = undated.find((p) => p.id === e.target.value);
                    if (p) update({ ...p, date: selected });
                  }}
                >
                  <option value="">Schedule an existing post here…</option>
                  {undated.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
              <Button size="sm" onClick={() => create("", false, selected)}>
                <Plus size={14} /> Make a new post for this day
              </Button>
            </div>
          </aside>
        </div>
      )}
      {view === "Schedule" &&
        groups
          .filter(([, list]) => list.length)
          .map(([label, list]) => (
            <section key={label} className="pub-group">
              <h3>
                {label} <span className="count">{list.length}</span>
              </h3>
              {[...list].sort((a, b) => a.date.localeCompare(b.date)).map(row)}
            </section>
          ))}
      {view === "Content" && (
        <div className="publishing-grid">
          {state.projects.map((p) => (
            <article key={p.id} className="card publishing-card">
              <button onClick={() => open(p.id)} className="publishing-open">
                <Thumbnail
                  media={state.media.find((m) => m.id === p.mediaIds[0])}
                />
                <div>
                  <span className="eyebrow">
                    {p.platform} · {p.date || "no date"}
                  </span>
                  <h3>{p.title}</h3>
                  <span className="status">{p.status}</span>
                </div>
                <ArrowUpRight size={18} />
              </button>
              <p>{p.caption}</p>
            </article>
          ))}
        </div>
      )}
      {!state.projects.length && (
        <div className="empty">
          <Send />
          <h2>No posts yet</h2>
          <p>Make a post and it will show up here.</p>
        </div>
      )}
      <p className="notice pub-note">
        <Send size={15} /> No publishing integration is connected. Dates are
        reminders — export your post and publish it yourself, then mark it
        Published.
      </p>
    </>
  );
}
