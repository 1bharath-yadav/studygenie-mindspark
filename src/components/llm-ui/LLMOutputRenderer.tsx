// LLMOutputRenderer.tsx
import React, { useEffect, useRef } from 'react';
import {
  useLLMOutput,
  throttleBasic,
  type BlockMatch,
} from '@llm-ui/react';
import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
} from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';
import { MarkdownComponent } from './MarkdownComponent';
import { CodeBlock } from './CodeBlock';

interface LLMOutputRendererProps {
  text: string;                // full concatenated streamed string so far
  isStreamFinished?: boolean;  // set true when provider signals done
  autoScroll?: boolean;        // default true
}

export const LLMOutputRenderer: React.FC<LLMOutputRendererProps> = ({
  text,
  isStreamFinished = false,
  autoScroll = true,
}) => {
  // Throttle so lookBack has buffer to hide raw markdown/code fences while streaming.
  const throttle = throttleBasic({
    readAheadChars: 12,        // leave headroom for lookBack parsers
    targetBufferChars: 10,     // smoother visual pacing
    adjustPercentage: 0.3,
    frameLookBackMs: 8000,
    windowLookBackMs: 1500,
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

  // Optional: follow-scroll while streaming unless user scrolled up.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!autoScroll) return;
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [text, blockMatches, autoScroll]);

  return (
    <div ref={containerRef} className="llm-ui-output prose max-w-full break-words">
      {blockMatches.map((m: BlockMatch, i: number) => {
        const Component = m.block.component;
        return <Component key={`${m.startIndex}-${i}`} blockMatch={m} />;
      })}
    </div>
  );
};
