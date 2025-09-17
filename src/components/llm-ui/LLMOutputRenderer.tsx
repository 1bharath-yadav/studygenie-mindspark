// LLMOutputRenderer.tsx
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import {
  useLLMOutput,
  throttleBasic,
  type BlockMatch,
  type LLMOutputComponent,
} from '@llm-ui/react';
import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
} from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';

// Enhanced Markdown Component with all features
export const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output ?? '';
  const [isDark, setIsDark] = useState(false);
  
  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };
    
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  // Sanitize content for security
  const sanitizedMarkdown = useMemo(() => {
    return DOMPurify.sanitize(markdown, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'del', 'ins', 'sup', 'sub'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    });
  }, [markdown]);

  // Copy to clipboard function
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const customComponents = useMemo(() => ({
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      
      return !inline && language ? (
        <div className="code-block-wrapper my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="code-block-header flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm">
            <span className="language-label font-medium text-gray-700 dark:text-gray-300">
              {language.toUpperCase()}
            </span>
            <button
              onClick={() => copyToClipboard(codeString)}
              className="copy-button flex items-center gap-2 px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Copy code"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="m5 15-2-2 2-2"></path>
                <path d="m5 9-2 2 2 2"></path>
              </svg>
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            style={isDark ? atomDark : oneLight}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5',
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code 
          className="inline-code bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200" 
          {...props}
        >
          {children}
        </code>
      );
    },
    
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
        {children}
      </h1>
    ),
    
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold mb-4 mt-6 text-gray-800 dark:text-gray-200">
        {children}
      </h2>
    ),
    
    h3: ({ children }: any) => (
      <h3 className="text-xl font-medium mb-3 mt-5 text-gray-700 dark:text-gray-300">
        {children}
      </h3>
    ),
    
    h4: ({ children }: any) => (
      <h4 className="text-lg font-medium mb-2 mt-4 text-gray-700 dark:text-gray-300">
        {children}
      </h4>
    ),
    
    p: ({ children }: any) => (
      <p className="mb-4 leading-7 text-gray-700 dark:text-gray-300">
        {children}
      </p>
    ),
    
    ul: ({ children }: any) => (
      <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),
    
    ol: ({ children }: any) => (
      <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),
    
    li: ({ children }: any) => (
      <li className="leading-7">{children}</li>
    ),
    
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-6 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300 rounded-r">
        {children}
      </blockquote>
    ),
    
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </table>
      </div>
    ),
    
    thead: ({ children }: any) => (
      <thead className="bg-gray-50 dark:bg-gray-800">
        {children}
      </thead>
    ),
    
    th: ({ children }: any) => (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
      </th>
    ),
    
    td: ({ children }: any) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
        {children}
      </td>
    ),
    
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline hover:no-underline transition-colors"
      >
        {children}
      </a>
    ),
    
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    
    em: ({ children }: any) => (
      <em className="italic text-gray-800 dark:text-gray-200">
        {children}
      </em>
    ),
    
    del: ({ children }: any) => (
      <del className="line-through text-gray-500 dark:text-gray-400">
        {children}
      </del>
    ),
    
    hr: () => (
      <hr className="my-8 border-gray-200 dark:border-gray-700" />
    ),
  }), [isDark, copyToClipboard]);

  return (
    <div className="markdown-content prose prose-gray dark:prose-invert max-w-none">
      <ReactMarkdown
        components={customComponents}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        skipHtml={false}
      >
        {sanitizedMarkdown}
      </ReactMarkdown>
    </div>
  );
};

// Enhanced Code Block Component
export const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const codeContent = blockMatch.output ?? '';
  const [isDark, setIsDark] = useState(false);
  
  // Extract language from the first line if it's a code fence
  const extractLanguage = (content: string): string => {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // Check if it starts with ``` followed by language
    if (firstLine?.startsWith('```')) {
      const lang = firstLine.slice(3).trim();
      return lang || 'text';
    }
    
    // Default fallback
    return 'text';
  };
  
  // Clean code content (remove fence markers if present)
  const cleanCodeContent = useMemo(() => {
    const lines = codeContent.split('\n');
    let startIndex = 0;
    let endIndex = lines.length;
    
    // Remove opening fence
    if (lines[0]?.trim().startsWith('```')) {
      startIndex = 1;
    }
    
    // Remove closing fence
    if (lines[lines.length - 1]?.trim() === '```') {
      endIndex = lines.length - 1;
    }
    
    return lines.slice(startIndex, endIndex).join('\n');
  }, [codeContent]);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };
    
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Add toast notification if needed
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  }, []);

  const detectedLanguage = extractLanguage(codeContent);

  return (
    <div className="code-block-container my-6">
      <div className="code-block-wrapper rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="code-block-header flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <span className="language-label text-sm font-medium text-gray-700 dark:text-gray-300">
              {detectedLanguage.toUpperCase()}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(cleanCodeContent)}
            className="copy-button flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Copy code to clipboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="m5 15-4-4 4-4"></path>
            </svg>
            Copy
          </button>
        </div>
        <div className="code-content">
          <SyntaxHighlighter
            style={isDark ? atomDark : oneLight}
            language={detectedLanguage}
            PreTag="div"
            showLineNumbers={cleanCodeContent.split('\n').length > 5}
            customStyle={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.6',
              padding: '1rem',
            }}
          >
            {cleanCodeContent}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

// Main LLM Output Renderer Interface
interface LLMOutputRendererProps {
  text: string; // full concatenated streamed string so far
  isStreamFinished?: boolean; // set true when provider signals done
  autoScroll?: boolean; // default true
  className?: string; // additional CSS classes
  enableMath?: boolean; // enable LaTeX/KaTeX support
  theme?: 'light' | 'dark' | 'auto'; // theme preference
}

export const LLMOutputRenderer: React.FC<LLMOutputRendererProps> = ({
  text,
  isStreamFinished = false,
  autoScroll = true,
  className = '',
  enableMath = true,
  theme = 'auto',
}) => {
  // Enhanced throttle configuration for better streaming experience
  const throttle = throttleBasic({
    readAheadChars: 15, // increased buffer for complex markdown
    targetBufferChars: 12, // smoother visual pacing
    adjustPercentage: 0.25, // more conservative throttling
    frameLookBackMs: 10000, // longer frame lookback
    windowLookBackMs: 2000, // longer window lookback
  });

  const { blockMatches } = useLLMOutput({
    llmOutput: text,
    isStreamFinished,
    throttle,
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
  });

  // LLM output now renders inline; outer container handles scrolling.

  return (
    <div className={`llm-output-container relative ${className}`}>
      <div 
        className="llm-ui-output prose prose-gray dark:prose-invert max-w-none break-words"
      >
        {/* Theme-aware helpers for LLM produced quiz markup
            - map `.correct` and `.incorrect` classes to theme tokens
            - map simple markers like ✅ / ❌ to accessible text colors */}
        <style>{`
          .llm-ui-output .correct { color: theme('colors.green.600') || #16a34a; }
          .llm-ui-output .incorrect { color: theme('colors.red.600') || #dc2626; }
          .llm-ui-output .badge-correct { display: inline-flex; align-items: center; gap: .5rem; color: #16a34a; }
          .llm-ui-output .badge-incorrect { display: inline-flex; align-items: center; gap: .5rem; color: #dc2626; }
        `}</style>
        {blockMatches.map((m: BlockMatch, i: number) => {
          const Component = m.block.component;
          return <Component key={`${m.startIndex}-${i}`} blockMatch={m} />;
        })}
        
        {/* Streaming indicator */}
        {!isStreamFinished && text && (
          <div className="streaming-indicator flex items-center gap-2 mt-4 text-gray-500 dark:text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm">AI is typing...</span>
          </div>
        )}
      </div>

      {/* Scroll control removed; outer layout handles scrolling */}
    </div>
  );
};

export default LLMOutputRenderer;