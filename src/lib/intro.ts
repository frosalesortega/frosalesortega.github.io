import { escapeHtml } from './html';
import { href } from './url';

/** Turn the `intro` text of site.yaml into HTML: [text](/path/) becomes a base-aware internal link. */
export function renderIntro(text: string): string {
  return escapeHtml(text.trim()).replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (_, label: string, path: string) => `<a href="${href(path)}">${label}</a>`);
}
