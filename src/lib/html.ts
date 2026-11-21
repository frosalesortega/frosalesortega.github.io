export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Marker used in content files for missing information. */
export const TO_COMPLETE = 'TO COMPLETE';

/** Wrap literal TO COMPLETE markers in a muted span. Input must already be trusted HTML. */
export function markToComplete(html: string): string {
  return html.replace(/TO COMPLETE/g, '<span class="to-complete">TO COMPLETE</span>');
}
