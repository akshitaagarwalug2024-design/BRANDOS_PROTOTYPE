"use client";
import { Minus, Plus } from "lucide-react";
import { fill, stops } from "@/lib/colour";
// Picks one colour, or a blend of two or three.
export function ColourPick({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const list = stops(value).length ? stops(value) : ["#285bdb"];
  const set = (next: string[]) => onChange(next.join(","));
  return (
    <div className="colour-pick">
      {list.map((colour, i) => (
        <input
          key={i}
          type="color"
          aria-label={i ? `${label} ${i + 1}` : label}
          value={colour}
          onChange={(e) =>
            set(list.map((c, n) => (n === i ? e.target.value : c)))
          }
        />
      ))}
      {list.length < 3 && (
        <button
          type="button"
          title="Blend in another colour"
          aria-label="Blend in another colour"
          onClick={() => set([...list, list.at(-1)!])}
        >
          <Plus size={13} />
        </button>
      )}
      {list.length > 1 && (
        <button
          type="button"
          title="Remove the last colour"
          aria-label="Remove the last colour"
          onClick={() => set(list.slice(0, -1))}
        >
          <Minus size={13} />
        </button>
      )}
      <span className="colour-swatch" style={{ background: fill(value) }} />
      <small>{list.length > 1 ? `${list.length}-colour blend` : list[0]}</small>
    </div>
  );
}
