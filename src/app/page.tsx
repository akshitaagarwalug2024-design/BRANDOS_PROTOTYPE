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
const workflow = [
  {
    icon: Lightbulb,
    title: "Start with an idea",
    description:
      "A rough thought, a clear brief, or a collection of footage. There’s more than one way in.",
  },
  {
    icon: Upload,
    title: "Bring your content",
    description:
      "Add videos, photos, and audio. Keep your moments together in a reusable media library.",
  },
  {
    icon: ScanLine,
    title: "Find your story",
    description:
      "Explore hooks and story directions. Choose a plan before getting into the details.",
  },
  {
    icon: WandSparkles,
    title: "Make it yours",
    description:
      "Refine your scenes with a simple editor. Open advanced controls whenever you need them.",
  },
  {
    icon: ArrowUpRight,
    title: "Get ready to share",
    description:
      "Bring your video, cover, caption, and hashtags together in one editable post package.",
  },
];
export default function Home() {
  return (
    <div className="launch">
      <header className="launch-header">
        <Link href="/" className="brand-logo" aria-label="BRANDOS home">
          <span className="brand-symbol">
            b<span />
          </span>
          BRANDOS<span className="brand-beta">STUDIO</span>
        </Link>
        <nav aria-label="Website navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#workspace">The workspace</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="row">
          <Link className="login-link" href="/auth">
            Sign in
          </Link>
          <Link className="btn btn-primary" href="/studio">
            Enter the studio <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main>
        <section className="launch-hero">
          <div className="launch-hero-copy">
            <span className="section-kicker">
              <span /> YOUR CONTENT. MOVING FORWARD.
            </span>
            <h1>
              From raw content
              <br />
              to <span>ready-to-post.</span>
            </h1>
            <p>
              All the moments. None of the overwhelm.
              <br />
              Turn your videos, photos, and ideas into a story you’re excited to
              share.
            </p>
            <div className="row wrap">
              <Link href="/studio" className="btn btn-primary btn-lg">
                Create Your First Post <ArrowRight size={18} />
              </Link>
              <a href="#interactive-demo" className="btn btn-outline btn-lg">
                <Play size={15} /> See How It Works
              </a>
            </div>
            <div className="launch-assurance">
              <Check size={15} /> No editing experience needed <span /> No
              account required to explore
            </div>
          </div>
          <div className="launch-hero-visual">
            <div className="visual-topline">
              <span>
                <span className="live-dot" /> A STORY IN THE MAKING
              </span>
              <span>01 / 03</span>
            </div>
            <div className="story-frame">
              <img
                src="/media/morning.svg"
                alt="An illustrated coffee scene from the original sample collection"
              />
              <div className="story-frame-top">
                <span>THE EVERYDAY SERIES</span>
                <span>9:16</span>
              </div>
              <div className="story-frame-copy">
                <span>MAKE SOMETHING OUT OF</span>
                <strong>
                  the little
                  <br />
                  things.
                </strong>
                <span>DEMO COLLECTION / CREATIVE LIFE</span>
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
                <span>From a collection to a connected story</span>
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
              <Sparkles size={16} /> Your next story is already in there.
            </span>
          </div>
        </section>
        <section className="launch-formats">
          <span>ONE WORKFLOW. EVERY KIND OF CREATOR.</span>
          <div>
            <b>Instagram Reels</b>
            <Sparkles size={17} aria-hidden="true" />
            <b>YouTube Shorts</b>
            <Sparkles size={17} aria-hidden="true" />
            <b>TikToks</b>
            <Sparkles size={17} aria-hidden="true" />
            <b>Your next idea</b>
          </div>
        </section>
        <section id="how-it-works" className="launch-section">
          <div className="launch-section-heading">
            <div>
              <span className="section-kicker">
                THE PROCESS, WITHOUT THE GUESSWORK
              </span>
              <h2>
                One clear path.
                <br />A lot more possibility.
              </h2>
            </div>
            <p>
              From that first “what if” to the finishing touches.
              <br />
              Always know what comes next.
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
              <span className="section-kicker">
                A SMALL IDEA. A COMPLETE JOURNEY.
              </span>
              <h2>Meet your new creative flow.</h2>
            </div>
            <span className="badge">INTERACTIVE DEMO</span>
          </div>
          <ProductDemo />
        </section>
        <section id="workspace" className="launch-section">
          <div className="launch-section-heading">
            <div>
              <span className="section-kicker">MORE THAN A TIMELINE</span>
              <h2>
                The whole process.
                <br />
                In your corner.
              </h2>
            </div>
            <p>
              You shouldn’t need five different tools
              <br />
              to make one good post.
            </p>
          </div>
          <div className="capability-grid">
            <article>
              <span className="capability-icon blue">
                <Layers size={25} />
              </span>
              <h3>One collection. More stories.</h3>
              <p>
                Keep your content organized, reuse your favorite moments, and
                explore new angles from what you already have.
              </p>
              <Link href="/studio/media">
                Open the media library <ArrowUpRight size={16} />
              </Link>
            </article>
            <article>
              <span className="capability-icon apricot">
                <Lightbulb size={25} />
              </span>
              <h3>Get past the blank page.</h3>
              <p>
                Find a starting point with suggested hooks, storytelling
                formats, and a plan that gives your idea a direction.
              </p>
              <Link href="/studio/ideas">
                Explore content ideas <ArrowUpRight size={16} />
              </Link>
            </article>
            <article>
              <span className="capability-icon lilac">
                <MousePointer2 size={25} />
              </span>
              <h3>Simple first. Control when you need it.</h3>
              <p>
                A guided workspace for beginners. Scene order, timing, overlays,
                and audio controls for the details that matter.
              </p>
              <Link href="/studio/create">
                Try the creation flow <ArrowUpRight size={16} />
              </Link>
            </article>
          </div>
        </section>
        <section className="launch-pricing">
          <div>
            <span className="section-kicker">YOUR CREATIVE SPACE IS OPEN</span>
            <h2>
              Start making.
              <br />
              See where it goes.
            </h2>
            <p>
              Explore the complete prototype for free. No trial countdown, no
              credit card, no subscription created.
            </p>
            <Link href="/studio" className="btn btn-primary btn-lg">
              Make your first post <ArrowRight size={18} />
            </Link>
          </div>
          <article>
            <div className="row between">
              <h3>The prototype studio</h3>
              <span className="badge">FREE TO EXPLORE</span>
            </div>
            <ul>
              {[
                "Guided five-step creation workflow",
                "Your own footage or a sample collection",
                "Simple and advanced editing controls",
                "Real browser-rendered video exports",
                "Editable captions, covers, and post packages",
              ].map((text) => (
                <li key={text}>
                  <Check size={17} />
                  {text}
                </li>
              ))}
            </ul>
            <p>
              AI suggestions use labeled demo templates. Cloud accounts are
              optional. Social publishing and paid plans are not connected.
            </p>
          </article>
        </section>
        <section id="questions" className="launch-questions">
          <span className="section-kicker">A FEW THINGS, CLEARED UP</span>
          <h2>Before you jump in.</h2>
          {[
            [
              "Do I need editing experience?",
              "No. Follow the five-step flow, approve a story direction, and adjust the parts you want. Advanced controls are there when you’re ready.",
            ],
            [
              "What does Demo Mode actually do?",
              "It provides template-based story plans and rule-based revisions. It does not analyze footage or call an AI model. The source editor and browser video exports work with your real files.",
            ],
            [
              "Can I upload my own videos?",
              "Yes. Add videos, photos, or audio files up to 100 MB each. Your media stays in this browser using IndexedDB.",
            ],
            [
              "Where is my work saved?",
              "Projects and preferences save on this device. This fresh version uses separate storage from the previous BRANDOS app. Export workspace metadata in Settings and keep your original files.",
            ],
            [
              "Can I publish directly to social platforms?",
              "No platform integration is connected. Export your post package and publish manually. Calendar dates are reminders, not scheduled posts.",
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
          <span className="section-kicker">
            LESS WAITING FOR THE PERFECT MOMENT
          </span>
          <h2>
            You’ve already got
            <br />
            <span>something worth sharing.</span>
          </h2>
          <Link href="/studio" className="btn btn-primary btn-lg">
            Let’s make it happen <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="launch-footer">
        <Link className="brand-logo" href="/">
          <span className="brand-symbol">
            b<span />
          </span>
          BRANDOS
        </Link>
        <p>A workspace for ideas that deserve to go somewhere.</p>
        <span>CREATE AT YOUR OWN PACE.</span>
      </footer>
    </div>
  );
}
function PlusMark() {
  return <span aria-hidden="true">+</span>;
}
