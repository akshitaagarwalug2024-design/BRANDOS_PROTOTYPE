"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Lightbulb,
  PenLine,
  Target,
  TrendingUp,
  WandSparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Thumbnail } from "./media";
import type { State, Project, Media, Goal } from "@/lib/model";
import { steps } from "@/lib/model";
import {
  compact,
  competitors,
  metrics,
  reactions,
  trending,
  weeks,
} from "@/lib/insights";
export function ProjectCard({
  project: p,
  media,
  open,
}: {
  project: Project;
  media: Media[];
  open: () => void;
}) {
  return (
    <button className="project-card" onClick={open}>
      <div className="project-art">
        <Thumbnail
          media={media.find(
            (m) => m.id === (p.scenes[0]?.mediaId || p.mediaIds[0]),
          )}
        />
        <span
          className={`status status-${p.status.replaceAll(" ", "-").toLowerCase()}`}
        >
          {p.status}
        </span>
        <span className="project-platform">{p.platform}</span>
        <span className="project-open">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="project-info">
        <h3>{p.title}</h3>
        <div className="row between">
          <small>
            {steps[p.step]} ·{" "}
            {p.scenes.length
              ? p.scenes.reduce((n, s) => n + s.duration, 0) + " sec"
              : "New project"}
          </small>
          <span className="project-card-action">
            Continue <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}
function LineChart({ name }: { name: string }) {
  const { values, unit } = metrics[name];
  const [hover, setHover] = useState<number | null>(null);
  const W = 520,
    H = 190,
    L = 44,
    R = 46,
    T = 14,
    B = 26;
  const max = Math.max(...values) * 1.08,
    min = Math.min(...values) * 0.8;
  const x = (i: number) => L + (i * (W - L - R)) / (values.length - 1);
  const y = (v: number) => T + ((max - v) * (H - T - B)) / (max - min);
  const fmt = (v: number) => (unit ? `${v}${unit}` : compact(v));
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join("");
  const shown = hover ?? values.length - 1;
  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${name} over 8 weeks: ${values.map((v, i) => `${weeks[i]} ${fmt(v)}`).join(", ")}`}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((k) => {
          const v = min + (max - min) * k;
          return (
            <g key={k}>
              <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
              <text className="axis" x={L - 8} y={y(v) + 3} textAnchor="end">
                {fmt(Number(v.toFixed(unit ? 1 : 0)))}
              </text>
            </g>
          );
        })}
        {weeks.map((w, i) => (
          <text key={w} className="axis" x={x(i)} y={H - 6} textAnchor="middle">
            {w}
          </text>
        ))}
        <path
          className="area"
          d={`${line}L${x(values.length - 1)},${H - B}L${L},${H - B}Z`}
        />
        <path className="line" d={line} />
        {hover !== null && (
          <line
            className="cross"
            x1={x(hover)}
            x2={x(hover)}
            y1={T}
            y2={H - B}
          />
        )}
        <circle className="dot" cx={x(shown)} cy={y(values[shown])} r={5} />
        <text
          className="value"
          x={x(shown)}
          y={y(values[shown]) - 10}
          textAnchor={shown > values.length - 3 ? "end" : "middle"}
        >
          {fmt(values[shown])}
        </text>
        {values.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (W - L - R) / 14}
            y={0}
            width={(W - L - R) / 7}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
    </div>
  );
}
export default function Dashboard({
  state,
  create,
  open,
  go,
  setGoal,
}: {
  state: State;
  create: (idea?: string, sample?: boolean) => void;
  open: (id: string) => void;
  go: (s: string) => void;
  setGoal: (g: Goal) => void;
}) {
  const [metric, setMetric] = useState("Reach");
  const { goal } = state;
  const pct = Math.min(
    100,
    Math.round((goal.current / Math.max(1, goal.target)) * 100),
  );
  const left = Math.max(0, goal.target - goal.current);
  const pace = metrics["New followers"].values.at(-1)!;
  const series = metrics[metric].values;
  const change = Math.round((series.at(-1)! / series[0] - 1) * 100);
  const topEngagement = Math.max(...competitors.map((c) => c.engagement));
  const published = state.projects.filter((p) => p.status === "Published");
  const due = state.projects.filter(
    (p) => p.date && p.status !== "Published",
  ).length;
  return (
    <>
      <div className="dash-actions">
        <Button onClick={() => create()}>
          <WandSparkles size={16} /> Make a post for me
        </Button>
        <Button variant="outline" onClick={() => go("ideas")}>
          <Lightbulb size={16} /> Browse ideas
        </Button>
        <Button variant="outline" onClick={() => go("")}>
          <PenLine size={16} /> Add to my journal
        </Button>
        <span>
          {state.projects.length} in progress · {due} scheduled ·{" "}
          {published.length} published
        </span>
      </div>
      <p className="notice dash-sample">
        <b>Sample data.</b> No social account is connected in this prototype, so
        trends, competitors and reactions below are illustrative. Your goal
        numbers and projects are your own.
      </p>
      <div className="dash-grid">
        <section className="card dash-goal">
          <span className="eyebrow">
            <Target size={13} /> YOUR GOAL
          </span>
          <h2>
            {pct}% <small>of the way there</small>
          </h2>
          <div
            className="meter"
            role="progressbar"
            aria-label="Goal progress"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${pct}%` }} />
          </div>
          <p>
            <b>{goal.current.toLocaleString()}</b> of{" "}
            <b>{goal.target.toLocaleString()}</b> {goal.metric.toLowerCase()}
            {left > 0
              ? ` · ${left.toLocaleString()} to go — about ${Math.ceil(left / pace)} weeks at this week’s pace (+${pace}).`
              : " · Goal reached. Time to set a new one."}
          </p>
          <details>
            <summary>Change my goal</summary>
            <div className="goal-edit">
              <label>
                I’m growing
                <select
                  value={goal.metric}
                  onChange={(e) => setGoal({ ...goal, metric: e.target.value })}
                >
                  {["Followers", "Subscribers", "Monthly views"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label>
                Now
                <input
                  type="number"
                  min={0}
                  value={goal.current}
                  onChange={(e) =>
                    setGoal({
                      ...goal,
                      current: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
              <label>
                Target
                <input
                  type="number"
                  min={1}
                  value={goal.target}
                  onChange={(e) =>
                    setGoal({
                      ...goal,
                      target: Math.max(1, Number(e.target.value)),
                    })
                  }
                />
              </label>
            </div>
          </details>
        </section>
        <section className="card dash-trend">
          <div className="row between wrap">
            <span className="eyebrow">
              <TrendingUp size={13} /> TREND · LAST 8 WEEKS
            </span>
            <div className="segmented" role="group" aria-label="Metric">
              {Object.keys(metrics).map((m) => (
                <button
                  key={m}
                  className={metric === m ? "active" : ""}
                  aria-pressed={metric === m}
                  onClick={() => setMetric(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <h3>
            {metric} is {change >= 0 ? "up" : "down"} {Math.abs(change)}% since
            week 1
          </h3>
          <LineChart name={metric} />
          <p className="muted">{metrics[metric].note}</p>
        </section>
        <section className="card">
          <span className="eyebrow">YOU VS SIMILAR CREATORS</span>
          <h3>
            {competitors[0].engagement >= topEngagement
              ? "You lead on engagement"
              : "Your engagement beats 2 of 3 similar creators"}
          </h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Followers</th>
                <th>Posts / wk</th>
                <th>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.name} className={c.you ? "you" : ""}>
                  <td>{c.name}</td>
                  <td>{compact(c.you ? goal.current : c.followers)}</td>
                  <td>{c.perWeek}</td>
                  <td>
                    <span className="bar">
                      <i
                        style={{
                          width: `${(c.engagement / topEngagement) * 100}%`,
                        }}
                      />
                    </span>
                    {c.engagement}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            They post more often than you. One extra post a week would match
            @everyday.edit.
          </p>
        </section>
        <section className="card">
          <span className="eyebrow">HOW PEOPLE REACTED</span>
          <h3>Your last 3 posts</h3>
          {reactions.map((r) => (
            <div key={r.title} className="reaction">
              <div className="row between">
                <b>
                  {r.title} <small>{r.type}</small>
                </b>
                <span
                  className={`mood mood-${r.mood.split(" ")[0].toLowerCase()}`}
                >
                  {r.mood}
                </span>
              </div>
              <dl>
                {(
                  [
                    ["Views", r.views],
                    ["Likes", r.likes],
                    ["Comments", r.comments],
                    ["Saves", r.saves],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{compact(v)}</dd>
                  </div>
                ))}
              </dl>
              <p className="muted">{r.theme}</p>
            </div>
          ))}
        </section>
        <section className="card">
          <span className="eyebrow">
            TRENDING IN {state.profile.niche.toUpperCase()}
          </span>
          <h3>Topics rising this week</h3>
          {(
            trending[state.profile.niche] || trending["Lifestyle & everyday"]
          ).map(([topic, rise]) => (
            <div key={topic} className="trend-row">
              <span>
                <b>{topic}</b>
                <small>↑ {rise}% more posts than last week</small>
              </span>
              <Button size="sm" variant="outline" onClick={() => create(topic)}>
                Make this post
              </Button>
            </div>
          ))}
        </section>
        <section className="card dash-recent">
          <div className="row between">
            <span className="eyebrow">CONTINUE EDITING</span>
            <button className="text-link" onClick={() => go("projects")}>
              All projects <ArrowRight size={14} />
            </button>
          </div>
          {state.projects.slice(0, 4).map((p) => (
            <button
              key={p.id}
              className="recent-row"
              onClick={() => open(p.id)}
            >
              <Thumbnail
                media={state.media.find((m) => m.id === p.mediaIds[0])}
              />
              <span>
                <b>{p.title}</b>
                <small>
                  {p.status} · {p.platform}
                </small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
          {!state.projects.length && (
            <p className="muted">No posts yet. Make one above.</p>
          )}
        </section>
      </div>
    </>
  );
}
