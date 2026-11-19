"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw, Save, WandSparkles } from "lucide-react";
import { Button } from "./ui/button";
import { suggestIdeas, type State } from "@/lib/model";
import { matchFootage } from "@/lib/library";
import { Thumbnail } from "./media";
import { trending } from "@/lib/insights";
type Popular = {
  popular: { topic: string; why: string; angle: string }[];
  grounded?: boolean;
  sources?: { uri: string; title: string }[];
};
export default function Ideas({
  state,
  save,
  create,
  go,
}: {
  state: State;
  save: (s: string) => void;
  create: (s?: string) => void;
  go: (route: string) => void;
}) {
  const [topic, setTopic] = useState(""),
    [shuffle, setShuffle] = useState(0);
  const ideas = suggestIdeas(state, topic, shuffle);
  // What is popular this week, fetched once a day per industry.
  const [now, setNow] = useState<Popular | null>(null);
  const niche = state.profile.niche,
    goal = state.goal.metric;
  useEffect(() => {
    const key = `popular|${new Date().toDateString()}|${niche}|${goal}`;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) return setNow(JSON.parse(saved));
    } catch {}
    void fetch(
      `/api/trends?popular=1&niche=${encodeURIComponent(niche)}&goal=${encodeURIComponent(goal)}`,
    )
      .then((r) => r.json())
      .then((data: Popular) => {
        setNow(data);
        try {
          if (data.popular.length)
            sessionStorage.setItem(key, JSON.stringify(data));
        } catch {}
      })
      .catch(() => setNow({ popular: [] }));
  }, [niche, goal]);
  const sample = (trending[niche] || trending["Retail & products"]).map(
    ([name, rise]) => ({
      topic: name,
      why: `Up ${rise}% on last week in ${niche.toLowerCase()} (sample figure).`,
      angle: `Make your own version of “${name.toLowerCase()}” with footage from your business.`,
    }),
  );
  const live = Boolean(now?.popular.length);
  return (
    <>
      <div className="filter-row ideas-toolbar">
        <input
          aria-label="Topic (optional)"
          placeholder="Optional: narrow to a topic, e.g. Building a small creative business"
          maxLength={120}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <Button variant="outline" onClick={() => setShuffle(shuffle + 1)}>
          <RefreshCw size={15} /> Show different ideas
        </Button>
        <span className="badge">DEMO SUGGESTIONS</span>
      </div>
      <p className="muted ideas-basis">
        Nothing to fill in — these come from your niche, library and{" "}
        <button className="text-link" onClick={() => go("")}>
          journal
        </button>
        . More journal entries produce more specific ideas.
      </p>
      <section className="card popular">
        <div className="row between wrap">
          <div>
            <span className="eyebrow">POPULAR RIGHT NOW</span>
            <h3>
              What people are watching this week, and how {niche.toLowerCase()}{" "}
              could use it
            </h3>
          </div>
          <span className="badge">
            {!now
              ? "LOADING"
              : !live
                ? "SAMPLE DATA"
                : now.grounded
                  ? "FROM A WEB SEARCH TODAY"
                  : "AI SUGGESTIONS · NOT VERIFIED LIVE"}
          </span>
        </div>
        <div className="popular-list">
          {(live ? now!.popular : sample).map((x) => (
            <div key={x.topic}>
              <b>{x.topic}</b>
              <small>{x.why}</small>
              <p>{x.angle}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => create(x.topic)}
              >
                <WandSparkles size={14} /> Make this post
              </Button>
            </div>
          ))}
        </div>
        {live && now!.sources && now!.sources.length > 0 && (
          <small className="muted">
            Sources:{" "}
            {now!.sources.map((src, i) => (
              <a key={src.uri} href={src.uri} target="_blank" rel="noreferrer">
                {i ? ", " : ""}
                {src.title}
              </a>
            ))}
          </small>
        )}
        {!live && now && (
          <small className="muted">
            Live trends need the AI connection. These are sample topics for your
            industry.
          </small>
        )}
      </section>
      <div className="ideas-grid">
        {ideas.map((idea) => (
          <article key={idea.title} className="card">
            <span className="eyebrow">
              {idea.format} · from {idea.source}
            </span>
            <h3>{idea.title}</h3>
            <blockquote>“{idea.hook}”</blockquote>
            <p className="muted">{idea.why}</p>
            {(() => {
              const fit = matchFootage(idea.title, state.media).filter(
                (m) => m.score >= 10,
              );
              return fit.length ? (
                <div className="idea-footage">
                  {fit.slice(0, 3).map((m) => (
                    <Thumbnail key={m.media.id} media={m.media} />
                  ))}
                  <small>
                    {fit.length} matching clip{fit.length === 1 ? "" : "s"} in
                    your library · {fit[0].why}
                  </small>
                </div>
              ) : (
                <small className="idea-footage none">
                  No matching footage yet. UnStuck will use your most recent
                  clips, or you can record it in the journal.
                </small>
              );
            })()}
            <div className="row between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => save(idea.title)}
              >
                <Save size={14} />
                {state.ideas.includes(idea.title) ? "Saved" : "Save idea"}
              </Button>
              <Button size="sm" onClick={() => create(idea.title)}>
                <WandSparkles size={14} /> Make this post
              </Button>
            </div>
          </article>
        ))}
      </div>
      {state.ideas.length > 0 && (
        <section className="card saved-ideas">
          <h3>Saved ideas</h3>
          {state.ideas.map((idea) => (
            <div key={idea} className="row between">
              <span>{idea}</span>
              <Button variant="ghost" size="sm" onClick={() => create(idea)}>
                Make this post <ArrowUpRight size={14} />
              </Button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
