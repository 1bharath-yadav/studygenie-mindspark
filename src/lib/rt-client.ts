// Minimal development shim for `rt-client` used by realtime-chat.tsx
// This shim provides the exported types and a lightweight RTClient class
// so the frontend builds in development. Replace with the real SDK in prod.

export type Modality = 'text' | 'audio';

export type TurnDetection = { type: 'server_vad' } | null;

export type RTInputAudioItem = {
  audioStartMillis?: number;
  audioEndMillis?: number;
  transcription?: string | null;
  waitForCompletion: () => Promise<void>;
};

export type RTResponseItem = {
  type: string;
  role?: string;
  // async iterators used by original SDK - provide minimal facades
  textChunks?: () => AsyncIterable<string>;
  transcriptChunks?: () => AsyncIterable<string>;
  audioChunks?: () => AsyncIterable<Uint8Array>;
};

export type RTResponse = AsyncIterable<RTResponseItem> & {
  // keep index signature to iterate in callers
};

// Minimal RTClient class with no-op implementations for development.
export class RTClient {
  constructor(..._args: any[]) {}

  async configure(_cfg: any) {
    // no-op
  }

  async sendAudio(_chunk: ArrayBuffer | Uint8Array) {
    // no-op
  }

  async sendItem(_item: any) {
    // no-op
  }

  async commitAudio() {
    return null as any;
  }

  async generateResponse() {
    // no-op
  }

  async close() {
    // no-op
  }

  // events returns an async iterator of server events. Provide a simple empty iterator.
  async *events(): AsyncIterable<any> {
    while (false) {
      yield;
    }
  }
}

export default RTClient;
