"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
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
  Check,
  ChevronRight,
  HelpCircle,
  Film,
  Download,
  Trash2,
  X,
  ExternalLink,
  CheckCircle2,
  NotebookPen,
  Bot,
  WandSparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  initialState,
  newProject,
  autoEdit,
  normalizeState,
  suggestIdeas,
  type JournalEntry,
  type State,
  type Project,
  type Media,
  type Brand,
  type Status,
} from "@/lib/model";
import { getFile, download, deleteFile } from "@/lib/storage";
import { contrastText } from "@/lib/render";
import { supabase } from "@/lib/supabase";
import { pickFootage } from "@/lib/library";
import { MediaLibrary } from "./media";
import Dashboard, { ProjectCard } from "./dashboard";
import Editor from "./editor";
import Ideas from "./ideas";
import Journal from "./journal";
import Publishing from "./publishing";
const nav = [
  ["", "Journal", NotebookPen],
  ["create", "Create", Plus],
  ["projects", "My Projects", FolderOpen],
  ["media", "Media Library", Images],
  ["ideas", "Content Ideas", Lightbulb],
  ["publishing", "Publishing Hub", Send],
  ["insights", "Dashboard", LayoutDashboard],
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
        s = normalizeState(s);
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
      }
    }
    void load();
    let unsubscribe = () => {};
    if (supabase) {
      void supabase.auth.getUser().then(({ data }) => {
        if (alive) setAccount(data.user?.email || "");
      });
      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (alive) setAccount(session?.user?.email || "");
        },
      );
      unsubscribe = () => sub.subscription.unsubscribe();
    }
    return () => {
      alive = false;
      unsubscribe();
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
  // One click: pick an idea, match footage from the indexed library, build the full edit.
  const create = (idea = "", sample = false, date = "", ids?: string[]) => {
    if (!state) return;
    const topic =
      idea ||
      suggestIdeas(state, "", state.projects.length)[0]?.title ||
      "A slower kind of morning";
    const last = state.projects[0];
    const format = {
      platform: last?.platform || "Instagram Reels",
      ratio: last?.ratio || "9:16",
    };
    const matched = sample
      ? []
      : pickFootage(topic, state.media, format.ratio).map((m) => m.media.id);
    const mediaIds =
      ids ||
      (matched.length
        ? matched
        : state.media.filter((m) => m.sample).map((m) => m.id));
    const p = {
      ...autoEdit({ ...newProject(state.brand, topic), ...format, mediaIds }),
      date,
    };
    setState({ ...state, projects: [p, ...state.projects] });
    router.push(`/studio/create?id=${p.id}`);
  };
  // The week's journal clips, in order, with the notes as on-screen captions.
  const createFromJournal = () => {
    if (!state) return;
    const since = Date.now() - 7 * 864e5;
    const entries = state.journal.filter(
      (e) =>
        (e.kind === "video" || e.kind === "photo") &&
        Date.parse(e.created) >= since &&
        state.media.some((m) => m.id === e.id && m.url),
    );
    if (!entries.length) return;
    const title = `My week · ${new Date(entries[0].created).toLocaleDateString([], { day: "numeric", month: "short" })}–${new Date().toLocaleDateString([], { day: "numeric", month: "short" })}`;
    const last = state.projects[0];
    let p = autoEdit({
      ...newProject(state.brand, title),
      platform: last?.platform || "Instagram Reels",
      ratio: last?.ratio || "9:16",
      mediaIds: entries.slice(-6).map((e) => e.id),
    });
    p = {
      ...p,
      scenes: p.scenes.map((s, i) => {
        const e = entries.find((e) => e.id === s.mediaId);
        const note = e?.text
          .split(/[.!?\n]/)[0]
          .trim()
          .slice(0, 70);
        return {
          ...s,
          title: note || `Moment ${i + 1}`,
          text:
            note ||
            new Date(e?.created || Date.now()).toLocaleDateString([], {
              weekday: "long",
            }),
        };
      }),
      caption: `A week, in ${entries.length} small moments.\n\n${p.cta}`,
    };
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
      "Journal",
      "Capture a moment from your day. BRANDOS turns your journal into ideas and finished posts.",
    ],
    insights: [
      "Dashboard",
      "Your goal progress, trends, competitors and audience reactions in one place.",
    ],
    projects: [
      "My Projects",
      "Every post you’ve started. Open one to keep editing or export it.",
    ],
    media: [
      "Media Library",
      "Upload and organise the videos, photos and audio you use in your posts.",
    ],
    ideas: [
      "Content Ideas",
      "Ready-made post ideas. Pick one and BRANDOS builds the first edit for you.",
    ],
    journal: [
      "Journal",
      "Tell BRANDOS about your goals, why you post and where you are now — by text, voice or video.",
    ],
    publishing: [
      "Publishing Hub",
      "See what you’ve published and what’s due. Click a date for details.",
    ],
    brand: [
      "Brand Kit",
      "Set the colours, fonts and tone applied to every new post.",
    ],
    settings: ["Settings", "Manage your profile, backups and account."],
    agent: [
      "AI Agent",
      "Watch the agent plan, generate, edit, check and render a post, one tool call at a time.",
    ],
    create: [
      "Create",
      "BRANDOS builds a ready-to-post edit first. Then change anything you like.",
    ],
  };
  const head = subheads[view] || subheads[""];
  const journaled = state.journal.some(
    (e) => new Date(e.created).toDateString() === new Date().toDateString(),
  );
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
              {key === "" && !journaled && (
                <span className="nav-dot" aria-hidden="true" />
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
            {view !== "" && view !== "journal" && !journaled && (
              <Link className="journal-nudge" href="/studio">
                <NotebookPen size={13} /> Add today’s moment
              </Link>
            )}
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
              <h1>{head[0]}</h1>
              <p>{head[1]}</p>
            </div>
            {view !== "create" && (
              <Button onClick={() => create()}>
                <WandSparkles size={17} /> Create New Post
              </Button>
            )}
          </div>
          {view === "insights" && (
            <Dashboard
              state={state}
              create={create}
              open={(id) => router.push(`/studio/create?id=${id}`)}
              go={(route) => router.push("/studio/" + route)}
              setGoal={(goal) => setState({ ...state, goal })}
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
              onMove={(ids, collection) =>
                setState({
                  ...state,
                  media: state.media.map((m) =>
                    ids.includes(m.id) ? { ...m, collection } : m,
                  ),
                })
              }
              onMake={(ids) => create("", false, "", ids)}
              onDelete={async (id) => {
                if (
                  state.projects.some((p) =>
                    p.scenes.some((s) => s.mediaId === id),
                  )
                ) {
                  notify(
                    "This file is used in a post. Swap it out of those scenes first.",
                  );
                  return;
                }
                try {
                  await deleteFile(id);
                  setState({
                    ...state,
                    media: state.media.filter((m) => m.id !== id),
                    // A journal entry keeps its words when its clip is deleted.
                    journal: state.journal.flatMap((e): JournalEntry[] =>
                      e.id !== id
                        ? [e]
                        : e.text
                          ? [{ ...e, kind: "text" }]
                          : [],
                    ),
                  });
                  notify("Media deleted.");
                } catch {
                  notify("Could not delete this media. Please try again.");
                }
              }}
              notify={notify}
            />
          )}
          {view === "ideas" && (
            <Ideas
              state={state}
              save={(idea) => {
                if (!state.ideas.includes(idea))
                  setState({ ...state, ideas: [...state.ideas, idea] });
                notify("Idea saved.");
              }}
              create={create}
              go={(route) => router.push("/studio/" + route)}
            />
          )}
          {(view === "" || view === "journal") && (
            <Journal
              entries={state.journal}
              media={state.media}
              add={(entry, item) =>
                setState((s) =>
                  s
                    ? {
                        ...s,
                        journal: [...s.journal, entry],
                        media: item ? [...s.media, item] : s.media,
                      }
                    : s,
                )
              }
              remove={(id) => {
                const used = state.projects.some((p) =>
                  p.scenes.some((s) => s.mediaId === id),
                );
                if (!used) void deleteFile(id).catch(() => {});
                setState({
                  ...state,
                  journal: state.journal.filter((e) => e.id !== id),
                  media: used
                    ? state.media
                    : state.media.filter((m) => m.id !== id),
                });
              }}
              makeReel={createFromJournal}
              notify={notify}
            />
          )}
          {view === "publishing" && (
            <Publishing
              state={state}
              update={updateProject}
              open={(id) => router.push(`/studio/create?id=${id}`)}
              create={create}
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
                          setState(normalizeState(data.data));
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
                        setState(normalizeState(s));
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
              <Editor
                key={p.id}
                project={p}
                state={state}
                update={updateProject}
                addMedia={addMedia}
                notify={notify}
                finish={() => router.push("/studio/projects")}
              />
            ) : (
              <section className="create-start">
                <h2>One click to a finished first edit.</h2>
                <p>
                  BRANDOS picks an idea and your footage, then adds scenes,
                  transitions, music and subtitles. You edit after, not before.
                </p>
                <div className="row wrap">
                  <Button onClick={() => create()}>
                    <WandSparkles size={16} /> Make a post for me
                  </Button>
                  <Button variant="outline" onClick={() => create("", true)}>
                    <Film size={16} /> Use the sample footage
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/studio/ideas")}
                  >
                    <Lightbulb size={16} /> Pick an idea first
                  </Button>
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
            <h2>How BRANDOS works</h2>
            <ol className="tour-steps">
              {[
                [
                  "Click Create New Post",
                  "BRANDOS builds a finished edit: scenes, transitions, music, subtitles.",
                ],
                [
                  "Change anything",
                  "Edit every element next to the live preview.",
                ],
                [
                  "Export and schedule",
                  "Download the video and put it on your calendar.",
                ],
                [
                  "Journal when you like",
                  "Notes about your goals make the ideas more personal.",
                ],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <b>{title}</b>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="notice">
              Demo Mode: edits and ideas use templates, not an AI model.
              Analytics are sample data. Your work stays on this device unless
              you choose cloud backup.
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
            label="Video typography"
            value={b.font}
            items={["Display", "Sans", "Serif"]}
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
          <Field label="Your handle (shown as the video watermark)">
            <input
              maxLength={30}
              placeholder="e.g. studio.maya"
              value={b.handle || ""}
              onChange={(e) => setB({ ...b, handle: e.target.value })}
            />
          </Field>
        </div>
        <Button type="submit">
          <Check size={16} /> Save brand kit
        </Button>
        <p className="notice">
          Your colour, typography, logo and handle are built into every video:
          title blocks, highlighted captions, the end card and the watermark.
          Platform and shape are chosen per post, in the editor.
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
