"use client";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock,
  Film,
  FolderOpen,
  Images,
  Lightbulb,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Thumbnail } from "./media";
import type { State, Project, Media } from "@/lib/model";
import { steps } from "@/lib/model";
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
export default function Dashboard({
  state,
  create,
  open,
  go,
}: {
  state: State;
  create: (idea?: string, sample?: boolean) => void;
  open: (id: string) => void;
  go: (s: string) => void;
}) {
  return (
    <>
      <section className="fresh-dash-hero">
        <div>
          <span className="section-kicker">
            YOUR NEXT GOOD IDEA STARTS HERE
          </span>
          <h2>
            Less overthinking.
            <br />
            <span>More creating.</span>
          </h2>
          <p>
            Bring your footage. Find your story.
            <br />
            Leave with something you’re ready to share.
          </p>
          <Button onClick={() => create()}>
            <Plus size={18} /> Create New Post
          </Button>
          <span className="dash-footnote">
            <Check size={14} /> Five steps. Your pace. Your creative direction.
          </span>
        </div>
        <div className="dash-hero-art">
          <div className="dash-art-label">
            <span className="live-dot" /> IN THE STUDIO <span>01 / 03</span>
          </div>
          <div className="dash-poster">
            <img
              src="/media/made.svg"
              alt="An illustrated design work in progress"
            />
            <div>
              <span>THE CREATIVE PROCESS</span>
              <strong>
                Make room
                <br />
                for your ideas.
              </strong>
            </div>
          </div>
          <div className="dash-stack">
            <img
              src="/media/morning.svg"
              alt="Coffee sample from your collection"
            />
            <span>the everyday edit.</span>
          </div>
          <span className="dash-art-sticker">
            <Sparkles size={15} /> A story is already in there.
          </span>
        </div>
      </section>
      <section className="stats-row" aria-label="Your workspace overview">
        {[
          [
            state.projects.length,
            "Projects in progress",
            FolderOpen,
            "projects",
          ],
          [state.media.length, "Files in your library", Images, "media"],
          [
            state.projects.filter((p) => p.status === "Ready to Publish")
              .length,
            "Ready to share",
            Send,
            "publishing",
          ],
        ].map(([n, label, Icon, dest]) => {
          const I = Icon as typeof FolderOpen;
          return (
            <button key={String(label)} onClick={() => go(String(dest))}>
              <span className="stat-icon">
                <I size={21} />
              </span>
              <div>
                <span>{String(label)}</span>
                <strong>{String(n).padStart(2, "0")}</strong>
              </div>
              <ArrowUpRight size={18} />
            </button>
          );
        })}
      </section>
      <section className="recent-section">
        <div className="section-heading compact">
          <div>
            <span className="section-kicker">YOUR WORK, IN MOTION</span>
            <h2>Pick up where you left off.</h2>
          </div>
          <button className="text-link" onClick={() => go("projects")}>
            All projects <ArrowRight size={16} />
          </button>
        </div>
        <div className="project-grid">
          {state.projects.slice(0, 3).map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              media={state.media}
              open={() => open(p.id)}
            />
          ))}
          <button className="new-project-card" onClick={() => create()}>
            <span>
              <Plus size={25} />
            </span>
            <h3>A fresh start.</h3>
            <p>Put your next idea in motion.</p>
            <b>
              Create a project <ArrowUpRight size={15} />
            </b>
          </button>
        </div>
      </section>
      <section className="fresh-discovery">
        <article className="discovery-feature">
          <span className="section-kicker">
            <Sparkles size={16} /> A DIFFERENT PERSPECTIVE
          </span>
          <h2>
            More stories.
            <br />
            Same collection.
          </h2>
          <p>
            Your next post might already be in your footage. Explore story
            directions using your collection’s names and tags.
          </p>
          <Button variant="outline" onClick={() => go("ideas?source=footage")}>
            Find posts in my footage <ArrowUpRight size={16} />
          </Button>
          <span className="discovery-demo">
            DEMO SUGGESTIONS · NO FOOTAGE ANALYSIS
          </span>
          <div className="discovery-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </article>
        <article className="fresh-templates">
          <div className="row between">
            <div>
              <span className="section-kicker">A HEAD START</span>
              <h3>Skip the blank page.</h3>
            </div>
            <Lightbulb size={23} />
          </div>
          {[
            ["Behind the scenes", "Let people into your process."],
            ["A day in the life", "Make a story out of the everyday."],
            ["Three things I learned", "Share something worth saving."],
          ].map(([title, description], i) => (
            <button key={title} onClick={() => create(title, true)}>
              <span className={`template-icon tint-${i}`}>
                <Film size={19} />
              </span>
              <span>
                <b>{title}</b>
                <small>{description}</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </article>
      </section>
      <section className="workspace-tip">
        <span>
          <Lightbulb size={17} />
        </span>
        <p>
          <b>A little consistency goes a long way.</b> Save your colors, voice,
          and creative defaults in your Brand Kit.
        </p>
        <button className="text-link" onClick={() => go("brand")}>
          Make it yours <ArrowRight size={15} />
        </button>
      </section>
    </>
  );
}
