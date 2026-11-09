"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Film,
  ImageIcon,
  Lightbulb,
  Play,
  Send,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
const demos = [
  {
    label: "Idea",
    title: "Start with something small.",
    description:
      "“I want to share the small rituals that make my mornings more creative.”",
    note: "An idea is enough to start. You can work out the rest as you go.",
    icon: Lightbulb,
  },
  {
    label: "Upload",
    title: "Bring the moments together.",
    description: "A coffee ritual. A little room to grow. A work in progress.",
    note: "Three original sample assets. One collection, ready to reuse.",
    icon: Upload,
  },
  {
    label: "Plan",
    title: "Find a direction that feels right.",
    description:
      "Hook → morning ritual → creative process → a question for your audience.",
    note: "Demo story structure · template suggestion, not footage analysis.",
    icon: Sparkles,
  },
  {
    label: "Refine",
    title: "A few thoughtful adjustments.",
    description:
      "“Use a faster editing style.” Adjust the scene lengths, text, and aspect ratio.",
    note: "The full studio includes editable scenes and rule-based demo revisions.",
    icon: WandSparkles,
  },
  {
    label: "Post package",
    title: "All the finishing touches.",
    description:
      "A video, a cover, a caption, and hashtags. Ready for your final review.",
    note: "The full studio exports real WebM drafts and editable post packages.",
    icon: Send,
  },
];
export function ProductDemo() {
  const [step, setStep] = useState(0);
  const current = demos[step];
  return (
    <div className="product-demo">
      <div
        className="demo-navigation"
        role="tablist"
        aria-label="Explore the creation workflow"
      >
        {demos.map((d, i) => (
          <button
            id={`demo-tab-${i}`}
            aria-controls="demo-panel"
            role="tab"
            aria-selected={step === i}
            tabIndex={step === i ? 0 : -1}
            onKeyDown={(event) => {
              const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
              if (!keys.includes(event.key)) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 4
                    : (i + (event.key === "ArrowRight" ? 1 : 4)) % 5;
              setStep(next);
              document.getElementById(`demo-tab-${next}`)?.focus();
            }}
            key={d.label}
            className={step === i ? "active" : ""}
            onClick={() => setStep(i)}
          >
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            {d.label}
          </button>
        ))}
      </div>
      <div
        id="demo-panel"
        role="tabpanel"
        aria-labelledby={`demo-tab-${step}`}
        className="demo-panel"
      >
        <div className="demo-panel-copy">
          <span className="section-kicker">STEP 0{step + 1} / 05</span>
          <h3>{current.title}</h3>
          <p>{current.description}</p>
          <small>
            <current.icon size={16} />
            {current.note}
          </small>
          <div className="row">
            <button
              className="btn btn-outline"
              onClick={() => setStep((step + 1) % 5)}
            >
              {step === 4 ? "Replay the flow" : "Next step"}{" "}
              <ArrowRight size={15} />
            </button>
            <Link href="/studio/create?id=sample-project" className="text-link">
              Try it for yourself <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className={`demo-panel-visual demo-step-${step}`}>
          {step === 0 ? (
            <div className="demo-brief">
              <span>
                <Lightbulb size={18} /> THE BRIEF
              </span>
              <h4>
                Small rituals.
                <br />
                More creativity.
              </h4>
              <div className="row">
                <span>Instagram Reels</span>
                <span>Warm & authentic</span>
              </div>
              <span className="brief-cursor" />
            </div>
          ) : step === 1 ? (
            <div className="demo-upload-grid">
              {["morning", "grow", "made"].map((m, i) => (
                <div key={m}>
                  <img
                    src={`/media/${m}.svg`}
                    alt={`Sample ${m} illustration`}
                  />
                  <span>
                    <CheckCircle2 size={13} /> Scene 0{i + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : step === 2 ? (
            <div className="demo-plan">
              <span>
                <Sparkles size={16} /> DEMO STORY DIRECTION
              </span>
              <h4>
                A day in your
                <br />
                creative rhythm.
              </h4>
              {[
                "Open with a small ritual",
                "Show the creative process",
                "Invite a little curiosity",
              ].map((text, i) => (
                <div key={text}>
                  <b>0{i + 1}</b>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          ) : step === 3 ? (
            <div className="demo-edit">
              <div>
                <img src="/media/morning.svg" alt="Coffee sample preview" />
                <span>A different kind of morning.</span>
                <Play size={22} />
              </div>
              <div className="demo-mini-timeline">
                {[5, 4, 6].map((n, i) => (
                  <span key={i} style={{ flex: n }}>
                    0{i + 1}
                    <b>{n}s</b>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="demo-package">
              <span className="package-tick">
                <Check size={28} />
              </span>
              <h4>One complete story.</h4>
              {[
                [Film, "Video draft"],
                [ImageIcon, "Cover image"],
                [Send, "Caption & hashtags"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Film;
                return (
                  <div key={String(label)}>
                    <I size={18} />
                    <span>{String(label)}</span>
                    <Check size={15} />
                  </div>
                );
              })}
              <small>Preview package · open the studio to export</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
