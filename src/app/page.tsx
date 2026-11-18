import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Film,
  Layers,
  Lightbulb,
  MousePointer2,
  Play,
  ScanLine,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { ProductDemo } from "@/components/product-demo";
import { plans } from "@/lib/model";
const workflow = [
  {
    icon: Upload,
    title: "Capture",
    description:
      "Log what the business is doing with a short video, a voice note, a line of text, or existing footage.",
  },
  {
    icon: ScanLine,
    title: "Understand",
    description:
      "UnStuck keeps your brand kit, goals and an indexed library of everything you have captured.",
  },
  {
    icon: Lightbulb,
    title: "Ideate",
    description:
      "Get post ideas matched to footage you already have, with nothing to fill in first.",
  },
  {
    icon: WandSparkles,
    title: "Create",
    description:
      "A finished short-form video is assembled for you, with captions, music and your branding.",
  },
  {
    icon: ArrowUpRight,
    title: "Stay consistent",
    description:
      "Review, edit and approve each post, then plan it on a content calendar.",
  },
];
export default function Home() {
  return (
    <div className="launch">
      <header className="launch-header">
        <Link href="/" className="brand-logo" aria-label="UnStuck home">
          <span className="brand-symbol">
            u<span />
          </span>
          UnStuck
        </Link>
        <nav aria-label="Website navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#workspace">Product</a>
          <a href="#pricing">Pricing</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="row">
          <Link className="btn btn-primary" href="/auth">
            Sign in / Log in <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main>
        <section className="launch-hero">
          <div className="launch-hero-copy">
            <span className="section-kicker">
              <span /> CONTENT PRODUCTION FOR SMALL BUSINESSES AND AGENCIES
            </span>
            <h1>
              Turn everyday business activity into{" "}
              <span>ready-to-post short videos.</span>
            </h1>
            <p>
              UnStuck turns your team’s footage, updates and expertise into
              consistent, on-brand social posts, without the time or cost of a
              dedicated content team.
            </p>
            <div className="row wrap">
              <Link href="/studio" className="btn btn-primary btn-lg">
                Create your first post <ArrowRight size={18} />
              </Link>
              <a href="#interactive-demo" className="btn btn-outline btn-lg">
                <Play size={15} /> See how it works
              </a>
            </div>
            <div className="launch-assurance">
              <Check size={15} /> No editing experience needed <span /> No
              account required to try it
            </div>
          </div>
          <div className="launch-hero-visual">
            <div className="visual-topline">
              <span>
                <span className="live-dot" /> SAMPLE PROJECT
              </span>
              <span>01 / 03</span>
            </div>
            <div className="story-frame">
              <img
                src="/media/morning.svg"
                alt="Illustrated cafe scene from the sample footage"
              />
              <div className="story-frame-top">
                <span>INSTAGRAM REELS</span>
                <span>9:16</span>
              </div>
              <div className="story-frame-copy">
                <span>BEHIND THE SCENES</span>
                <strong>
                  A morning
                  <br />
                  at the studio.
                </strong>
                <span>SAMPLE FOOTAGE</span>
              </div>
              <Link
                href="/studio/create?id=sample-project"
                aria-label="Open the sample project"
                className="story-play"
              >
                <Play size={21} fill="currentColor" />
              </Link>
            </div>
            <div className="visual-timeline">
              <div>
                <Film size={15} />
                <span>Three clips assembled into one post</span>
                <b>00:15</b>
              </div>
              <div className="visual-tracks">
                {["morning", "grow", "made"].map((name, i) => (
                  <span key={name}>
                    <img src={`/media/${name}.svg`} alt="" />
                    <b>0{i + 1}</b>
                  </span>
                ))}
              </div>
            </div>
            <span className="visual-note">
              <Sparkles size={16} /> Edited, captioned and branded
              automatically.
            </span>
          </div>
        </section>
        <section className="launch-formats">
          <span>ONE WORKFLOW FOR EVERY CHANNEL</span>
          <div>
            <b>Instagram</b>
            <Sparkles size={17} aria-hidden="true" />
            <b>LinkedIn</b>
            <Sparkles size={17} aria-hidden="true" />
            <b>Facebook</b>
            <Sparkles size={17} aria-hidden="true" />
            <b>YouTube Shorts</b>
          </div>
        </section>
        <section id="how-it-works" className="launch-section">
          <div className="launch-section-heading">
            <div>
              <span className="section-kicker">HOW IT WORKS</span>
              <h2>From a daily update to a published post.</h2>
            </div>
            <p>
              Content creation fits around the work you already do, instead of
              becoming another job.
            </p>
          </div>
          <div className="launch-workflow">
            {workflow.map((step, i) => (
              <article key={step.title}>
                <div>
                  <step.icon size={22} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="demo-section" id="interactive-demo">
          <div className="launch-section-heading">
            <div>
              <span className="section-kicker">PRODUCT WALKTHROUGH</span>
              <h2>See the workflow, step by step.</h2>
            </div>
            <span className="badge">INTERACTIVE DEMO</span>
          </div>
          <ProductDemo />
        </section>
        <section id="workspace" className="launch-section">
          <div className="launch-section-heading">
            <div>
              <span className="section-kicker">THE PRODUCT</span>
              <h2>One workspace instead of a content team.</h2>
            </div>
            <p>
              Capture, planning, editing and scheduling in one place, with you
              approving every post.
            </p>
          </div>
          <div className="capability-grid">
            <article>
              <span className="capability-icon blue">
                <Layers size={25} />
              </span>
              <h3>An indexed footage library</h3>
              <p>
                Every clip and photo is filed, tagged and searchable, so
                existing material is reused instead of forgotten.
              </p>
              <Link href="/studio/media">
                Open the media library <ArrowUpRight size={16} />
              </Link>
            </article>
            <article>
              <span className="capability-icon apricot">
                <Lightbulb size={25} />
              </span>
              <h3>Ideas matched to your footage</h3>
              <p>
                Post ideas come from your journal, industry and library, and
                show which of your clips fit each one.
              </p>
              <Link href="/studio/ideas">
                View content ideas <ArrowUpRight size={16} />
              </Link>
            </article>
            <article>
              <span className="capability-icon lilac">
                <MousePointer2 size={25} />
              </span>
              <h3>Finished videos, fully editable</h3>
              <p>
                Start from a complete edit in your brand style. Adjust scenes,
                text, music and colour only where you need to.
              </p>
              <Link href="/studio/create">
                Try the editor <ArrowUpRight size={16} />
              </Link>
            </article>
          </div>
        </section>
        <section id="pricing" className="launch-section">
          <div className="launch-section-heading">
            <div>
              <span className="section-kicker">PRICING</span>
              <h2>Three plans, priced per workspace.</h2>
            </div>
            <p>
              Placeholder prices for the prototype. Every plan is free to try
              and no payment is taken.
            </p>
          </div>
          <div className="plan-grid">
            {(Object.keys(plans) as (keyof typeof plans)[]).map((name) => (
              <article key={name} className={name === "Pro" ? "featured" : ""}>
                <h3>{name}</h3>
                <p className="plan-price">
                  {plans[name].price} <small>per month</small>
                </p>
                <ul>
                  {plans[name].points.map((point) => (
                    <li key={point}>
                      <Check size={16} />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href="/studio" className="btn btn-outline">
                  Try {name}
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section id="questions" className="launch-questions">
          <span className="section-kicker">FREQUENTLY ASKED</span>
          <h2>Questions</h2>
          {[
            [
              "Do we need a marketing team or editing experience?",
              "No. UnStuck builds a complete first edit for you. Your team reviews it and changes only what it wants to.",
            ],
            [
              "What does Demo Mode mean?",
              "Ideas and edits are built from templates and simple rules. The prototype does not analyse footage or call an AI model, and the dashboard shows sample analytics. The editor and video exports work with your real files.",
            ],
            [
              "Can we use our own footage?",
              "Yes. Add videos, photos or audio up to 100 MB each, or record directly in the journal.",
            ],
            [
              "Where is our data stored?",
              "Projects, journal entries and media are stored in this browser on this device. You can export a backup, or sign in to back up workspace details to the cloud.",
            ],
            [
              "Can UnStuck publish to our social accounts?",
              "Not yet. Export the video and caption, publish them yourself, and record the post as published on the calendar.",
            ],
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <PlusMark />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </section>
        <section className="launch-final">
          <span className="section-kicker">GET STARTED</span>
          <h2>
            A consistent online presence,
            <br />
            <span>without a dedicated content team.</span>
          </h2>
          <Link href="/studio" className="btn btn-primary btn-lg">
            Open the studio <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="launch-footer">
        <Link className="brand-logo" href="/">
          <span className="brand-symbol">
            u<span />
          </span>
          UnStuck
        </Link>
        <p>Content production for small businesses and agencies.</p>
        <span>PROTOTYPE</span>
      </footer>
    </div>
  );
}
function PlusMark() {
  return <span aria-hidden="true">+</span>;
}
