// A colour value is one hex colour, or two or three joined by commas for a
// gradient, e.g. "#285bdb,#7fa2ff".
export const stops = (value: string) =>
  (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^#[0-9a-f]{6}$/i.test(s))
    .slice(0, 3);
export const first = (value: string) => stops(value)[0] || "#285bdb";
// The same value as a CSS background.
export const fill = (value: string) => {
  const list = stops(value);
  return list.length > 1
    ? `linear-gradient(135deg, ${list.join(", ")})`
    : first(value);
};
