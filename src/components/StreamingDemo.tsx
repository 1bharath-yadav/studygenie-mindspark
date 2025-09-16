import React, { useState, useEffect } from 'react';
import { FlashcardViewer } from '@/components/study/FlashcardViewer';
import { QuizComponent } from '@/components/study/QuizComponent';

export const StreamingDemo: React.FC = () => {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('Summarize the following content and generate 2 flashcards.');

  // progressive structured data state
  const [partialStructured, setPartialStructured] = useState<Record<string, any> | null>(null);
  const [finalStructured, setFinalStructured] = useState<Record<string, any> | null>(null);

  const append = (line: string) => setLog(prev => [...prev, line]);

  const mergePartial = (incoming: any) => {
    setPartialStructured(prev => {
      const next = { ...(prev || {}) } as Record<string, any>;
      if (incoming && typeof incoming === 'object') {
        // shallow merge arrays/objects
        for (const k of Object.keys(incoming)) {
          const val = incoming[k];
          if (Array.isArray(val)) {
            next[k] = Array.isArray(next[k]) ? [...next[k], ...val] : [...val];
          } else if (typeof val === 'object' && val !== null) {
            next[k] = { ...(next[k] || {}), ...val };
          } else {
            next[k] = val;
          }
        }
      }
      return next;
    });
  };

  const startStream = async () => {
    setLog([]);
    setPartialStructured(null);
    setFinalStructured(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('user_query', prompt);

      const resp = await fetch('/api/v1/llm/stream-structured', { method: 'POST', body: form });
      if (!resp.ok) throw new Error('Stream failed');
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('Streaming not supported');

      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            append(JSON.stringify(obj));

            // handle structured events
            const status = obj.status;
            const data = obj.data;
            if (status === 'streaming' && data) {
              // merge partials into progressive state
              mergePartial(data);
            } else if (status === 'complete' && data) {
              // final structured payload
              setFinalStructured(data);
              mergePartial(data);
            }
          } catch (e) {
            append('PARSE_ERROR: ' + line.slice(0, 200));
          }
        }
      }
    } catch (e: any) {
      append('ERROR: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  // Debug logging of partial/final structured data
  useEffect(() => {
    if (partialStructured) {
      console.debug('StreamingDemo partialStructured updated:', partialStructured);
    }
  }, [partialStructured]);

  return (
    <div className="p-4 border rounded bg-background">
      <h3 className="font-semibold mb-2">Streaming Demo</h3>
      <textarea className="w-full border rounded p-2 mb-2" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} />
      <div className="flex gap-2 mb-2">
        <button className="px-3 py-1 bg-primary text-white rounded" onClick={startStream} disabled={loading}>{loading ? 'Streaming...' : 'Start Stream'}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="max-h-60 overflow-y-auto bg-surface p-2 rounded">
          <h4 className="font-medium mb-2">Raw events</h4>
          {log.map((l, i) => <pre key={i} className="text-xs mb-1">{l}</pre>)}
        </div>

        <div className="max-h-60 overflow-y-auto bg-surface p-2 rounded">
          <h4 className="font-medium mb-2">Progressive preview</h4>
          {/* If flashcards are present, render FlashcardViewer progressively */}
          { (partialStructured?.flashcards || finalStructured?.flashcards) ? (
            <FlashcardViewer flashcards={partialStructured?.flashcards || finalStructured?.flashcards} />
          ) : (partialStructured?.quiz || finalStructured?.quiz) ? (
            <QuizComponent quizData={partialStructured?.quiz || finalStructured?.quiz} />
          ) : (
            <pre className="text-xs">{JSON.stringify(partialStructured || finalStructured || {empty: true}, null, 2)}</pre>
          ) }
        </div>
      </div>
    </div>
  );
};
