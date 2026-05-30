import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface BlogPostContentProps {
  body: string;
}

export function BlogPostContent({ body }: BlogPostContentProps) {
  return (
    <div className="blog-markdown">
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 className="mt-10 text-2xl font-semibold text-zinc-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 text-xl font-semibold text-zinc-100">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mt-4 text-lg leading-relaxed text-zinc-300">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mt-4 list-disc space-y-2 pl-6 text-lg text-zinc-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg text-zinc-300">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          a: ({ href, children }) => {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="text-sky-400 hover:underline">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {body.trim()}
      </ReactMarkdown>
    </div>
  );
}
