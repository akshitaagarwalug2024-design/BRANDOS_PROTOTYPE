"use client";
import { useState } from "react";
import { ArrowUpRight, RefreshCw, Save, WandSparkles } from "lucide-react";
import { Button } from "./ui/button";
import { suggestIdeas, type State } from "@/lib/model";
import { matchFootage } from "@/lib/library";
import { Thumbnail } from "./media";
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
        . The more you journal, the more personal they get.
      </p>
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
                  No matching footage yet. BRANDOS will use your most recent
                  clips, or you can film it in your journal.
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
