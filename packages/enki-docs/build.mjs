import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  cpSync,
  rmSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { readGuides } from './content.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const origin = 'https://docs.enki.now';
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const groups = [
  'Comece aqui',
  'Relacionamentos',
  'Seu jeito de trabalhar',
  'Dados bem organizados',
  'Acompanhe a operação',
  'Conexões e automações',
  'Agentes e integrações',
  'Administração',
  'Transparência',
];
const pages = readGuides(join(root, 'content'));
pages.sort(
  (a, b) =>
    groups.indexOf(a.group) - groups.indexOf(b.group) ||
    (a.slug === 'comecar'
      ? -1
      : b.slug === 'comecar'
        ? 1
        : a.title.localeCompare(b.title, 'pt-BR')),
);
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});
const headingId = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
markdown.renderer.rules.heading_open = (tokens, index, options, env, self) => {
  tokens[index].attrSet('id', headingId(tokens[index + 1].content));
  return self.renderToken(tokens, index, options);
};
const sidebar = (active) =>
  groups
    .map(
      (group) =>
        `<section class="nav-group"><h2>${group}</h2>${pages
          .filter((p) => p.group === group)
          .map(
            (p) =>
              `<a href="/${p.slug}" ${p.slug === active ? 'aria-current="page"' : ''}>${escape(p.title)}</a>`,
          )
          .join('')}</section>`,
    )
    .join('');
const linkCard = (slug, number) => {
  const p = pages.find((p) => p.slug === slug);
  return `<a class="guide-card" href="/${p.slug}"><span class="card-number">${number}</span><h3>${p.title}<span aria-hidden="true">↗</span></h3><p>${p.description}</p></a>`;
};
const searchDialog = `<dialog id="search-dialog" aria-labelledby="search-title"><div class="search-top"><h2 id="search-title">O que você quer fazer?</h2><button type="button" data-close-search aria-label="Fechar busca">×</button></div><label for="search-input" class="sr-only">Buscar na documentação</label><input id="search-input" type="search" placeholder="Ex.: importar empresas, permissões…" autocomplete="off"><p id="search-status" role="status"></p><ul id="search-results"></ul></dialog>`;
function shell({ title, description, path = '', body, toc = '' }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Enki</title><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#f8f6e9"><link rel="canonical" href="${origin}/${path}"><meta property="og:title" content="${escape(title)} · Enki"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><link rel="icon" href="/brand/enki-logo.svg" type="image/svg+xml"><link rel="stylesheet" href="/fonts.css"><link rel="stylesheet" href="/style.css"><script src="/app.js" defer></script></head><body><a class="skip-link" href="#conteudo">Pular para o conteúdo</a><header class="topbar"><a class="brand" href="/" aria-label="Documentação Enki, início"><img src="/brand/enki-logo.svg" alt="Enki" width="98" height="46"><span>GUIAS</span></a><button class="search-trigger" type="button" data-open-search><span>Buscar na documentação</span><kbd>⌘ K</kbd></button><a class="app-link" href="https://app.enki.now">Abrir Enki <span aria-hidden="true">↗</span></a><button type="button" class="menu-toggle" aria-controls="navigation" aria-expanded="false">Menu</button></header><div class="layout"><aside id="navigation" aria-label="Navegação da documentação"><a class="nav-home" href="/" ${!path ? 'aria-current="page"' : ''}>Visão geral <span>↗</span></a><nav>${sidebar(path)}</nav><div class="nav-footer">Relacionamentos<br>que continuam.</div></aside><main id="conteudo" tabindex="-1">${body}<footer class="page-footer"><span>ENKI · GUIA DA PLATAFORMA</span><a href="/licencas">Código e licenças</a><a href="/privacidade">Privacidade e dados</a></footer></main>${toc}</div>${searchDialog}</body></html>`;
}
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(join(root, 'public'), output, { recursive: true });
const brandSource = join(root, '../twenty-front/public/brand');
mkdirSync(join(output, 'brand'), { recursive: true });
cpSync(join(brandSource, 'enki-logo.svg'), join(output, 'brand/enki-logo.svg'));
// Separate fonts allow the browser to fetch only the faces used by the page.
let fonts = readFileSync(join(brandSource, 'enki-fonts.css'), 'utf8');
let fontIndex = 0;
fonts = fonts.replace(
  /data:font\/woff2;base64,([A-Za-z0-9+/=]+)/g,
  (_, data) => {
    const name = `font-${fontIndex++}.woff2`;
    writeFileSync(join(output, name), Buffer.from(data, 'base64'));
    return `/${name}`;
  },
);
writeFileSync(join(output, 'fonts.css'), fonts);
writeFileSync(
  join(output, 'index.html'),
  shell({
    title: 'Seu guia para trabalhar melhor',
    description:
      'Guias práticos em português para empresas, pessoas, oportunidades, automações e agentes na Enki.',
    body: `<div class="home"><div class="eyebrow">O CONTEXTO CERTO. O PRÓXIMO PASSO.</div><section class="hero"><div><h1>MENOS DÚVIDA.<br>MAIS MOVIMENTO<span>.</span></h1><p>Da primeira empresa ao próximo grande relacionamento.<br>Encontre seu caminho na Enki.</p><a class="primary" href="/comecar">Começar com a Enki <span>↗</span></a></div><div class="hero-note"><span class="note-kicker">SEU GUIA DE BOLSO</span><div class="note-mark" aria-hidden="true">e.</div><strong>Seu time.<br>Seu contexto.<br>Tudo conectado.</strong><span class="note-bottom">FEITO PARA USAR, TODOS OS DIAS.</span></div></section><div class="section-title"><h2>O que você quer fazer hoje?</h2><span>01 — NA PRÁTICA</span></div><div class="card-grid">${linkCard('relacionamentos/empresas', '01')}${linkCard('relacionamentos/oportunidades', '02')}${linkCard('dados/importar', '03')}${linkCard('paineis', '04')}${linkCard('automacoes', '05')}${linkCard('ia', '06')}</div><section class="help-strip"><div><span class="eyebrow">UM TIME BEM PREPARADO</span><h2>Clareza para quem usa.<br>Controle para quem administra.</h2></div><div><a href="/configuracoes/membros">Convidar meu time <span>↗</span></a><a href="/configuracoes/permissoes">Organizar permissões <span>↗</span></a><a href="/integracoes/api">Conectar outras ferramentas <span>↗</span></a><a href="/ajuda">Resolver um problema <span>↗</span></a></div></section></div>`,
  }),
);
for (const [index, page] of pages.entries()) {
  const headings = markdown
    .parse(page.body, {})
    .flatMap((token, i, all) =>
      token.type === 'heading_open' && token.tag === 'h2'
        ? [all[i + 1].content]
        : [],
    );
  const next = pages[index + 1];
  const body = `<article class="article"><div class="breadcrumb"><a href="/">Guias</a><span>/</span>${escape(page.group)}</div><header class="article-header"><span class="eyebrow">${escape(page.group)}</span><h1>${escape(page.title)}</h1><p>${escape(page.description)}</p></header><div class="prose">${markdown.render(page.body)}</div>${next ? `<a class="next-guide" href="/${next.slug}"><span>PRÓXIMO GUIA</span><strong>${next.title} ↗</strong></a>` : ''}</article>`;
  const target = join(output, page.slug, 'index.html');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    shell({
      ...page,
      path: page.slug,
      body,
      toc: `<aside class="toc"><p>NESTA PÁGINA</p>${headings.map((h) => `<a href="#${headingId(h)}">${escape(h)}</a>`).join('')}</aside>`,
    }),
  );
}
writeFileSync(
  join(output, 'search.json'),
  JSON.stringify(
    pages.map(({ slug, title, description, body }) => ({
      slug,
      title,
      description,
      body,
    })),
  ),
);
writeFileSync(
  join(output, '404.html'),
  shell({
    title: 'Guia não encontrado',
    description: 'Encontre o guia que você procura na documentação Enki.',
    body: `<article class="article"><div class="eyebrow">CAMINHO NOVO</div><h1>Vamos encontrar o seu guia.</h1><p>Este endereço não está disponível. Use a busca ou volte para a visão geral.</p><a class="primary" href="/">Ver todos os guias ↗</a></article>`,
  }),
);
writeFileSync(
  join(output, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
writeFileSync(
  join(output, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...pages.map((p) => p.slug)].map((slug) => `<url><loc>${origin}/${slug}</loc></url>`).join('')}</urlset>`,
);
const legacyGroups = {
  'getting-started': 'comecar',
  'data-model': 'modelo-de-dados',
  'data-migration': 'dados/importar',
  'views-pipelines': 'visualizacoes',
  'calendar-emails': 'contas',
  'email-campaigns': 'contas/campanhas',
  dashboards: 'paineis',
  workflows: 'automacoes',
  ai: 'ia',
  'permissions-access': 'configuracoes/permissoes',
  settings: 'configuracoes',
  layout: 'visualizacoes/colunas',
  billing: 'sobre',
  legal: 'privacidade',
};
const redirects = [
  ...Object.entries(legacyGroups).map(([from, to]) => ({
    source: `/user-guide/${from}/:path*`,
    destination: `/${to}`,
    permanent: true,
  })),
  {
    source: '/user-guide/introduction',
    destination: '/comecar',
    permanent: true,
  },
  {
    source: '/developers/:path*',
    destination: '/integracoes/api',
    permanent: true,
  },
  {
    source: '/developer-docs/:path*',
    destination: '/integracoes/api',
    permanent: true,
  },
];
writeFileSync(
  join(output, 'vercel.json'),
  JSON.stringify(
    {
      cleanUrls: true,
      trailingSlash: false,
      redirects,
      headers: [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Content-Security-Policy',
              value:
                "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
            },
          ],
        },
      ],
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ pages: pages.length, fonts: fontIndex, output }));
