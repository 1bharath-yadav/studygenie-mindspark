// /src/components/llm-ui/CodeBlock.tsx
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import parseHtml from 'html-react-parser';
import { type LLMOutputComponent } from '@llm-ui/react';
import {
  useCodeBlockToHtml,
  loadHighlighter,
  allLangs,
  allLangsAlias,
  parseCompleteMarkdownCodeBlock,
  parsePartialMarkdownCodeBlock,
  type CodeToHtmlOptions,
} from '@llm-ui/code';
import { getHighlighterCore } from 'shiki/core';
import { bundledLanguagesInfo } from 'shiki/langs';
import getWasm from 'shiki/wasm';
// Keep themes minimal for bundle size
import githubDark from 'shiki/themes/github-dark.mjs';

const codeToHtmlOptions: CodeToHtmlOptions = { theme: 'github-dark' } as const;

type LangMeta = { codeLang: string | null; codeMeta: string | null };

// NOTE: some of the parser helpers may have their own types named `CodeBlock`.
// TypeScript can be strict about the returned shape. We'll defensively cast the
// parser results to `any` so accessing `.lang` and `.meta` doesn't trigger
// "property does not exist" errors while keeping runtime checks minimal.

export const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const markdownCodeBlock = blockMatch.output ?? '';

  const highlighter = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return loadHighlighter(
        getHighlighterCore({
          langs: allLangs(bundledLanguagesInfo),
          langAlias: allLangsAlias(bundledLanguagesInfo),
          themes: [githubDark],
          loadWasm: getWasm,
        }),
      );
    } catch {
      return null;
    }
  }, []);

  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock,
    highlighter,
    codeToHtmlOptions,
  });

  // Safely infer lang/meta from fence using official helpers. The parsers may
  // return typed objects that don't expose `.lang`/`.meta` in their declared
  // type. Cast to `any` and guard at runtime to avoid the TS error you saw.
  const { codeLang, codeMeta } = useMemo<LangMeta>(() => {
    try {
      const full = parseCompleteMarkdownCodeBlock(markdownCodeBlock) as any;
      if (full && typeof full === 'object') {
        return { codeLang: full.lang ?? null, codeMeta: full.meta ?? null };
      }
      const partial = parsePartialMarkdownCodeBlock(markdownCodeBlock) as any;
      if (partial && typeof partial === 'object') {
        return { codeLang: partial.lang ?? null, codeMeta: partial.meta ?? null };
      }
      return { codeLang: null, codeMeta: null };
    } catch {
      return { codeLang: null, codeMeta: null };
    }
  }, [markdownCodeBlock]);

  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code ?? '');
      setCopied(true);
      // store the timer id so we can clear it on unmount
      timerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [code]);

  const header = (
    <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 text-neutral-300 text-xs rounded-t-md">
      <div className="flex items-center gap-2">
        <span className="uppercase">{codeLang ?? 'text'}</span>
        {codeMeta ? <span className="opacity-70">{codeMeta}</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onCopy} className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700">
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={() => {
            try {
              const payload = { code: code ?? '', lang: codeLang ?? null };
              window.dispatchEvent(new CustomEvent('studygenie:edit-code', { detail: payload }));
            } catch (e) {}
          }}
          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          Edit
        </button>
      </div>
    </div>
  );

  // Always constrain code blocks so they don't expand the chat width.
  // Use an internal scroll container for wide code while keeping outer container max-width:100%.
  const codeContainerClass = 'shiki !m-0 rounded-b-md overflow-auto max-w-full';

  if (!html) {
    return (
      <div className="relative my-3 max-w-full">
        {header}
        <div className={codeContainerClass}>
          <pre className="!m-0"><code className="whitespace-pre">{code}</code></pre>
        </div>
      </div>
    );
  }

  return (
    <div className="relative my-3 max-w-full">
      {header}
      <div className={`${codeContainerClass} [&_.shiki]:!m-0`}>{parseHtml(html)}</div>
    </div>
  );
};

export default CodeBlock;
