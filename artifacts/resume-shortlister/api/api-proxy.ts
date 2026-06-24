import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const railwayUrl = process.env.RAILWAY_API_URL;

  if (!railwayUrl) {
    return res.status(503).json({
      error: "RAILWAY_API_URL environment variable is not set. Add it in your Vercel project settings.",
    });
  }

  const path = (req.query.path as string) ?? "";
  const target = `${railwayUrl.replace(/\/$/, "")}/api/${path}`;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== "path") {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  const url = qs ? `${target}?${qs}` : target;

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? JSON.stringify(req.body)
      : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body,
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const data = contentType.includes("application/json")
    ? await upstream.json()
    : await upstream.text();

  res.status(upstream.status).json(data);
}
