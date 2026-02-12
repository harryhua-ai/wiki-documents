import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Highlight, themes } from 'prism-react-renderer';
import Link from '@docusaurus/Link';
import { useColorMode } from '@docusaurus/theme-common';
import styles from '../../css/AskAI.module.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom code block component with copy button
const CodeBlockWrapper: React.FC<{
  language: string;
  codeContent: string;
  className?: string;
}> = ({ language, codeContent, className }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { colorMode } = useColorMode();
  const isDarkTheme = colorMode === 'dark';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = codeContent;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className={styles.codeBlockWrapper}>
      <Highlight
        theme={isDarkTheme ? themes.vsDark : themes.github}
        code={codeContent}
        language={language}
      >
        {({ className: prismClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className || ''} ${prismClassName}`}
            style={{
              ...style,
              margin: 0,
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              overflow: 'auto'
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>

      <button
        type="button"
        className={`${styles.codeCopyButton} ${isCopied ? styles.codeCopyButtonCopied : ''}`}
        onClick={handleCopy}
        aria-label={isCopied ? 'Copied!' : 'Copy code'}
        title={isCopied ? 'Copied!' : 'Copy code'}
      >
        {isCopied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
};

// Custom renderer for code blocks with syntax highlighting
const CodeBlock: React.FC<{
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}> = ({ inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');

  if (!inline && match) {
    return (
      <CodeBlockWrapper
        language={language}
        codeContent={codeContent}
        className={className}
      />
    );
  }

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <pre className={className} {...props}>
      <code className={className}>{children}</code>
    </pre>
  );
};

// Custom renderer for links - use Docusaurus Link for internal links
const CustomLink: React.FC<{
  node?: any;
  href?: string;
  children: React.ReactNode;
  [key: string]: any;
}> = ({ href, children, ...props }) => {
  if (!href) return <>{children}</>;

  // Check if it's an internal link (starts with / or relative)
  const isInternal = href.startsWith('/') || href.startsWith('./') || href.startsWith('../');

  if (isInternal) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code: CodeBlock,
          a: CustomLink,
          // Ensure proper heading levels (shift down to fit chat context)
          h1: ({ node, ...props }) => <h3 {...props} />,
          h2: ({ node, ...props }) => <h4 {...props} />,
          h3: ({ node, ...props }) => <h5 {...props} />,
          h4: ({ node, ...props }) => <h6 {...props} />,
          // Style lists
          ul: ({ node, ...props }) => <ul className="contains-task-list" {...props} />,
          ol: ({ node, ...props }) => <ol {...props} />,
          // Style tables
          table: ({ node, ...props }) => (
            <div className="table-wrapper">
              <table {...props} />
            </div>
          ),
          img: ({ node, ...props }) => (
             // eslint-disable-next-line @next/next/no-img-element
            <img {...props} style={{ maxWidth: '100%', borderRadius: '8px' }} alt={props.alt || ''} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
