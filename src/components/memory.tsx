"use client";
import { useState } from "react";
import { Brain, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import type { Memory } from "@/lib/model";
const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
// Brand Memory: what UnStuck knows and has learned, all editable.
export default function MemoryEditor({
  memory,
  count,
  locked,
  save,
}: {
  memory: Memory;
  count: number;
  locked: boolean;
  save: (m: Memory) => void;
}) {
  const [m, setM] = useState({
    voice: memory.voice,
    dos: memory.dos.join("\n"),
    donts: memory.donts.join("\n"),
    hooks: memory.hooks.join("\n"),
  });
  const preferred = Object.entries(memory.styles).filter(([, n]) => n !== 0);
  return (
    <form
      className="card memory-card"
      onSubmit={(e) => {
        e.preventDefault();
        save({
          ...memory,
          voice: m.voice.trim(),
          dos: lines(m.dos),
          donts: lines(m.donts),
          hooks: lines(m.hooks),
        });
      }}
    >
      <span className="eyebrow">
        <Brain size={13} /> BRAND MEMORY
      </span>
      <h2>UnStuck remembers {count} things about this brand</h2>
      <p>
        Used in every video and updated each time you approve a video, reject
        one or request a change.
        {locked && " Brand Memory is part of the Pro and Premium plans."}
      </p>
      <fieldset disabled={locked}>
        <label>
          Voice: how the brand speaks
          <textarea
            maxLength={300}
            placeholder="e.g. Friendly and direct. Short sentences. No slang."
            value={m.voice}
            onChange={(e) => setM({ ...m, voice: e.target.value })}
          />
        </label>
        <div className="two-col">
          <label>
            Do’s, one per line
            <textarea
              placeholder="Mention free delivery"
              value={m.dos}
              onChange={(e) => setM({ ...m, dos: e.target.value })}
            />
          </label>
          <label>
            Don’ts, one per line
            <textarea
              placeholder="Never mention prices"
              value={m.donts}
              onChange={(e) => setM({ ...m, donts: e.target.value })}
            />
          </label>
        </div>
        <label>
          Approved hooks, one per line
          <textarea
            placeholder="Added automatically when you approve a video"
            value={m.hooks}
            onChange={(e) => setM({ ...m, hooks: e.target.value })}
          />
        </label>
        {(memory.learned.length > 0 || preferred.length > 0) && (
          <div className="memory-learned">
            <b>Learned from your approvals and requests</b>
            <ul>
              {preferred.map(([style, n]) => (
                <li key={style}>
                  “{style}” style:{" "}
                  {n > 0 ? `approved ${n}` : `passed over ${-n}`} time
                  {Math.abs(n) === 1 ? "" : "s"}
                </li>
              ))}
              {memory.learned.map((l) => (
                <li key={l.at + l.text}>
                  {l.text}
                  <button
                    type="button"
                    aria-label={`Forget: ${l.text}`}
                    title="Forget this"
                    onClick={() =>
                      save({
                        ...memory,
                        learned: memory.learned.filter((x) => x !== l),
                      })
                    }
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button type="submit">
          <Check size={16} /> Save Brand Memory
        </Button>
      </fieldset>
    </form>
  );
}
