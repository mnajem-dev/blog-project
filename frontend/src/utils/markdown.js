import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true });

export function renderMarkdown(source) {
  return DOMPurify.sanitize(marked.parse(source || ''));
}
