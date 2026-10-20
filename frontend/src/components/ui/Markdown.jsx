import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Markdown({ text, className = '' }) {
  if (!text) return null;
  const classes = ['ui-markdown', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(text)}</ReactMarkdown>
    </div>
  );
}
