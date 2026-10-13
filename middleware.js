// Agent layer: Markdown content negotiation + agent-friendly 404s.
// Browsers (Accept: text/html) pass straight through to the static site.
// Agents that ask for text/markdown get the Markdown twin of the page
// (/index.md for "/", /<path>.md otherwise) or a real 404 with a Markdown body.

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|mjs|map|mp4|webm|mov|woff2?|ttf|otf|txt|xml|md|json|pdf)$).*)'],
};

const MD = 'text/markdown; charset=utf-8';

function wantsMarkdown(accept) {
  if (!accept) return false;
  let md = -1;
  let html = -1;
  for (const part of accept.toLowerCase().split(',')) {
    const [type, ...params] = part.trim().split(';');
    const qParam = params.find((p) => p.trim().startsWith('q='));
    const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
    if (type === 'text/markdown' || type === 'text/x-markdown') md = Math.max(md, q);
    if (type === 'text/html') html = Math.max(html, q);
  }
  return md > 0 && md >= html;
}

function forwardHeaders(request, accept) {
  const headers = { accept };
  for (const name of ['cookie', 'x-vercel-protection-bypass', 'x-vercel-set-bypass-cookie']) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

function notFound(url) {
  const body = `# 404 — Page not found

There is no page at \`${url.pathname}\` on ${url.host}.

- Homepage (Markdown): ${url.origin}/index.md
- Site guide for AI agents: ${url.origin}/llms.txt
- All pages: ${url.origin}/sitemap.xml
`;
  return new Response(body, {
    status: 404,
    headers: { 'content-type': MD, vary: 'Accept', 'cache-control': 'public, max-age=0, must-revalidate' },
  });
}

export default async function middleware(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return;
  if (!wantsMarkdown(request.headers.get('accept'))) return;

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const twin = path === '/' ? '/index.md' : `${path}.md`;

  const md = await fetch(new URL(twin, url.origin), { headers: forwardHeaders(request, 'text/markdown') });
  if (md.ok) {
    return new Response(request.method === 'HEAD' ? null : await md.text(), {
      status: 200,
      headers: { 'content-type': MD, vary: 'Accept', 'cache-control': 'public, max-age=0, must-revalidate' },
    });
  }

  // No Markdown twin: serve the HTML page if it exists, otherwise a Markdown 404.
  const page = await fetch(url, { method: 'HEAD', headers: forwardHeaders(request, 'text/html'), redirect: 'manual' });
  if (page.status === 404) return notFound(url);
}
