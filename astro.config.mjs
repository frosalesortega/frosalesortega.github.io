import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL: public origin (production: https://frosalesortega.github.io/)
// SITE_BASE: path prefix, "/" for root hosting, "/~frosales/" for the institutional server
const site = process.env.SITE_URL || 'https://frosalesortega.github.io';
let base = process.env.SITE_BASE || '/';
if (!base.startsWith('/')) base = '/' + base;
if (!base.endsWith('/')) base += '/';

// Wrap every markdown table in a focusable, horizontally scrollable region (no dependency).
function rehypeWrapTables() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((c) => {
        if (c.type === 'element' && c.tagName === 'table') {
          return {
            type: 'element', tagName: 'div',
            properties: { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Table; scrolls horizontally on small screens' },
            children: [c],
          };
        }
        walk(c);
        return c;
      });
    };
    walk(tree);
  };
}

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: { rehypePlugins: [rehypeWrapTables] },
  integrations: [sitemap({ filter: (page) => !/\/about\/$/.test(page) })],
  devToolbar: { enabled: false },
});
