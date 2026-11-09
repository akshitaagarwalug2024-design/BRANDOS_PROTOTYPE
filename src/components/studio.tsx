"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Sparkles,
  LayoutDashboard,
  FolderOpen,
  Images,
  Lightbulb,
  Send,
  Palette,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Check,
  ChevronRight,
  HelpCircle,
  Film,
  Clock,
  MoreHorizontal,
  Download,
  Copy,
  Save,
  Trash2,
  GripVertical,
  RotateCcw,
  LoaderCircle,
  X,
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  WandSparkles,
  Music,
  Scissors,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  initialState,
  newProject,
  concepts,
  makePlan,
  steps,
  type State,
  type Project,
  type Media,
  type Brand,
  type Status,
} from "@/lib/model";
import { getFile, download, deleteFile } from "@/lib/storage";
import { renderVideo, coverSvg, contrastText } from "@/lib/render";
import { supabase } from "@/lib/supabase";
import { MediaLibrary, Uploader, Thumbnail, Preview } from "./media";
import Dashboard, { ProjectCard } from "./dashboard";
const nav = [
  ["", "Dashboard", LayoutDashboard],
  ["create", "Create", Plus],
  ["projects", "My Projects", FolderOpen],
  ["media", "Media Library", Images],
  ["ideas", "Content Ideas", Lightbulb],
  ["publishing", "Publishing Hub", Send],
  ["brand", "Brand Kit", Palette],
  ["settings", "Settings", Settings],
] as const;
const statuses: Status[] = [
  "Draft",
  "In Progress",
  "Needs Review",
  "Ready to Publish",
  "Published",
];
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}
function Select({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {items.map((i) => (
          <option key={i}>{i}</option>
        ))}
      </select>
    </Field>
  );
}
export default function Studio() {
  const path = usePathname(),
    router = useRouter(),
    params = useSearchParams();
  const view = path.split("/")[2] || "";
  const [state, setState] = useState<State | null>(null),
    [notice, setNotice] = useState(""),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [tour, setTour] = useState(false),
    [onboard, setOnboard] = useState(false),
    [account, setAccount] = useState(""),
    [storageError, setStorageError] = useState(false),
    [cloudBusy, setCloudBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((text: string) => {
    setNotice(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 6500);
  }, []);
  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    async function load() {
      let s: State;
      try {
        const raw = localStorage.getItem("brandos-fresh-v1");
        s = raw ? JSON.parse(raw) : initialState();
        if (
          !Array.isArray(s.projects) ||
          !s.brand ||
          !s.profile ||
          !Array.isArray(s.media)
        )
          throw Error("Invalid state");
      } catch {
        s = initialState();
        notify(
          "Could not read the saved workspace. A sample workspace is open; existing storage has not been overwritten.",
        );
        setStorageError(true);
      }
      await Promise.all(
        s.media.map(async (m) => {
          if (!m.sample) {
            try {
              const f = await getFile(m.id);
              if (f) {
                m.url = URL.createObjectURL(f);
                urls.push(m.url);
              } else m.url = "";
            } catch {
              m.url = "";
            }
          }
        }),
      );
      if (alive) {
        setState(s);
        setOnboard(!s.profile.onboarded);
      }
    }
    void load();
    if (supabase) {
      void supabase.auth.getUser().then(({ data }) => {
        if (alive) setAccount(data.user?.email || "");
      });
    }
    return () => {
      alive = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [notify]);
  useEffect(() => {
    if (!state || storageError) return;
    try {
      localStorage.setItem(
        "brandos-fresh-v1",
        JSON.stringify({
          ...state,
          media: state.media.map((m) => ({ ...m, url: m.sample ? m.url : "" })),
        }),
      );
    } catch {
      setStorageError(true);
      notify(
        "Autosave is unavailable. Export a workspace backup in Settings before leaving.",
      );
    }
  }, [state, storageError, notify]);
  useEffect(() => {
    const trap = (e: KeyboardEvent) => {
      const modal = document.querySelector<HTMLElement>("[role=dialog]");
      if (!modal) return;
      if (e.key === "Escape") {
        modal.querySelector<HTMLButtonElement>(".modal-close")?.click();
        return;
      }
      if (e.key !== "Tab") return;
      const els = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not([type=hidden]),select,textarea,[tabindex="0"]',
        ),
      );
      const first = els[0],
        last = els.at(-1);
      if (!first) return;
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !modal.contains(document.activeElement))
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !modal.contains(document.activeElement))
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, []);
  const updateProject = (p: Project) =>
    setState((s) =>
      s
        ? {
            ...s,
            projects: s.projects.map((x) =>
              x.id === p.id ? { ...p, updated: new Date().toISOString() } : x,
            ),
          }
        : s,
    );
  const create = (idea = "", sample = false) => {
    if (!state) return;
    let p = newProject(state.brand, idea);
    if (sample) {
      p = {
        ...p,
        idea: idea || "A slower kind of morning",
        title: idea || "A slower kind of morning",
        mediaIds: state.media.filter((m) => m.sample).map((m) => m.id),
      };
    }
    setState({ ...state, projects: [p, ...state.projects] });
    router.push(`/studio/create?id=${p.id}`);
  };
  const addMedia = (items: Media[]) =>
    setState((s) => (s ? { ...s, media: [...s.media, ...items] } : s));
  const p = state?.projects.find((p) => p.id === params.get("id"));
  if (!state)
    return (
      <div className="loading-screen">
        <Sparkles />
        <h2>Opening your creative space…</h2>
      </div>
    );
  const subheads: Record<string, [string, string]> = {
    "": [
      "Your next story starts here.",
      "A home for your ideas, your footage, and everything you’re making.",
    ],
    projects: [
      "Every story has a place.",
      "Pick up where you left off, or start something new.",
    ],
    media: [
      "Your moments, organized.",
      "A home for the raw material of your next story.",
    ],
    ideas: [
      "Start with a little spark.",
      "Turn a topic or a collection into your next post.",
    ],
    publishing: [
      "The finishing touches.",
      "Keep your drafts and ready-to-share stories in view.",
    ],
    brand: [
      "Make it feel like you.",
      "A few thoughtful defaults for a consistent creative voice.",
    ],
    settings: [
      "Your studio, your way.",
      "Manage your workspace, data, and connections.",
    ],
    create: [
      "Let’s make something worth sharing.",
      "One idea. Five simple steps. Your next story.",
    ],
  };
  const head = subheads[view] || subheads[""];
  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link href="/" className="wordmark">
          {collapsed ? "B" : "BRANDOS"}
          <span className="studio-edition">STUDIO</span>
        </Link>
        <button
          className="collapse"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>
        <div className="workspace-name">
          <span className="avatar">{state.profile.name[0]}</span>
          {!collapsed && (
            <div>
              <b>My workspace</b>
              <small>Personal workspace</small>
            </div>
          )}
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <Link
              title={label}
              key={key}
              href={`/studio${key ? "/" + key : ""}`}
              onClick={() => setMobile(false)}
              className={view === key ? "active" : ""}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && key === "create" && (
                <Plus className="nav-plus" size={14} />
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {!collapsed && (
            <div className="little-card">
              <span className="sun-icon">
                <Sparkles size={28} />
              </span>
              <h4>
                Your next story
                <br />
                is waiting for you.
              </h4>
              <p>
                Start with an idea.
                <br />
                Find your own creative rhythm.
              </p>
              <button onClick={() => create("", true)}>
                Try a sample project <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          <button
            className="help-button"
            onClick={() => setTour(true)}
            title="Studio guide"
          >
            <HelpCircle size={18} />
            {!collapsed && "Studio guide"}
          </button>
          <div className="sidebar-user">
            <span className="avatar earth">{state.profile.name[0]}</span>
            {!collapsed && (
              <div>
                <b>{state.profile.name}</b>
                <small>{account ? "Cloud account" : "Demo workspace"}</small>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-header">
          <div className="row">
            <button
              className="mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <PanelLeftOpen size={20} />
            </button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={13} />{" "}
              <b>{nav.find((n) => n[0] === view)?.[1] || "Dashboard"}</b>
            </span>
          </div>
          <div className="row">
            <span className={`save-state ${storageError ? "error" : ""}`}>
              <span className="green-dot" />
              {storageError ? "Autosave unavailable" : "Saved on this device"}
            </span>
            <span className="demo-pill">
              <Sparkles size={12} /> Demo Mode
            </span>
            <button
              title="Open the studio guide"
              className="icon-button"
              onClick={() => setTour(true)}
            >
              <HelpCircle size={19} />
            </button>
          </div>
        </header>
        <main className="workspace-main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {view === "" ? "YOUR WORKSPACE" : "THE BRANDOS STUDIO"}
              </span>
              <h1>{head[0]}</h1>
              <p>{head[1]}</p>
            </div>
            {view !== "create" && (
              <Button onClick={() => create()}>
                <Plus size={17} /> Create New Post
              </Button>
            )}
          </div>
          {view === "" && (
            <Dashboard
              state={state}
              create={create}
              open={(id) => router.push(`/studio/create?id=${id}`)}
              go={(route) => router.push("/studio/" + route)}
            />
          )}
          {view === "projects" && (
            <Projects
              state={state}
              open={(id) => router.push(`/studio/create?id=${id}`)}
              onDelete={(id) => {
                setState({
                  ...state,
                  projects: state.projects.filter((p) => p.id !== id),
                });
                notify("Project deleted. Media files were kept.");
              }}
            />
          )}
          {view === "media" && (
            <MediaLibrary
              media={state.media}
              onAdd={addMedia}
              onChange={(m) =>
                setState({
                  ...state,
                  media: state.media.map((x) => (x.id === m.id ? m : x)),
                })
              }
              onDelete={async (id) => {
                if (state.projects.some((p) => p.mediaIds.includes(id))) {
                  notify(
                    "This media is used in a project. Remove its scenes and deselect it in Upload first.",
                  );
                  return;
                }
                try {
                  await deleteFile(id);
                  setState({
                    ...state,
                    media: state.media.filter((m) => m.id !== id),
                  });
                  notify("Media deleted.");
                } catch {
                  notify("Could not delete this media. Please try again.");
                }
              }}
              notify={notify}
              onDiscover={() => router.push("/studio/ideas?source=footage")}
            />
          )}
          {view === "ideas" && (
            <Ideas
              state={state}
              save={(idea) => {
                if (!state.ideas.includes(idea))
                  setState({ ...state, ideas: [...state.ideas, idea] });
                notify("Idea saved to your studio.");
              }}
              create={create}
              notify={notify}
              footage={params.get("source") === "footage"}
            />
          )}
          {view === "publishing" && (
            <Publishing
              state={state}
              update={updateProject}
              open={(id) => router.push(`/studio/create?id=${id}`)}
              notify={notify}
            />
          )}
          {view === "brand" && (
            <BrandKit
              brand={state.brand}
              save={(brand) => {
                setState({ ...state, brand });
                notify(
                  "Brand kit saved. New projects will use these defaults.",
                );
              }}
            />
          )}
          {view === "settings" && (
            <section className="settings-grid">
              <article className="card">
                <h2>Your profile</h2>
                <p>A familiar face in your creative space.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    notify("Profile saved.");
                  }}
                >
                  <Field label="Your name">
                    <input
                      required
                      maxLength={40}
                      value={state.profile.name}
                      onChange={(e) =>
                        setState({
                          ...state,
                          profile: { ...state.profile, name: e.target.value },
                        })
                      }
                    />
                  </Field>
                  <Button type="submit">Save profile</Button>
                </form>
                <Button variant="ghost" onClick={() => setOnboard(true)}>
                  Update creative preferences <ArrowUpRight size={14} />
                </Button>
              </article>
              <article className="card">
                <h2>Connections</h2>
                <p>
                  {account
                    ? `Signed in as ${account}`
                    : "Demo Mode · no cloud account connected."}
                </p>
                <p>
                  AI planning uses labeled templates. Social publishing is not
                  connected. Browser video rendering is available on supported
                  browsers.
                </p>
                <Link className="btn btn-outline" href="/auth">
                  {account ? "Account sign-in" : "Connect a Supabase account"}{" "}
                  <ExternalLink size={14} />
                </Link>
                {account && (
                  <>
                    <Button
                      variant="outline"
                      disabled={cloudBusy}
                      onClick={async () => {
                        setCloudBusy(true);
                        try {
                          const {
                            data: { user },
                          } = await supabase!.auth.getUser();
                          if (!user) throw Error("Sign in first.");
                          const { error } = await supabase!
                            .from("workspaces")
                            .upsert({
                              user_id: user.id,
                              data: {
                                ...state,
                                media: state.media.filter((m) => m.sample),
                              },
                              updated_at: new Date().toISOString(),
                            });
                          if (error) throw error;
                          notify(
                            "Workspace metadata backed up. Local uploaded files are not included.",
                          );
                        } catch (e) {
                          notify(
                            e instanceof Error
                              ? e.message
                              : "Backup failed. Apply the database schema first.",
                          );
                        } finally {
                          setCloudBusy(false);
                        }
                      }}
                    >
                      Back up workspace metadata
                    </Button>
                    <Button
                      variant="outline"
                      disabled={cloudBusy}
                      onClick={async () => {
                        if (
                          !confirm(
                            "Replace this workspace with your cloud backup? Export a local backup first.",
                          )
                        )
                          return;
                        setCloudBusy(true);
                        try {
                          const {
                            data: { user },
                          } = await supabase!.auth.getUser();
                          if (!user) throw Error("Sign in first.");
                          const { data, error } = await supabase!
                            .from("workspaces")
                            .select("data")
                            .eq("user_id", user.id)
                            .single();
                          if (error) throw error;
                          if (!data?.data?.projects)
                            throw Error("No valid cloud backup found.");
                          setState(data.data);
                          notify("Workspace metadata restored.");
                        } catch (e) {
                          notify(
                            e instanceof Error ? e.message : "Restore failed.",
                          );
                        } finally {
                          setCloudBusy(false);
                        }
                      }}
                    >
                      Restore cloud metadata
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        await supabase!.auth.signOut();
                        setAccount("");
                        notify("Signed out. Local work is still here.");
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                )}
              </article>
              <article className="card">
                <h2>Your work belongs to you.</h2>
                <p>
                  Projects and preferences are stored in this browser. Media is
                  stored in IndexedDB. Clearing browser data removes local work.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    download(
                      new Blob([JSON.stringify(state, null, 2)], {
                        type: "application/json",
                      }),
                      "brandos-workspace.json",
                    );
                    notify(
                      "Workspace metadata exported. Media files are not included; keep your source files.",
                    );
                  }}
                >
                  <Download size={16} /> Export workspace backup
                </Button>
                <Field label="Restore workspace metadata">
                  <input
                    type="file"
                    accept="application/json"
                    onChange={async (e) => {
                      try {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const s = JSON.parse(await f.text());
                        if (
                          !Array.isArray(s.projects) ||
                          !Array.isArray(s.media) ||
                          !s.brand ||
                          !s.profile ||
                          !Array.isArray(s.ideas) ||
                          s.projects.some(
                            (p: Project) =>
                              !p.id || !Array.isArray(p.scenes) || !p.idea,
                          )
                        )
                          throw Error("Invalid workspace backup.");
                        if (
                          !confirm(
                            "Replace workspace metadata? Existing uploaded file storage is kept.",
                          )
                        )
                          return;
                        for (const m of s.media) {
                          if (m.sample) {
                            const allowed = initialState().media.find(
                              (x) => x.id === m.id,
                            );
                            m.url = allowed?.url || "";
                          } else {
                            const f = await getFile(m.id);
                            m.url = f ? URL.createObjectURL(f) : "";
                          }
                        }
                        setState(s);
                        setStorageError(false);
                        notify(
                          "Workspace restored. Missing source files need to be re-uploaded.",
                        );
                      } catch {
                        notify(
                          "Could not restore that backup. Choose a BRANDOS workspace JSON file.",
                        );
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                </Field>
              </article>
              <article className="card">
                <h2>Need a fresh perspective?</h2>
                <p>Replay the tour to see how your ideas become posts.</p>
                <Button variant="outline" onClick={() => setTour(true)}>
                  Open studio guide <ArrowRight size={16} />
                </Button>
              </article>
            </section>
          )}
          {view === "create" &&
            (p ? (
              <Wizard
                key={p.id}
                project={p}
                state={state}
                update={updateProject}
                addMedia={addMedia}
                notify={notify}
                finish={() => router.push("/studio")}
              />
            ) : (
              <section className="create-start">
                <div className="start-spark">✳</div>
                <span className="eyebrow">
                  A BLANK CANVAS. A WORLD OF POSSIBILITIES.
                </span>
                <h2>What will you make today?</h2>
                <p>
                  Start with an idea, or get a feel for the flow with our sample
                  footage.
                </p>
                <div className="row wrap">
                  <Button onClick={() => create()}>
                    <Plus size={16} /> Start a new story
                  </Button>
                  <Button variant="outline" onClick={() => create("", true)}>
                    <Film size={16} /> Explore sample footage
                  </Button>
                </div>
                <div className="mini-steps">
                  {steps.map((s, i) => (
                    <span key={s}>
                      <b>{i + 1}</b>
                      {s}
                      {i < 4 && <ChevronRight size={14} />}
                    </span>
                  ))}
                </div>
              </section>
            ))}
        </main>
        <footer className="workspace-footer">
          <span>Ideas deserve to go somewhere.</span>
          <span>
            Made with BRANDOS. <Sparkles size={12} />
          </span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {onboard && (
        <Onboarding
          profile={state.profile}
          close={(profile) => {
            setState({ ...state, profile: { ...profile, onboarded: true } });
            setOnboard(false);
          }}
        />
      )}
      {tour && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Studio guide"
          >
            <button
              autoFocus
              className="modal-close"
              onClick={() => setTour(false)}
              aria-label="Close guide"
            >
              ×
            </button>
            <Sparkles className="olive" />
            <h2>Studio guide goes a long way.</h2>
            <p>BRANDOS brings the whole journey into one calm workspace.</p>
            <ol className="tour-steps">
              {steps.map((s, i) => (
                <li key={s}>
                  <span>{i + 1}</span>
                  <div>
                    <b>{s}</b>
                    <p>
                      {
                        [
                          "Tell us what you want to share.",
                          "Select sample footage or add files from your device.",
                          "Choose a labeled demo story direction.",
                          "Preview and adjust your scenes, timing, and captions.",
                          "Export a real browser-rendered video and editable post package.",
                        ][i]
                      }
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="notice">
              Demo planning uses templates, not footage analysis. Your work
              stays on this device unless you choose cloud backup.
            </p>
            <Button onClick={() => setTour(false)}>
              Got it. Let’s create <ArrowRight size={16} />
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
function Projects({
  state,
  open,
  onDelete,
}: {
  state: State;
  open: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All projects");
  const projects = state.projects.filter(
    (p) =>
      (filter === "All projects" || p.status === filter) &&
      p.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="filter-row">
        <input
          aria-label="Search projects"
          placeholder="Find a story…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter projects"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All projects", ...statuses].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span>{projects.length} projects</span>
      </div>
      <div className="project-grid">
        {projects.map((p) => (
          <div key={p.id}>
            <ProjectCard
              project={p}
              media={state.media}
              open={() => open(p.id)}
            />
            <button
              className="delete-link"
              onClick={() => {
                if (confirm(`Delete “${p.title}”? This cannot be undone.`))
                  onDelete(p.id);
              }}
            >
              <Trash2 size={13} /> Delete project
            </button>
          </div>
        ))}
      </div>
      {!projects.length && (
        <div className="empty">
          <FolderOpen />
          <h2>A little space for a new story.</h2>
          <p>Create a new post above, or try a different search.</p>
        </div>
      )}
    </>
  );
}
function Onboarding({
  profile,
  close,
}: {
  profile: State["profile"];
  close: (p: State["profile"]) => void;
}) {
  const [p, setP] = useState(profile);
  return (
    <div className="modal-backdrop">
      <section
        className="modal onboarding"
        role="dialog"
        aria-modal="true"
        aria-label="Creative preferences"
      >
        <span className="eyebrow">A LITTLE INTRODUCTION</span>
        <h2>Let’s make this your space.</h2>
        <p>Five small things to help us find your creative rhythm.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            close(p);
          }}
        >
          <Field label="What should we call you?">
            <input
              autoFocus
              required
              maxLength={40}
              value={p.name}
              onChange={(e) => setP({ ...p, name: e.target.value })}
            />
          </Field>
          <div className="two-col">
            <Select
              label="What do you create?"
              value={p.niche}
              items={[
                "Lifestyle & everyday",
                "Education & learning",
                "Business & products",
                "Travel & food",
                "Art & design",
              ]}
              onChange={(niche) => setP({ ...p, niche })}
            />
            <Select
              label="Where do you share?"
              value={p.platform}
              items={["Instagram Reels", "YouTube Shorts", "TikTok"]}
              onChange={(platform) => setP({ ...p, platform })}
            />
            <Select
              label="Editing experience"
              value={p.experience}
              items={["Beginner", "Some experience", "Experienced"]}
              onChange={(experience) => setP({ ...p, experience })}
            />
            <Select
              label="Your biggest challenge"
              value={p.challenge}
              items={[
                "Turning footage into stories",
                "Finding ideas",
                "Editing takes too long",
                "Posting consistently",
              ]}
              onChange={(challenge) => setP({ ...p, challenge })}
            />
          </div>
          <Select
            label="Your visual style"
            value={p.style}
            items={[
              "Warm & minimal",
              "Bold & energetic",
              "Clean & professional",
              "Playful & colorful",
            ]}
            onChange={(style) => setP({ ...p, style })}
          />
          <div className="row between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => close(profile)}
            >
              Skip for now
            </Button>
            <Button type="submit">
              Make myself at home <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
function Wizard({
  project: p,
  state,
  update,
  addMedia,
  notify,
  finish,
}: {
  project: Project;
  state: State;
  update: (p: Project) => void;
  addMedia: (m: Media[]) => void;
  notify: (s: string) => void;
  finish: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [directions, setDirections] = useState(concepts(p.idea)),
    [advanced, setAdvanced] = useState(false),
    [active, setActive] = useState(0),
    [revision, setRevision] = useState(""),
    [method, setMethod] = useState("I already have an idea");
  const set = (v: Partial<Project>) => update({ ...p, ...v });
  const selected = p.mediaIds.flatMap(
    (id) => state.media.find((m) => m.id === id) || [],
  );
  const total = p.scenes.reduce((n, s) => n + s.duration, 0);
  const goNext = async () => {
    if (p.step === 0) {
      if (!p.idea.trim()) {
        notify("Give your story an idea first. A few words is enough.");
        return;
      }
      set({ step: 1, title: p.idea });
    } else if (p.step === 1) {
      if (!selected.length || selected.some((m) => !m.url)) {
        notify(
          "Choose at least one available media file. Re-upload missing files.",
        );
        return;
      }
      setBusy(true);
      try {
        const r = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: p.idea,
            audience: p.audience,
            tone: p.tone,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        setDirections(data.concepts);
        set({ step: 2 });
      } catch (e) {
        notify(
          e instanceof Error
            ? e.message
            : "Could not load demo plan. Try again.",
        );
      } finally {
        setBusy(false);
      }
    } else if (p.step === 2) {
      if (
        p.scenes.length &&
        !confirm(
          "Replace the existing scene plan? Your current edits will be replaced.",
        )
      )
        return;
      update({ ...makePlan(p, state.media), step: 3 });
      setActive(0);
    } else if (p.step === 3) {
      if (!p.scenes.length) {
        notify("Add a scene before moving to the post package.");
        return;
      }
      set({ step: 4, status: "Needs Review" });
    }
  };
  const snapshot = (label: string) =>
    [
      ...p.history,
      {
        label,
        scenes: structuredClone(p.scenes),
        caption: p.caption,
        style: p.style,
        subtitles: p.subtitles,
      },
    ].slice(-20);
  const revise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revision.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revise",
          scenes: p.scenes,
          request: revision,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      set({
        scenes: data.scenes,
        history: snapshot(revision),
        subtitles: /minimal|caption/.test(revision.toLowerCase())
          ? false
          : p.subtitles,
      });
      setActive(0);
      setRevision("");
      notify(data.explanation);
    } catch (e) {
      notify(
        e instanceof Error
          ? e.message
          : "Revision failed. Your project is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wizard">
      <div className="wizard-top">
        <div className="row">
          <span className="project-mark">
            <Film size={20} />
          </span>
          <div>
            <b>{p.title}</b>
            <small>
              {p.platform} · {p.status}
            </small>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            notify("Your draft is saved on this device.");
            finish();
          }}
        >
          <Save size={15} /> Save & exit
        </Button>
      </div>
      <ol className="stepper">
        {steps.map((s, i) => (
          <li
            key={s}
            className={i === p.step ? "current" : i < p.step ? "complete" : ""}
          >
            <button disabled={i > p.step} onClick={() => set({ step: i })}>
              <span>{i < p.step ? <Check size={15} /> : i + 1}</span>
              <b>{s}</b>
            </button>
          </li>
        ))}
      </ol>
      {p.step === 0 && (
        <div className="wizard-content">
          <span className="eyebrow">01 / THE FIRST SPARK</span>
          <h2>Every good post starts with an idea.</h2>
          <p>You don’t need the whole story yet. Just somewhere to begin.</p>
          <div className="choice-grid">
            {[
              "I already have an idea",
              "Help me find an idea",
              "Explore ideas from my existing footage",
            ].map((s, i) => (
              <button
                key={s}
                className={method === s ? "selected" : ""}
                onClick={() => {
                  setMethod(s);
                  if (i === 2 && state.media.length)
                    set({ mediaIds: state.media.slice(0, 3).map((m) => m.id) });
                }}
              >
                {i === 0 ? <Lightbulb /> : i === 1 ? <Sparkles /> : <Images />}
                <b>{s}</b>
                <small>
                  {
                    [
                      "Bring a thought you want to share.",
                      "Try a starting point below.",
                      "Select media next; concepts use your idea and metadata.",
                    ][i]
                  }
                </small>
              </button>
            ))}
          </div>
          {method !== "I already have an idea" && (
            <div className="notice">
              <b>Demo inspiration · not footage analysis</b>
              <div className="row wrap">
                {[
                  "A day in my creative life",
                  "Three things I wish I knew",
                  "The story behind my process",
                ].map((idea) => (
                  <button
                    className="chip"
                    key={idea}
                    onClick={() => set({ idea, title: idea })}
                  >
                    {idea} <Plus size={12} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <Field label="What would you like to share?">
            <textarea
              autoFocus
              maxLength={300}
              placeholder="e.g. The little rituals that make my mornings more creative…"
              value={p.idea}
              onChange={(e) =>
                set({
                  idea: e.target.value,
                  title: e.target.value || "Untitled story",
                })
              }
            />
          </Field>
          <div className="two-col">
            <Select
              label="What’s your goal?"
              value={p.goal}
              items={[
                "Build community",
                "Educate my audience",
                "Showcase a product",
                "Share my process",
                "Inspire someone",
              ]}
              onChange={(goal) => set({ goal })}
            />
            <Field label="Who is it for?">
              <input
                maxLength={100}
                value={p.audience}
                onChange={(e) => set({ audience: e.target.value })}
              />
            </Field>
            <Select
              label="Where will it live?"
              value={p.platform}
              items={["Instagram Reels", "YouTube Shorts", "TikTok"]}
              onChange={(platform) => set({ platform })}
            />
            <Select
              label="How should it feel?"
              value={p.tone}
              items={[
                "Warm & authentic",
                "Bold & energetic",
                "Calm & thoughtful",
                "Playful & casual",
                "Professional & clear",
              ]}
              onChange={(tone) => set({ tone })}
            />
          </div>
        </div>
      )}
      {p.step === 1 && (
        <div className="wizard-content">
          <span className="eyebrow">02 / BRING YOUR MOMENTS</span>
          <h2>A little footage. A lot of possibility.</h2>
          <p>
            Add your own media or select a sample collection. Pick up to 12
            files.
          </p>
          <Uploader
            notify={notify}
            onAdd={(items) => {
              addMedia(items);
              set({
                mediaIds: [...p.mediaIds, ...items.map((m) => m.id)].slice(
                  0,
                  12,
                ),
              });
            }}
          />
          <div className="section-heading compact">
            <h3>
              Your library{" "}
              <span className="count">{p.mediaIds.length} selected</span>
            </h3>
            <Button
              variant="ghost"
              onClick={() =>
                set({
                  mediaIds: state.media
                    .filter((m) => m.sample)
                    .map((m) => m.id),
                })
              }
            >
              Use sample collection <Sparkles size={14} />
            </Button>
          </div>
          <div className="media-grid">
            {state.media.map((m) => (
              <button
                key={m.id}
                className={`media-card selectable ${p.mediaIds.includes(m.id) ? "selected" : ""}`}
                onClick={() =>
                  set({
                    mediaIds: p.mediaIds.includes(m.id)
                      ? p.mediaIds.filter((id) => id !== m.id)
                      : p.mediaIds.length < 12
                        ? [...p.mediaIds, m.id]
                        : p.mediaIds,
                  })
                }
              >
                <Thumbnail media={m} />
                <span className="select-check">
                  {p.mediaIds.includes(m.id) && <Check size={14} />}
                </span>
                <div>
                  <b>{m.name}</b>
                  <small>
                    {m.sample ? "Sample · " : ""}
                    {m.type} ·{" "}
                    {m.url ? m.collection : "Source missing — re-upload"}
                  </small>
                </div>
              </button>
            ))}
          </div>
          <p className="notice">
            No footage analysis is performed in Demo Mode. The next step
            suggests story structures from your idea.
          </p>
        </div>
      )}
      {p.step === 2 && (
        <div className="wizard-content">
          <span className="eyebrow">03 / FIND YOUR STORY</span>
          <h2>One idea. A few different directions.</h2>
          <p>
            Choose the story that feels most like you. You can make it your own
            in the next step.
          </p>
          <span className="demo-pill">
            <Sparkles size={12} /> Demo planning · template suggestions, not AI
            analysis
          </span>
          <div className="concept-grid">
            {directions.map((c, i) => (
              <button
                className={`concept-card ${p.concept === i ? "selected" : ""}`}
                key={c.title}
                onClick={() => set({ concept: i })}
              >
                <div className="row between">
                  <span className="eyebrow">DIRECTION 0{i + 1}</span>
                  <span className="select-check">
                    {p.concept === i && <Check size={14} />}
                  </span>
                </div>
                <h3>{c.title}</h3>
                <blockquote>“{c.hook}”</blockquote>
                <ol>
                  {c.outline.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <div className="concept-why">
                  <Lightbulb size={15} />
                  <p>{c.why}</p>
                </div>
                <small>
                  <Clock size={13} /> ~{c.duration} seconds · {p.platform}
                </small>
              </button>
            ))}
          </div>
          <div className="two-col">
            <Field label="Call to action">
              <input
                value={p.cta}
                maxLength={180}
                onChange={(e) => set({ cta: e.target.value })}
              />
            </Field>
            <Select
              label="Editing style"
              value={p.style}
              items={[
                "Slow & intentional",
                "Quick & energetic",
                "Clean & minimal",
              ]}
              onChange={(style) => set({ style })}
            />
          </div>
          <div className="card">
            <h3>Footage in your story</h3>
            <p>
              Files appear in your selection order. Reorder scenes after
              approving this plan.
            </p>
            <div className="selected-footage">
              {selected.map((m, i) => (
                <span key={m.id}>
                  <b>{i + 1}</b>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {p.step === 3 && (
        <div className="editor-content">
          <div className="editor-heading">
            <div>
              <span className="eyebrow">04 / MAKE IT YOURS</span>
              <h2>Your story, taking shape.</h2>
            </div>
            <div className="segmented">
              <button
                className={!advanced ? "active" : ""}
                onClick={() => setAdvanced(false)}
              >
                Simple Editing
              </button>
              <button
                className={advanced ? "active" : ""}
                onClick={() => setAdvanced(true)}
              >
                Advanced Editing
              </button>
            </div>
          </div>
          <div className="editor-grid">
            <div className="editor-preview">
              <Preview
                project={p}
                media={state.media}
                brand={state.brand}
                active={active}
                onActive={setActive}
              />
              <p className="preview-hint">
                Scene sequence preview · local source media
              </p>
            </div>
            <div className="editor-controls">
              <section className="assistant-card">
                <div className="row">
                  <Sparkles size={18} />
                  <h3>A little creative direction?</h3>
                  <span className="badge">DEMO</span>
                </div>
                <p>
                  Try a revision in plain language. Rule-based demo edits change
                  your timeline or opening text.
                </p>
                <form onSubmit={revise}>
                  <textarea
                    aria-label="Revision request"
                    maxLength={500}
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    placeholder="e.g. Shorten this to 12 seconds"
                  />
                  <div className="row between">
                    <small>Suggestions, with you in control.</small>
                    <Button
                      disabled={busy || !revision.trim()}
                      type="submit"
                      size="sm"
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={15} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}{" "}
                      Apply revision
                    </Button>
                  </div>
                </form>
                <div className="row wrap">
                  {[
                    "Make the opening more engaging",
                    "Use a faster editing style",
                    "Remove the second clip",
                    "Make the captions more minimal",
                  ].map((s) => (
                    <button
                      className="chip"
                      onClick={() => setRevision(s)}
                      key={s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
              <section className="scene-section">
                <div className="row between">
                  <h3>
                    Your scenes <span className="count">{p.scenes.length}</span>
                  </h3>
                  <span className="muted">{total}s total</span>
                </div>
                {p.scenes.map((scene, i) => (
                  <div
                    key={scene.id}
                    className={`scene-row ${active === i ? "selected" : ""}`}
                  >
                    <button
                      className="scene-select"
                      onClick={() => setActive(i)}
                      aria-label={`Preview scene ${i + 1}`}
                    >
                      <Thumbnail
                        media={state.media.find((m) => m.id === scene.mediaId)}
                      />
                    </button>
                    <div className="scene-fields">
                      <span className="eyebrow">SCENE {i + 1}</span>
                      <input
                        aria-label={`Scene ${i + 1} title`}
                        value={scene.title}
                        onChange={(e) =>
                          set({
                            scenes: p.scenes.map((s) =>
                              s.id === scene.id
                                ? { ...s, title: e.target.value }
                                : s,
                            ),
                          })
                        }
                      />
                      {advanced && (
                        <textarea
                          aria-label={`Scene ${i + 1} subtitle`}
                          value={scene.text}
                          onChange={(e) =>
                            set({
                              scenes: p.scenes.map((s) =>
                                s.id === scene.id
                                  ? { ...s, text: e.target.value }
                                  : s,
                              ),
                            })
                          }
                        />
                      )}
                    </div>
                    <label className="duration-input">
                      <input
                        type="number"
                        aria-label={`Scene ${i + 1} duration`}
                        min={1}
                        max={40}
                        value={scene.duration}
                        onChange={(e) =>
                          set({
                            scenes: p.scenes.map((s) =>
                              s.id === scene.id
                                ? {
                                    ...s,
                                    duration: Math.max(
                                      1,
                                      Math.min(40, Number(e.target.value)),
                                    ),
                                  }
                                : s,
                            ),
                          })
                        }
                      />
                      sec
                    </label>
                    {advanced && (
                      <div className="scene-actions">
                        <button
                          aria-label={`Move scene ${i + 1} earlier`}
                          disabled={i === 0}
                          onClick={() => {
                            const scenes = [...p.scenes];
                            [scenes[i - 1], scenes[i]] = [
                              scenes[i],
                              scenes[i - 1],
                            ];
                            set({ scenes });
                            setActive(Math.max(0, i - 1));
                          }}
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`Move scene ${i + 1} later`}
                          disabled={i === p.scenes.length - 1}
                          onClick={() => {
                            const scenes = [...p.scenes];
                            [scenes[i + 1], scenes[i]] = [
                              scenes[i],
                              scenes[i + 1],
                            ];
                            set({ scenes });
                            setActive(i + 1);
                          }}
                        >
                          ↓
                        </button>
                        <button
                          aria-label={`Delete scene ${i + 1}`}
                          onClick={() => {
                            if (
                              confirm(
                                "Remove this scene? Your source file will be kept.",
                              )
                            ) {
                              set({
                                scenes: p.scenes.filter(
                                  (s) => s.id !== scene.id,
                                ),
                                history: snapshot("Before removing scene"),
                              });
                              setActive(0);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
              <div className="timeline" aria-label="Scene timeline">
                {p.scenes.map((s, i) => (
                  <button
                    key={s.id}
                    style={{ flex: s.duration }}
                    className={active === i ? "active" : ""}
                    onClick={() => setActive(i)}
                  >
                    <span>0{i + 1}</span>
                    <b>{s.duration}s</b>
                  </button>
                ))}
              </div>
              <div className="two-col">
                <Select
                  label="Aspect ratio"
                  value={p.ratio}
                  items={["9:16", "1:1", "16:9"]}
                  onChange={(ratio) => set({ ratio })}
                />
                <Select
                  label="Editing direction"
                  value={p.style}
                  items={[
                    "Slow & intentional",
                    "Quick & energetic",
                    "Clean & minimal",
                  ]}
                  onChange={(style) => set({ style })}
                />
              </div>
              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={p.subtitles}
                  onChange={(e) => set({ subtitles: e.target.checked })}
                />{" "}
                Show scene text overlays <small>Not transcribed speech</small>
              </label>
              {advanced && (
                <section className="advanced-controls">
                  <div className="row">
                    <Scissors size={16} />
                    <h3>The finer details.</h3>
                  </div>
                  <div className="two-col">
                    <Field label="Source audio volume">
                      <input
                        aria-label="Source audio volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={p.volume}
                        onChange={(e) =>
                          set({ volume: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Brightness">
                      <input
                        aria-label="Brightness"
                        type="range"
                        min={50}
                        max={150}
                        value={p.brightness}
                        onChange={(e) =>
                          set({ brightness: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Select
                      label="Scene transition"
                      value={p.transition}
                      items={["Cut", "Fade"]}
                      onChange={(transition) => set({ transition })}
                    />
                    {p.scenes[active] && (
                      <Field label="Selected scene source start (seconds)">
                        <input
                          aria-label="Source start"
                          type="number"
                          min={0}
                          max={3600}
                          value={p.scenes[active].trim}
                          onChange={(e) =>
                            set({
                              scenes: p.scenes.map((s, i) =>
                                i === active
                                  ? {
                                      ...s,
                                      trim: Math.max(
                                        0,
                                        Math.min(3600, Number(e.target.value)),
                                      ),
                                    }
                                  : s,
                              ),
                            })
                          }
                        />
                      </Field>
                    )}
                  </div>
                  <p className="notice">
                    Add audio in Upload to use an audio scene. Music mixing,
                    automatic transcription, and color grading beyond brightness
                    are not connected.
                  </p>
                </section>
              )}
              {p.history.length > 0 && (
                <details className="history">
                  <summary>
                    Revision history · {p.history.length} saved versions
                  </summary>
                  {p.history.map((h, i) => (
                    <div className="row between" key={i}>
                      <span>
                        {i + 1}. {h.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          set({
                            scenes: structuredClone(h.scenes),
                            caption: h.caption,
                            style: h.style,
                            subtitles: h.subtitles,
                          });
                          setActive(0);
                          notify("Saved version restored.");
                        }}
                      >
                        <RotateCcw size={13} /> Restore
                      </Button>
                    </div>
                  ))}
                </details>
              )}
            </div>
          </div>
        </div>
      )}
      {p.step === 4 && (
        <PostPackage
          project={p}
          state={state}
          update={update}
          notify={notify}
          finish={finish}
        />
      )}
      {p.step < 4 && (
        <div className="wizard-footer">
          <Button
            variant="ghost"
            onClick={() =>
              p.step === 0 ? finish() : set({ step: p.step - 1 })
            }
          >
            <ArrowLeft size={15} />
            {p.step === 0 ? "Dashboard" : "Back"}
          </Button>
          <span>
            {busy
              ? "Finding a little direction…"
              : `Step ${p.step + 1} of 5 · Your progress is saved`}
          </span>
          <Button onClick={goNext} disabled={busy}>
            {busy ? <LoaderCircle size={16} className="spin" /> : null}
            {
              [
                "Bring your footage",
                "Find my story",
                "Use this direction",
                "Build post package",
              ][p.step]
            }{" "}
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
function PostPackage({
  project: p,
  state,
  update,
  notify,
  finish,
}: {
  project: Project;
  state: State;
  update: (p: Project) => void;
  notify: (s: string) => void;
  finish: () => void;
}) {
  const [active, setActive] = useState(0),
    [job, setJob] = useState<{
      status: string;
      progress: number;
      error?: string;
    }>({ status: "idle", progress: 0 }),
    [video, setVideo] = useState<Blob | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    setVideo(null);
  }, [
    p.scenes,
    p.ratio,
    p.brightness,
    p.volume,
    p.subtitles,
    p.transition,
    state.brand.color,
  ]);
  const set = (v: Partial<Project>) => update({ ...p, ...v });
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied. Ready when you are.");
    } catch {
      notify("Clipboard access is blocked. Select and copy the text manually.");
    }
  };
  const exportVideo = async () => {
    setJob({ status: "processing", progress: 0 });
    abort.current = new AbortController();
    try {
      const blob = await renderVideo(
        p,
        state.media,
        state.brand.color,
        (n) => setJob({ status: "processing", progress: n }),
        abort.current.signal,
      );
      setVideo(blob);
      setJob({ status: "completed", progress: 100 });
      download(blob, "brandos-draft.webm");
      notify("Actual WebM draft exported. Preview it before posting.");
    } catch (e) {
      setJob({
        status: "failed",
        progress: 0,
        error:
          e instanceof Error
            ? e.message
            : "Rendering failed. Please try again.",
      });
    }
  };
  return (
    <div className="package-content">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">05 / THE FINISHING TOUCHES</span>
          <h2>A story, ready to make your own.</h2>
          <p>
            Review the details. Download the package. Share it in your own time.
          </p>
        </div>
        <span className="badge">NO SOCIAL INTEGRATIONS CONNECTED</span>
      </div>
      <div className="package-grid">
        <div>
          <Preview
            project={p}
            media={state.media}
            brand={state.brand}
            active={active}
            onActive={setActive}
          />
          <div className="export-card">
            <h3>
              <Download size={17} /> Your video
            </h3>
            <p>
              Render your scene sequence, text overlays, source audio, and
              timing as a real WebM video. Keep this tab visible; rendering runs
              in real time (up to 120 seconds).
            </p>
            {job.status === "processing" ? (
              <>
                <progress
                  max={100}
                  value={job.progress}
                  aria-label="Video rendering progress"
                />
                <p role="status">Rendering · {job.progress}%</p>
                <Button
                  variant="outline"
                  onClick={() => abort.current?.abort()}
                >
                  Cancel export
                </Button>
              </>
            ) : (
              <Button
                disabled={!p.scenes.length}
                onClick={
                  video
                    ? () => download(video, "brandos-draft.webm")
                    : exportVideo
                }
              >
                <Download size={15} />
                {video ? "Download video again" : "Render & download video"}
              </Button>
            )}
            {job.error && (
              <p role="alert" className="error-text">
                {job.error} You can still export the project package below.
              </p>
            )}
            <small>
              WebM · convert to MP4 before posting if your platform requires it.
              This is a draft render, not an AI-generated video.
            </small>
          </div>
        </div>
        <div className="package-fields">
          <Field label="Post title">
            <input
              value={p.title}
              maxLength={150}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Caption · editable demo suggestion">
            <textarea
              className="caption-textarea"
              value={p.caption}
              onChange={(e) => set({ caption: e.target.value })}
            />
          </Field>
          <div className="row wrap">
            <Button variant="outline" size="sm" onClick={() => copy(p.caption)}>
              <Copy size={13} /> Copy caption
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                set({
                  caption: `A little look at ${p.idea.toLowerCase()}.\n\n${p.cta}`,
                })
              }
            >
              Try a shorter caption <Sparkles size={13} />
            </Button>
          </div>
          <Field label="Hashtags">
            <textarea
              value={p.hashtags}
              onChange={(e) => set({ hashtags: e.target.value })}
            />
          </Field>
          <Button variant="ghost" size="sm" onClick={() => copy(p.hashtags)}>
            <Copy size={13} /> Copy hashtags
          </Button>
          <Field label="Call to action">
            <input
              value={p.cta}
              onChange={(e) => set({ cta: e.target.value })}
            />
          </Field>
          <Field label="Cover headline">
            <input
              maxLength={130}
              value={p.coverTitle}
              onChange={(e) => set({ coverTitle: e.target.value })}
            />
          </Field>
          <div
            className="cover-preview"
            style={{
              background: state.brand.color,
              color: contrastText(state.brand.color),
            }}
          >
            <span>A STORY BY YOU</span>
            <h3>{p.coverTitle}</h3>
            <small>made with brandos.</small>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              download(
                new Blob([coverSvg(p.coverTitle, state.brand.color)], {
                  type: "image/svg+xml",
                }),
                "brandos-cover.svg",
              )
            }
          >
            <Download size={14} /> Download cover (SVG)
          </Button>
          <p className="notice">
            Format: {p.platform} · {p.ratio}. Preview your WebM and check
            platform upload requirements before sharing. The cover exports as a
            separate SVG file.
          </p>
          <div className="two-col">
            <Field label="Plan a day to share">
              <input
                type="date"
                value={p.date}
                onChange={(e) => set({ date: e.target.value })}
              />
            </Field>
            <Select
              label="Review status"
              value={p.status}
              items={statuses.filter((s) => s !== "Published")}
              onChange={(status) => set({ status: status as Status })}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              download(
                new Blob(
                  [
                    JSON.stringify(
                      {
                        project: p,
                        media: state.media
                          .filter((m) => p.mediaIds.includes(m.id))
                          .map((m) => ({
                            ...m,
                            url: m.sample ? m.url : "source-file-required",
                          })),
                        note: "Editable metadata package. Source media and rendered video are separate downloads.",
                      },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                ),
                "brandos-post-package.json",
              );
              notify(
                "Post package exported. Keep your source media and video download alongside it.",
              );
            }}
          >
            <Download size={16} /> Export editable post package
          </Button>
        </div>
      </div>
      <div className="wizard-footer">
        <Button variant="ghost" onClick={() => set({ step: 3 })}>
          <ArrowLeft size={15} /> Back to refine
        </Button>
        <div className="row">
          <Button
            variant="outline"
            onClick={() => {
              set({ status: "Draft" });
              notify("Draft saved. You can return to it from your dashboard.");
              finish();
            }}
          >
            Save draft
          </Button>
          <Button
            onClick={() => {
              set({ status: "Ready to Publish" });
              notify("Marked ready. Publish manually on your chosen platform.");
              finish();
            }}
          >
            <Check size={16} /> Mark as ready to publish
          </Button>
        </div>
      </div>
    </div>
  );
}
function Ideas({
  state,
  save,
  create,
  notify,
  footage,
}: {
  state: State;
  save: (s: string) => void;
  create: (s?: string, sample?: boolean) => void;
  notify: (s: string) => void;
  footage: boolean;
}) {
  const [topic, setTopic] = useState(""),
    [niche, setNiche] = useState(state.profile.niche),
    [audience, setAudience] = useState("Curious creatives"),
    [goal, setGoal] = useState("Build community"),
    [results, setResults] = useState<ReturnType<typeof concepts>>([]),
    [busy, setBusy] = useState(false),
    [fromFootage, setFromFootage] = useState(footage),
    [collection, setCollection] = useState(state.media[0]?.collection || "");
  return (
    <>
      <div className="ideas-layout">
        <section className="card idea-form">
          <span className="eyebrow">
            <Sparkles size={14} /> YOUR NEXT SPARK
          </span>
          <h2>A starting point for something good.</h2>
          <p>
            Enter a topic, or use the names and tags in a collection to explore
            story directions.
          </p>
          <div className="segmented">
            <button
              className={!fromFootage ? "active" : ""}
              onClick={() => setFromFootage(false)}
            >
              From a topic
            </button>
            <button
              className={fromFootage ? "active" : ""}
              onClick={() => setFromFootage(true)}
            >
              Find Posts in My Footage
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const idea = fromFootage
                ? state.media
                    .filter((m) => m.collection === collection)
                    .map((m) => m.tags || m.name)
                    .join(", ")
                    .slice(0, 250)
                : topic;
              if (!idea) {
                notify("Add media or enter a topic first.");
                return;
              }
              setBusy(true);
              try {
                const r = await fetch("/api/ai", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ idea, audience, tone: goal }),
                });
                const data = await r.json();
                if (!r.ok) throw Error(data.error);
                setResults(data.concepts);
              } catch (e) {
                notify(
                  e instanceof Error ? e.message : "Could not load ideas.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {fromFootage ? (
              <>
                <Select
                  label="Your collection"
                  value={collection}
                  items={[...new Set(state.media.map((m) => m.collection))]}
                  onChange={setCollection}
                />
                <div className="footage-mini">
                  {state.media
                    .filter((m) => m.collection === collection)
                    .slice(0, 4)
                    .map((m) => (
                      <Thumbnail key={m.id} media={m} />
                    ))}
                </div>
                <p className="notice">
                  Demo uses file names and tags only. It does not inspect video,
                  image, or audio contents.
                </p>
              </>
            ) : (
              <Field label="What’s on your mind?">
                <textarea
                  required
                  maxLength={250}
                  placeholder="e.g. Building a small creative business"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </Field>
            )}
            <Select
              label="Your niche"
              value={niche}
              items={[
                "Lifestyle & everyday",
                "Education & learning",
                "Business & products",
                "Travel & food",
                "Art & design",
              ]}
              onChange={setNiche}
            />
            <Field label="Your audience">
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </Field>
            <Select
              label="Your objective"
              value={goal}
              items={[
                "Build community",
                "Educate",
                "Inspire",
                "Showcase a product",
              ]}
              onChange={setGoal}
            />
            <Button disabled={busy} type="submit">
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}{" "}
              Find a little inspiration
            </Button>
          </form>
        </section>
        <section className="ideas-results">
          <div className="row between">
            <h3>A few possible directions.</h3>
            <span className="badge">DEMO SUGGESTIONS</span>
          </div>
          {results.length ? (
            results.map((c, i) => (
              <article key={c.title} className="card">
                <span className="eyebrow">
                  IDEA 0{i + 1} · {c.duration}S · {state.brand.platform}
                </span>
                <h3>{c.title}</h3>
                <blockquote>{c.hook}</blockquote>
                <p>{c.outline.join(" → ")}</p>
                <p className="muted">{c.why}</p>
                {fromFootage && (
                  <small>
                    Relevant collection: {collection} · selected using metadata
                  </small>
                )}
                <div className="row between">
                  <Button variant="ghost" onClick={() => save(c.title)}>
                    <Save size={14} />
                    {state.ideas.includes(c.title) ? "Saved" : "Save idea"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => create(c.title, fromFootage)}
                  >
                    Create This Post <ArrowUpRight size={15} />
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty ideas-empty">
              <Lightbulb size={38} />
              <h2>Good ideas need a little room.</h2>
              <p>
                Share a topic or choose a collection.
                <br />
                Your story directions will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
      {state.ideas.length > 0 && (
        <section className="card saved-ideas">
          <h3>Your saved sparks</h3>
          {state.ideas.map((idea) => (
            <div key={idea} className="row between">
              <span>{idea}</span>
              <Button variant="ghost" onClick={() => create(idea)}>
                Create a post <ArrowUpRight size={14} />
              </Button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
function Publishing({
  state,
  update,
  open,
  notify,
}: {
  state: State;
  update: (p: Project) => void;
  open: (id: string) => void;
  notify: (s: string) => void;
}) {
  const [filter, setFilter] = useState("All posts"),
    [calendar, setCalendar] = useState(false);
  const projects = state.projects
    .filter((p) => filter === "All posts" || p.status === filter)
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    <>
      <div className="notice row">
        <Send size={18} />
        <span>
          No publishing integration is connected. Export your package to post
          manually. Dates are reminders, not scheduled publishing.
        </span>
      </div>
      <div className="filter-row">
        <div className="segmented">
          <button
            className={!calendar ? "active" : ""}
            onClick={() => setCalendar(false)}
          >
            All stories
          </button>
          <button
            className={calendar ? "active" : ""}
            onClick={() => setCalendar(true)}
          >
            <CalendarDays size={14} /> Content calendar
          </button>
        </div>
        <select
          aria-label="Filter publishing status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All posts", ...statuses].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className={calendar ? "calendar-list" : "publishing-grid"}>
        {projects.map((p) => (
          <article key={p.id} className="card publishing-card">
            <button onClick={() => open(p.id)} className="publishing-open">
              <Thumbnail
                media={state.media.find((m) => m.id === p.mediaIds[0])}
              />
              <div>
                <span className="eyebrow">
                  {calendar ? p.date || "NO DATE PLANNED" : p.platform}
                </span>
                <h3>{p.title}</h3>
                <span className="status">{p.status}</span>
              </div>
              <ArrowUpRight size={18} />
            </button>
            <p>
              {p.caption ||
                "A story in the making. Open your project to build a post package."}
            </p>
            <div className="two-col">
              <Field label="Planned date">
                <input
                  type="date"
                  value={p.date}
                  onChange={(e) => update({ ...p, date: e.target.value })}
                />
              </Field>
              <Select
                label="Status"
                value={p.status}
                items={statuses}
                onChange={(status) => {
                  if (
                    status === "Published" &&
                    !confirm(
                      "Have you published this post yourself? BRANDOS has no connected social integration.",
                    )
                  )
                    return;
                  update({ ...p, status: status as Status });
                  notify(
                    status === "Published"
                      ? "Recorded as manually published."
                      : "Status updated.",
                  );
                }}
              />
            </div>
            <Button variant="outline" onClick={() => open(p.id)}>
              Open project & exports <ArrowUpRight size={15} />
            </Button>
          </article>
        ))}
      </div>
      {!projects.length && (
        <div className="empty">
          <Send />
          <h2>Room for your next story.</h2>
          <p>Create a post, or choose another status filter.</p>
        </div>
      )}
    </>
  );
}
function BrandKit({ brand, save }: { brand: Brand; save: (b: Brand) => void }) {
  const [b, setB] = useState(brand),
    [error, setError] = useState("");
  return (
    <form
      className="brand-layout"
      onSubmit={(e) => {
        e.preventDefault();
        save(b);
      }}
    >
      <section className="card">
        <span className="eyebrow">YOUR CREATIVE SIGNATURE</span>
        <h2>A familiar feeling, every time.</h2>
        <p>
          These defaults are applied when you create a new project. You can
          always change them for each story.
        </p>
        <Field label="Brand accent">
          <div className="color-input">
            <input
              type="color"
              aria-label="Brand accent color"
              value={b.color}
              onChange={(e) => setB({ ...b, color: e.target.value })}
            />
            <span>{b.color}</span>
          </div>
        </Field>
        <Field label="Logo · PNG, JPEG, or WebP, up to 1 MB">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                file.size > 1024 * 1024 ||
                !["image/png", "image/jpeg", "image/webp"].includes(file.type)
              ) {
                setError("Choose a PNG, JPEG, or WebP under 1 MB.");
                return;
              }
              setError("");
              const reader = new FileReader();
              reader.onload = () => setB({ ...b, logo: String(reader.result) });
              reader.readAsDataURL(file);
            }}
          />
        </Field>
        {b.logo && (
          <div className="row">
            <img className="brand-logo" src={b.logo} alt="Your logo" />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setB({ ...b, logo: undefined })}
            >
              Remove logo
            </Button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="two-col">
          <Select
            label="Preferred typography"
            value={b.font}
            items={["Sans", "Serif"]}
            onChange={(font) => setB({ ...b, font })}
          />
          <Select
            label="Caption style"
            value={b.captionStyle}
            items={["Minimal", "Conversational", "Informative"]}
            onChange={(captionStyle) => setB({ ...b, captionStyle })}
          />
          <Select
            label="Tone of voice"
            value={b.tone}
            items={[
              "Warm & authentic",
              "Bold & energetic",
              "Calm & thoughtful",
              "Playful & casual",
              "Professional & clear",
            ]}
            onChange={(tone) => setB({ ...b, tone })}
          />
          <Select
            label="Editing preference"
            value={b.editing}
            items={[
              "Slow & intentional",
              "Quick & energetic",
              "Clean & minimal",
            ]}
            onChange={(editing) => setB({ ...b, editing })}
          />
          <Select
            label="Default platform"
            value={b.platform}
            items={["Instagram Reels", "YouTube Shorts", "TikTok"]}
            onChange={(platform) => setB({ ...b, platform })}
          />
          <Select
            label="Default dimensions"
            value={b.ratio}
            items={["9:16", "1:1", "16:9"]}
            onChange={(ratio) => setB({ ...b, ratio })}
          />
        </div>
        <Button type="submit">
          <Check size={16} /> Save brand kit
        </Button>
        <p className="notice">
          Accent colors apply to covers and audio-scene backgrounds. Logo and
          typography currently appear in preview only. Caption style and tone
          are saved creative preferences; demo templates are not a trained brand
          model.
        </p>
      </section>
      <aside className="brand-preview">
        <span className="eyebrow">A LITTLE PREVIEW</span>
        <div
          style={{ background: b.color, color: contrastText(b.color) }}
          className={`brand-swatch ${b.font === "Serif" ? "serif" : ""}`}
        >
          {b.logo ? (
            <img className="brand-logo" src={b.logo} alt="Brand logo preview" />
          ) : (
            <Sparkles />
          )}
          <h2>
            Small moments.
            <br />
            Your signature.
          </h2>
          <p>A story that feels like you.</p>
          <span>MADE WITH INTENTION.</span>
        </div>
        <p>Consistent. Considered. Completely yours.</p>
      </aside>
    </form>
  );
}
