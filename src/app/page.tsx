import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Play,
  Check,
  Layers,
  WandSparkles,
  MousePointer2,
  Film,
} from "lucide-react";
export default function Home() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link className="wordmark" href="/">
          brandos<span>®</span>
        </Link>
        <div className="nav-links">
          <a href="#workflow">How it works</a>
          <a href="#possibilities">Why Brandos</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="row">
          <Link href="/auth" className="quiet-link">
            Sign in
          </Link>
          <Link href="/studio" className="btn btn-primary">
            Enter the studio <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="green-dot" /> YOUR IDEAS. A LITTLE MORE POSSIBLE.
            </span>
            <h1>
              From raw content
              <br />
              to <em>ready-to-post.</em>
            </h1>
            <p>
              More creating. Less figuring it all out.
              <br />
              Turn your videos, photos, and ideas into polished social content
              with a workflow that handles the hard part.
            </p>
            <div className="row wrap">
              <Link href="/studio" className="btn btn-primary btn-lg">
                Create Your First Post <ArrowUpRight size={18} />
              </Link>
              <a href="#workflow" className="btn btn-outline btn-lg">
                <Play size={15} /> See How It Works
              </a>
            </div>
            <div className="hero-note">
              <Check size={14} /> No editing experience needed <span>·</span>{" "}
              Explore without an account
            </div>
          </div>
          <div className="hero-art">
            <div className="art-grid" />
            <div className="float-note">
              <Sparkles size={18} />
              <div>
                A story is already in there.
                <small>Let’s help you find it.</small>
              </div>
            </div>
            <div className="photo-stack back">
              <img src="/media/grow.svg" alt="Botanical sample footage" />
            </div>
            <div className="photo-stack front">
              <img
                src="/media/morning.svg"
                alt="A crafted coffee scene from the demo collection"
              />
              <div className="reel-overlay">
                <span>THE EVERYDAY SERIES</span>
                <strong>
                  A slower kind
                  <br />
                  of morning.
                </strong>
                <small>Created in your own rhythm.</small>
              </div>
              <Link
                href="/studio/create?id=sample-project"
                className="play-bubble"
                aria-label="Try this sample in the interactive studio"
              >
                <Play fill="currentColor" size={20} />
              </Link>
            </div>
            <div className="ready-note">
              <span className="check-circle">
                <Check size={16} />
              </span>
              <div>
                Raw moments. Real stories.
                <small>
                  Try the sample project <ArrowRight size={12} />
                </small>
              </div>
            </div>
            <div className="art-label">
              A LITTLE INTENTION GOES A LONG WAY. ↗
            </div>
          </div>
        </section>
        <section className="promise-strip">
          <span>MAKE SPACE FOR YOUR NEXT IDEA</span>
          <p>
            One calm workspace.
            <br />
            <b>From the first spark to the final post.</b>
          </p>
          <div className="row">
            <Film />
            <span>Reels</span>
            <span>Shorts</span>
            <span>TikToks</span>
          </div>
        </section>
        <section id="workflow" className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LESS FRICTION. MORE FLOW.</span>
              <h2>Your story, in five simple steps.</h2>
            </div>
            <Link href="/studio/create" className="text-link">
              Let’s make something <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="workflow-grid">
            {[
              [
                "01",
                "Start with a spark",
                "Have an idea? Great. Need one? We’ll help you find a direction.",
              ],
              [
                "02",
                "Bring your moments",
                "Add your videos, photos, audio, or start with a sample collection.",
              ],
              [
                "03",
                "Find the story",
                "Explore hooks, story structures, and a clear plan for your post.",
              ],
              [
                "04",
                "Make it yours",
                "Refine scenes, captions, and timing in a simple visual workspace.",
              ],
              [
                "05",
                "Ready for the world",
                "Export your video, cover, caption, and hashtags in one place.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span className="step-number">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="possibilities" className="section possibility">
          <div className="possibility-art">
            <img src="/media/made.svg" alt="Original design sample" />
            <span className="small-tag">
              <Layers size={14} /> One collection. Many possibilities.
            </span>
          </div>
          <div>
            <span className="eyebrow">MORE THAN AN EDITOR</span>
            <h2>
              You bring the moments.
              <br />
              <em>We connect the dots.</em>
            </h2>
            <p>
              Editing is only part of making a post. BRANDOS brings the idea,
              the story, the edit, and the finishing touches into one guided
              flow.
            </p>
            <div className="feature-line">
              <WandSparkles />
              <div>
                <h3>A little guidance, a lot of you.</h3>
                <p>
                  Start simple with suggested story directions. Your voice stays
                  at the center.
                </p>
              </div>
            </div>
            <div className="feature-line">
              <MousePointer2 />
              <div>
                <h3>Room to take the wheel.</h3>
                <p>
                  Open advanced controls whenever you want to fine-tune the
                  details.
                </p>
              </div>
            </div>
            <Link href="/studio" className="text-link">
              Explore the workspace <ArrowRight size={18} />
            </Link>
          </div>
        </section>
        <section className="section before-after">
          <span className="eyebrow">FROM A FOLDER TO A STORY</span>
          <h2>Give your everyday footage a direction.</h2>
          <div className="two-col">
            <article className="card">
              <span className="eyebrow">BEFORE · RAW MOMENTS</span>
              <div className="mini-photos">
                {["morning", "grow", "made"].map((s) => (
                  <img
                    key={s}
                    src={`/media/${s}.svg`}
                    alt={`${s} demo source`}
                  />
                ))}
              </div>
              <p>
                A coffee clip, a plant, a work-in-progress. A collection waiting
                for a story.
              </p>
            </article>
            <article className="card sage">
              <span className="eyebrow">AFTER · A CONNECTED PLAN</span>
              <h3>“A slower kind of morning.”</h3>
              <p>
                Open with the coffee ritual → make room to grow → finish with a
                moment of creativity.
              </p>
              <p>
                3 scenes. One clear story. A caption and cover to go with it.
              </p>
              <Link
                className="text-link"
                href="/studio/create?id=sample-project"
              >
                Try the demo workflow <ArrowUpRight size={16} />
              </Link>
              <small>
                Illustrative sample · AI planning is simulated in Demo Mode.
              </small>
            </article>
          </div>
        </section>
        <section id="pricing" className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">START WITH A LITTLE CURIOSITY</span>
              <h2>Your creative space is open.</h2>
            </div>
          </div>
          <div className="two-col">
            <article className="card price">
              <Sparkles />
              <h3>Prototype studio</h3>
              <h2>
                Free <small>to explore</small>
              </h2>
              <p>
                Guided creation, sample footage, local media storage, scene
                editing, and browser video exports.
              </p>
              <Link className="btn btn-primary" href="/studio">
                Try BRANDOS <ArrowUpRight size={16} />
              </Link>
            </article>
            <article className="card">
              <span className="badge">IN DEVELOPMENT</span>
              <h3>A more connected creative workflow</h3>
              <p>
                Cloud accounts can be connected through Supabase. Production AI,
                background rendering, social publishing, and paid plans are not
                available in this prototype.
              </p>
              <p>No payment details required. No subscription is created.</p>
            </article>
          </div>
        </section>
        <section className="section faq">
          <span className="eyebrow">A FEW THINGS YOU MIGHT BE WONDERING</span>
          <h2>A little clarity.</h2>
          {[
            [
              "Do I need to know how to edit?",
              "No. The five-step flow walks you from an idea to an editable post package. Advanced controls are optional.",
            ],
            [
              "Is the AI real in this prototype?",
              "Demo Mode uses clearly labeled, rule-based planning and revisions. It does not analyze the contents of your footage or call an AI model.",
            ],
            [
              "Can I use my own footage?",
              "Yes. Upload images, videos, and audio. Demo files stay in this browser using IndexedDB. Export supported images and videos into an actual WebM draft.",
            ],
            [
              "Can BRANDOS publish for me?",
              "No social integrations are connected. You can export and manage statuses, then publish manually on your platform.",
            ],
            [
              "Where is my work saved?",
              "Demo projects are stored in this browser. An optional Supabase account can back up workspace data. Export a project backup before clearing browser data.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="final-cta">
          <Sparkles />
          <h2>There’s a story in what you already have.</h2>
          <Link href="/studio" className="btn btn-primary btn-lg">
            Let’s find it <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Link href="/" className="wordmark">
          brandos<span>®</span>
        </Link>
        <p>A little less effort. A little more you.</p>
        <span>Built for the way you create.</span>
      </footer>
    </div>
  );
}
