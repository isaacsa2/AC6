// Cloudflare Worker que serve arquivos estáticos da pasta /public
// usando o binding nativo de Assets (configurado no wrangler.toml).

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = "https://ac6.isaacsa2.online";

    if (url.pathname === "/sitemap.xml") {
      const lastmod = "2026-07-04";
      const urls = [
        { loc: `${origin}/`, priority: "1.0" },
        { loc: `${origin}/byinspare/`, priority: "0.8" },
      ];
      const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
      return new Response(body, {
        headers: {
          "content-type": "application/xml; charset=UTF-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/robots.txt") {
      const body = `User-agent: *
Allow: /
Disallow: /chassis/

Sitemap: ${origin}/sitemap.xml
`;
      return new Response(body, {
        headers: {
          "content-type": "text/plain; charset=UTF-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
