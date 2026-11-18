import type { StockResult } from "./model";
// Built-in starting set: shapes, badges and callouts. They use currentColor so
// they can be recoloured like icons.
const shape = (name: string, box: string, body: string): StockResult => {
  const [w, h] = box.split(" ").map(Number);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="currentColor">${body}</svg>`;
  return {
    key: `shape:${name}`,
    kind: "shape",
    name,
    thumb: "",
    src: "",
    svg,
    aspect: w / h,
    creator: "UnStuck",
    source: "Built-in",
    link: "",
  };
};
export const shapes: StockResult[] = [
  shape("Rectangle", "160 100", '<rect width="160" height="100"/>'),
  shape("Rounded box", "160 100", '<rect width="160" height="100" rx="22"/>'),
  shape("Circle", "100 100", '<circle cx="50" cy="50" r="50"/>'),
  shape("Pill", "200 70", '<rect width="200" height="70" rx="35"/>'),
  shape(
    "Star",
    "100 96",
    '<path d="M50 0l14.7 31.6 34.3 4.4-25.3 23.8 6.7 34.2L50 77.2 19.6 94l6.7-34.2L1 36l34.3-4.4z"/>',
  ),
  shape("Arrow", "160 80", '<path d="M0 28h100V0l60 40-60 40V52H0z"/>'),
  shape("Line", "200 12", '<rect width="200" height="12" rx="6"/>'),
  shape(
    "Underline",
    "200 24",
    '<path d="M4 16C50 2 150 2 196 14" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>',
  ),
  shape(
    "Burst badge",
    "100 100",
    '<path d="M50 0l9 12 14-6 4 15 15 1-3 15 12 9-9 11 6 14-14 5-1 15-15-3-9 12-9-12-15 3-1-15-14-5 6-14-9-11 12-9-3-15 15-1 4-15 14 6z"/>',
  ),
  shape("Ribbon", "200 60", '<path d="M0 0h200l-22 30 22 30H0l22-30z"/>'),
  shape(
    "Speech bubble",
    "160 120",
    '<path d="M20 0h120a20 20 0 0 1 20 20v52a20 20 0 0 1-20 20H70l-36 28 8-28H20A20 20 0 0 1 0 72V20A20 20 0 0 1 20 0z"/>',
  ),
  shape(
    "Callout frame",
    "160 100",
    '<rect x="5" y="5" width="150" height="90" rx="16" fill="none" stroke="currentColor" stroke-width="10"/>',
  ),
  shape(
    "Check badge",
    "100 100",
    '<path fill-rule="evenodd" d="M50 0a50 50 0 1 0 0 100A50 50 0 0 0 50 0zm-8 72L22 52l9-9 11 11 27-27 9 9z"/>',
  ),
  shape(
    "Heart",
    "100 90",
    '<path d="M50 90C-20 44 6-6 50 22 94-6 120 44 50 90z"/>',
  ),
];
export const recolourable = (svg?: string) =>
  Boolean(svg && svg.includes("currentColor"));
// Turns an SVG element into something an <img> or the canvas can draw.
export const svgUrl = (svg: string, color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svg
      .replaceAll("currentColor", color)
      .replace(
        /<svg(?![^>]*\swidth=)/,
        '<svg width="512" height="512" preserveAspectRatio="xMidYMid meet"',
      ),
  )}`;
