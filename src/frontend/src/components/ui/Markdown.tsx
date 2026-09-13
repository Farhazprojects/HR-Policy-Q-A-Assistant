import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

/**
 * Renders a model's answer, which arrives as Markdown (bold amounts, bulleted
 * entitlements, occasionally a table).
 *
 * Raw HTML in the answer is not rendered — react-markdown escapes it by default
 * — and images are dropped, so a model cannot inject markup or a tracking pixel.
 * Links open in a new tab without handing the page a reference to this one.
 *
 * Single line breaks are kept: the local extractive composer separates its
 * attribution line from the quoted passage with one newline, which standard
 * Markdown would otherwise merge into a single paragraph.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        disallowedElements={['img']}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5 marker:text-ink-subtle">{children}</li>,
          h1: ({ children }) => <p className="mb-2 mt-1 font-semibold text-ink">{children}</p>,
          h2: ({ children }) => <p className="mb-2 mt-1 font-semibold text-ink">{children}</p>,
          h3: ({ children }) => <p className="mb-2 mt-1 font-semibold text-ink">{children}</p>,
          h4: ({ children }) => <p className="mb-2 mt-1 font-semibold text-ink">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-white px-1 py-0.5 text-[13px] ring-1 ring-line">{children}</code>
          ),
          hr: () => <hr className="my-3 border-line" />,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto last:mb-0">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-line px-2 py-1.5 font-semibold text-ink">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-line px-2 py-1.5 align-top">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
