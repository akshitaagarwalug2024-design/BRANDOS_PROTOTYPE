"use client";
import { useState } from "react";
import {
  Bookmark,
  Film,
  LoaderCircle,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  options,
  type Item,
  type ItemKind,
  type Project,
  type StockResult,
  type State,
} from "@/lib/model";
import { recolourable, shapes, svgUrl } from "@/lib/shapes";
const kinds: [ItemKind, string][] = [
  ["photo", "Photos"],
  ["video", "Videos"],
  ["sticker", "Stickers/GIFs"],
  ["icon", "Icons"],
  ["illustration", "Illustrations"],
  ["shape", "Shapes/Graphics"],
];
const keyNames: Record<string, string> = {
  PEXELS_API_KEY: "Pexels",
  PIXABAY_API_KEY: "Pixabay",
  GIPHY_API_KEY: "GIPHY",
};
const picture = (r: StockResult) =>
  r.svg ? svgUrl(r.svg, "#1c2638") : r.thumb;
export function StockPanel({
  start,
  stock,
  busy,
  onAdd,
  onScene,
  onStock,
}: {
  start: ItemKind;
  stock: State["stock"];
  busy: string;
  onAdd: (r: StockResult) => void;
  onScene: (r: StockResult) => void;
  onStock: (s: State["stock"]) => void;
}) {
  const [kind, setKind] = useState<ItemKind>(start),
    [list, setList] = useState("search"),
    [q, setQ] = useState(""),
    [results, setResults] = useState<StockResult[]>([]),
    [connect, setConnect] = useState<string[]>([]),
    [status, setStatus] = useState("");
  const search = async (nextKind = kind, text = q) => {
    setList("search");
    setConnect([]);
    setStatus("");
    if (nextKind === "shape") {
      setResults(
        shapes.filter((s) =>
          s.name.toLowerCase().includes(text.trim().toLowerCase()),
        ),
      );
      return;
    }
    if (!text.trim()) return setResults([]);
    setStatus("loading");
    try {
      const r = await fetch(
        `/api/stock?kind=${nextKind}&q=${encodeURIComponent(text)}`,
      );
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setResults(data.results);
      setConnect(data.connect || []);
      setStatus(
        data.results.length || data.connect
          ? ""
          : "No results. Try another word.",
      );
    } catch {
      setResults([]);
      setStatus("Search is unavailable right now. Other tabs still work.");
    }
  };
  const toggle = (name: "favourites" | "brand", r: StockResult) =>
    onStock({
      ...stock,
      [name]: stock[name].some((x) => x.key === r.key)
        ? stock[name].filter((x) => x.key !== r.key)
        : [r, ...stock[name]].slice(0, 60),
    });
  const shown =
    list === "search"
      ? kind === "shape" && !results.length && !q
        ? shapes
        : results
      : stock[list as "recent" | "favourites" | "brand"];
  return (
    <div className="stock">
      <form
        className="stock-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <Search size={15} />
        <input
          aria-label="Search stock and elements"
          placeholder="Search photos, videos, stickers, icons and graphics"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button size="sm" type="submit">
          Search
        </Button>
      </form>
      <div className="stock-kinds" role="tablist" aria-label="Type">
        {kinds.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={list === "search" && kind === key}
            className={list === "search" && kind === key ? "active" : ""}
            onClick={() => {
              setKind(key);
              setResults([]);
              void search(key);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="stock-kinds lists" role="group" aria-label="Collections">
        {(
          [
            ["recent", "Recently used"],
            ["favourites", "Favourites"],
            ["brand", "Brand"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={list === key}
            className={list === key ? "active" : ""}
            onClick={() => setList(list === key ? "search" : key)}
          >
            {label} <span>{stock[key].length}</span>
          </button>
        ))}
      </div>
      {list === "search" && connect.length > 0 && (
        <p className="notice stock-connect">
          <b>
            Connect {connect.map((k) => keyNames[k]).join(" or ")} to search{" "}
            {kinds.find(([k]) => k === kind)![1].toLowerCase()}.
          </b>{" "}
          Add {connect.join(" or ")} to the server environment. The other tabs
          keep working without it.
        </p>
      )}
      {status === "loading" ? (
        <p className="muted">
          <LoaderCircle className="spin" size={14} /> Searching…
        </p>
      ) : (
        list === "search" && status && <p className="muted">{status}</p>
      )}
      {list !== "search" && !shown.length && (
        <p className="muted">
          {list === "recent"
            ? "Items you add to a video appear here."
            : list === "favourites"
              ? "Star an item to keep it here."
              : "Save items to Brand to reuse them across posts."}
        </p>
      )}
      <div className="stock-grid">
        {shown.map((r) => (
          <div key={r.key} className="stock-cell">
            <button
              className="stock-add"
              title={`Add ${r.name}${r.creator ? ` · ${r.creator}, ${r.source}` : ""}`}
              aria-label={`Add ${r.name}`}
              disabled={busy === r.key}
              onClick={() => onAdd(r)}
            >
              {busy === r.key ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <img src={picture(r)} alt="" loading="lazy" />
              )}
              {r.kind === "video" && <Film className="stock-film" size={13} />}
            </button>
            <div className="stock-tools">
              <button
                aria-label={`Favourite ${r.name}`}
                aria-pressed={stock.favourites.some((x) => x.key === r.key)}
                title="Favourite"
                onClick={() => toggle("favourites", r)}
              >
                <Star size={13} />
              </button>
              <button
                aria-label={`Save ${r.name} to Brand`}
                aria-pressed={stock.brand.some((x) => x.key === r.key)}
                title="Save to Brand"
                onClick={() => toggle("brand", r)}
              >
                <Bookmark size={13} />
              </button>
              {(r.kind === "photo" || r.kind === "video") && (
                <button
                  aria-label={`Use ${r.name} as a scene`}
                  title="Use as a new scene"
                  onClick={() => onScene(r)}
                >
                  <Film size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function ItemControls({
  item,
  project,
  change,
  remove,
}: {
  item: Item;
  project: Project;
  change: (v: Partial<Item>) => void;
  remove: () => void;
}) {
  const range = (
    label: string,
    key: "x" | "y" | "w" | "rot",
    min: number,
    max: number,
    step: number,
  ) => (
    <label>
      {label}
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={item[key]}
        onChange={(e) => change({ [key]: Number(e.target.value) })}
      />
    </label>
  );
  return (
    <section className="item-controls" aria-label="Selected item">
      <div className="row between">
        <b>
          {item.name} <small>· drag it on the preview to move</small>
        </b>
        <Button size="sm" variant="ghost" onClick={remove}>
          <Trash2 size={13} /> Delete
        </Button>
      </div>
      <div className="item-grid">
        {range("Size", "w", 0.05, 1.2, 0.01)}
        {range("Rotate", "rot", -180, 180, 1)}
        {range("Left to right", "x", 0, 1, 0.01)}
        {range("Top to bottom", "y", 0, 1, 0.01)}
        <label>
          Animation
          <select
            aria-label="Item animation"
            value={item.anim}
            onChange={(e) => change({ anim: e.target.value })}
          >
            {options.itemAnim.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          Shown on
          <select
            aria-label="Item scenes"
            value={item.scene}
            onChange={(e) => change({ scene: e.target.value })}
          >
            <option value="all">Every scene</option>
            {project.scenes.map((s, i) => (
              <option key={s.id} value={s.id}>
                Scene {i + 1} only
              </option>
            ))}
          </select>
        </label>
        {recolourable(item.svg) && (
          <label>
            Colour
            <input
              type="color"
              aria-label="Item colour"
              value={item.color}
              onChange={(e) => change({ color: e.target.value })}
            />
          </label>
        )}
      </div>
      {item.source !== "Built-in" && (
        <small className="muted">
          {item.creator} · {item.source}
        </small>
      )}
    </section>
  );
}
