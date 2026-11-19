import type { ItemKind, StockResult } from "@/lib/model";
// One search endpoint for every stock and element provider. Each provider's key
// is read from the server environment; a missing key only disables its own tab.
type Search = (q: string) => Promise<StockResult[]>;
const get = async (url: string, headers: Record<string, string> = {}) => {
  const r = await fetch(url, { headers, next: { revalidate: 3600 } });
  if (!r.ok) throw Error(`Provider returned ${r.status}`);
  return r.json();
};
const e = encodeURIComponent;
const pexels: Record<string, Search> = {
  photo: async (q) =>
    (
      await get(`https://api.pexels.com/v1/search?query=${e(q)}&per_page=30`, {
        Authorization: process.env.PEXELS_API_KEY!,
      })
    ).photos.map(
      (p: {
        id: number;
        alt: string;
        width: number;
        height: number;
        url: string;
        photographer: string;
        src: { medium: string; large: string };
      }): StockResult => ({
        key: `pexels:photo:${p.id}`,
        kind: "photo",
        name: p.alt || "Photo",
        thumb: p.src.medium,
        src: p.src.large,
        aspect: p.width / p.height,
        creator: p.photographer,
        source: "Pexels",
        link: p.url,
      }),
    ),
  video: async (q) =>
    (
      await get(
        `https://api.pexels.com/videos/search?query=${e(q)}&per_page=24`,
        { Authorization: process.env.PEXELS_API_KEY! },
      )
    ).videos.flatMap(
      (v: {
        id: number;
        width: number;
        height: number;
        url: string;
        image: string;
        user: { name: string };
        video_files: { link: string; width: number; file_type: string }[];
      }): StockResult[] => {
        // Smallest MP4 that is still at least 540 wide keeps downloads quick.
        const file = v.video_files
          .filter((f) => f.file_type === "video/mp4")
          .sort((a, b) => a.width - b.width)
          .find((f, i, all) => f.width >= 540 || i === all.length - 1);
        return file
          ? [
              {
                key: `pexels:video:${v.id}`,
                kind: "video",
                name: "Video",
                thumb: v.image,
                src: file.link,
                aspect: v.width / v.height,
                creator: v.user.name,
                source: "Pexels",
                link: v.url,
              },
            ]
          : [];
      },
    ),
};
const pixabay =
  (kind: ItemKind, type: string): Search =>
  async (q) =>
    (
      await get(
        `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${e(q)}&image_type=${type}&per_page=30&safesearch=true`,
      )
    ).hits.map(
      (h: {
        id: number;
        tags: string;
        pageURL: string;
        webformatURL: string;
        largeImageURL: string;
        imageWidth: number;
        imageHeight: number;
        user: string;
      }): StockResult => ({
        key: `pixabay:${kind}:${h.id}`,
        kind,
        name: h.tags,
        thumb: h.webformatURL,
        src: h.largeImageURL,
        aspect: h.imageWidth / h.imageHeight,
        creator: h.user,
        source: "Pixabay",
        link: h.pageURL,
      }),
    );
const pixabayVideo: Search = async (q) =>
  (
    await get(
      `https://pixabay.com/api/videos/?key=${process.env.PIXABAY_API_KEY}&q=${e(q)}&per_page=24&safesearch=true`,
    )
  ).hits.map(
    (h: {
      id: number;
      tags: string;
      pageURL: string;
      user: string;
      videos: {
        small: {
          url: string;
          width: number;
          height: number;
          thumbnail: string;
        };
      };
    }): StockResult => ({
      key: `pixabay:video:${h.id}`,
      kind: "video",
      name: h.tags,
      thumb: h.videos.small.thumbnail,
      src: h.videos.small.url,
      aspect: h.videos.small.width / h.videos.small.height,
      creator: h.user,
      source: "Pixabay",
      link: h.pageURL,
    }),
  );
const giphy: Search = async (q) =>
  (
    await get(
      `https://api.giphy.com/v1/stickers/search?api_key=${process.env.GIPHY_API_KEY}&q=${e(q)}&limit=30&rating=g`,
    )
  ).data.map(
    (g: {
      id: string;
      title: string;
      url: string;
      username: string;
      user?: { display_name: string };
      images: { fixed_width: { url: string; width: string; height: string } };
    }): StockResult => ({
      key: `giphy:${g.id}`,
      kind: "sticker",
      name: g.title || "Sticker",
      thumb: g.images.fixed_width.url,
      src: g.images.fixed_width.url,
      aspect:
        Number(g.images.fixed_width.width) /
        Number(g.images.fixed_width.height),
      creator: g.user?.display_name || g.username || "GIPHY",
      source: "GIPHY",
      link: g.url,
    }),
  );
const iconify: Search = async (q) => {
  const { icons } = await get(
    `https://api.iconify.design/search?query=${e(q)}&limit=36`,
  );
  return Promise.all(
    (icons as string[]).map(async (id): Promise<StockResult> => {
      const [set, name] = id.split(":");
      const svg = await (
        await fetch(`https://api.iconify.design/${set}/${name}.svg`, {
          next: { revalidate: 86400 },
        })
      ).text();
      return {
        key: `iconify:${id}`,
        kind: "icon",
        name: name.replaceAll("-", " "),
        thumb: "",
        src: "",
        svg,
        aspect: 1,
        creator: set,
        source: "Iconify",
        link: `https://icon-sets.iconify.design/${set}/?icon-filter=${name}`,
      };
    }),
  );
};
const has = (name: string) => Boolean(process.env[name]);
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const kind = params.get("kind") || "",
    q = (params.get("q") || "").trim().slice(0, 80);
  if (!q) return Response.json({ results: [] });
  // Which keys can serve this tab, in order of preference.
  const plan: Record<string, [string, Search][]> = {
    photo: [
      ["PEXELS_API_KEY", pexels.photo],
      ["PIXABAY_API_KEY", pixabay("photo", "photo")],
    ],
    video: [
      ["PEXELS_API_KEY", pexels.video],
      ["PIXABAY_API_KEY", pixabayVideo],
    ],
    sticker: [["GIPHY_API_KEY", giphy]],
    illustration: [["PIXABAY_API_KEY", pixabay("illustration", "vector")]],
    icon: [["", iconify]],
  };
  const options = plan[kind];
  if (!options)
    return Response.json({ error: "Unknown search type" }, { status: 400 });
  const ready = options.filter(([key]) => !key || has(key));
  if (!ready.length)
    return Response.json({
      results: [],
      connect: options.map(([key]) => key),
    });
  try {
    const lists = await Promise.all(ready.map(([, search]) => search(q)));
    return Response.json({ results: lists.flat() });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 502 },
    );
  }
}
