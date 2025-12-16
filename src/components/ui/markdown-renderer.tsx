import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '@/contexts/ThemeContext';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Code block component with copy functionality
const CodeBlock = ({ 
  language, 
  children,
  isDark
}: { 
  language: string; 
  children: string;
  isDark: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className={`relative group my-4 rounded-xl overflow-hidden border ${
      isDark ? 'border-white/10' : 'border-gray-200'
    }`}>
      {/* Header with language and copy button */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        isDark 
          ? 'bg-zinc-800/80 border-white/10' 
          : 'bg-gray-100 border-gray-200'
      }`}>
        <span className={`text-xs font-medium uppercase tracking-wider ${
          isDark ? 'text-zinc-400' : 'text-gray-500'
        }`}>
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={`h-7 px-2 text-xs transition-colors ${
            isDark 
              ? 'hover:bg-white/10 text-zinc-400 hover:text-white' 
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              <span className="text-emerald-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy code
            </>
          )}
        </Button>
      </div>
      
      {/* Code content */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: isDark ? 'rgb(24 24 27 / 0.8)' : 'rgb(249 250 251)',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
        codeTagProps={{
          style: {
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Andale Mono", monospace',
          }
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

// Inline code component
const InlineCode = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <code className={`px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border ${
    isDark 
      ? 'bg-zinc-800/80 text-cyan-400 border-white/10' 
      : 'bg-gray-100 text-cyan-600 border-gray-200'
  }`}>
    {children}
  </code>
);

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  const { isDark } = useTheme();
  
  // Handle empty content gracefully
  if (!content || content.trim() === '') {
    return (
      <div className={`markdown-content text-sm text-muted-foreground ${className}`}>
        <p className="italic">No content to display.</p>
      </div>
    );
  }

  // Theme-aware text colors
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-white/85' : 'text-gray-700';
  const textMuted = isDark ? 'text-white/70' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
  const bgMuted = isDark ? 'bg-zinc-800/80' : 'bg-gray-100';
  const accentColor = isDark ? 'text-cyan-400' : 'text-cyan-600';
  const markerColor = isDark ? 'marker:text-cyan-500' : 'marker:text-cyan-600';

  return (
    <div className={`markdown-content prose ${isDark ? 'prose-invert' : ''} prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');
            
            if (!inline && (match || codeContent.includes('\n'))) {
              return (
                <CodeBlock language={language} isDark={isDark}>
                  {codeContent}
                </CodeBlock>
              );
            }
            
            return <InlineCode isDark={isDark} {...props}>{children}</InlineCode>;
          },
          
          // Headings
          h1: ({ children }) => (
            <h1 className={`text-2xl font-bold mt-6 mb-4 ${textPrimary} border-b ${borderColor} pb-2`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-xl font-bold mt-5 mb-3 ${textPrimary}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-lg font-semibold mt-4 mb-2 ${textPrimary}`}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className={`text-base font-semibold mt-3 mb-2 ${textSecondary}`}>
              {children}
            </h4>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className={`my-3 leading-relaxed ${textSecondary}`}>
              {children}
            </p>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className={`my-3 ml-4 space-y-1.5 list-disc ${markerColor}`}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={`my-3 ml-4 space-y-1.5 list-decimal ${markerColor}`}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={`${textSecondary} pl-1`}>
              {children}
            </li>
          ),
          
          // Links
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${accentColor} hover:underline underline-offset-2 transition-colors`}
            >
              {children}
            </a>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className={`my-4 pl-4 border-l-4 py-2 pr-4 rounded-r-lg italic ${
              isDark 
                ? 'border-cyan-500/50 bg-cyan-500/5 text-white/70' 
                : 'border-cyan-500 bg-cyan-50 text-gray-600'
            }`}>
              {children}
            </blockquote>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className={`my-4 overflow-x-auto rounded-lg border ${borderColor}`}>
              <table className="w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={`${bgMuted} border-b ${borderColor}`}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className={`px-4 py-3 text-left font-semibold ${textPrimary}`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`px-4 py-3 ${textSecondary}`}>
              {children}
            </td>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className={`my-6 ${borderColor}`} />
          ),
          
          // Strong/Bold
          strong: ({ children }) => (
            <strong className={`font-semibold ${textPrimary}`}>
              {children}
            </strong>
          ),
          
          // Emphasis/Italic
          em: ({ children }) => (
            <em className={`italic ${textSecondary}`}>
              {children}
            </em>
          ),
          
          // Images
          img: ({ src, alt }) => (
            <img 
              src={src} 
              alt={alt || ''} 
              className={`my-4 rounded-lg max-w-full h-auto border ${borderColor}`}
            />
          ),
          
          // Pre (handled by code, but fallback)
          pre: ({ children }) => (
            <pre className={`my-4 p-4 rounded-xl overflow-x-auto border ${
              isDark 
                ? 'bg-zinc-900/80 border-white/10' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
