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
    label: "Capture",
    title: "Log what happened today.",
    description:
      "“Packed 40 orders this morning and tested the new gift box.” A note, a voice memo or a short clip is enough.",
    note: "Entries are saved to the journal and the footage library.",
    icon: Lightbulb,
  },
  {
    label: "Understand",
    title: "Your footage, indexed.",
    description:
      "Each file is filed with its folder, tags, shape, length and the note it was captured with.",
    note: "Indexing uses file properties and your notes, not footage analysis.",
    icon: Upload,
  },
  {
    label: "Ideate",
    title: "Ideas matched to what you have.",
    description:
      "Behind the scenes: packing orders → 3 matching clips in your library.",
    note: "Demo suggestions built from templates, your journal and your industry.",
    icon: Sparkles,
  },
  {
    label: "Create",
    title: "A finished edit, ready to review.",
    description:
      "Scenes, captions, music and your brand colours are applied. Change anything beside a live preview.",
    note: "Every element of the edit stays editable.",
    icon: WandSparkles,
  },
  {
    label: "Publish",
    title: "Approve it and put it on the calendar.",
    description:
      "Video, cover, caption and hashtags are packaged together and scheduled.",
    note: "Exports are real video files. Publishing to platforms is manual.",
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
              {step === 4 ? "Start again" : "Next step"}{" "}
              <ArrowRight size={15} />
            </button>
            <Link href="/studio/create?id=sample-project" className="text-link">
              Open the sample project <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className={`demo-panel-visual demo-step-${step}`}>
          {step === 0 ? (
            <div className="demo-brief">
              <span>
                <Lightbulb size={18} /> TODAY’S ENTRY
              </span>
              <h4>
                Packing orders,
                <br />
                behind the scenes.
              </h4>
              <div className="row">
                <span>Instagram Reels</span>
                <span>Professional & clear</span>
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
                <Sparkles size={16} /> SUGGESTED POST
              </span>
              <h4>
                How an order
                <br />
                gets packed.
              </h4>
              {[
                "Open on the finished product",
                "Show the packing process",
                "Close with how to order",
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
                <span>Every order is packed by hand.</span>
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
              <h4>Post package ready.</h4>
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
