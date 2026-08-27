export interface RetrievedContext {
  documentTitle: string;
  page: number;
  section: string;
  content: string;
  similarity: number;
}

export interface GenerationRequest {
  question: string;
  contexts: RetrievedContext[];
  systemPrompt: string;
}

export interface GenerationResult {
  answer: string;
  provider: string;
  model: string;
  /**
   * "generative" — produced by a language model.
   * "extractive" — assembled from retrieved policy text without a language model.
   * Never mislabelled: the UI shows this verbatim.
   */
  mode: 'generative' | 'extractive';
  /** Set when the model itself declares the evidence insufficient. */
  modelRefused?: boolean;
}

export interface LLMProvider {
  readonly id: 'gemini' | 'ollama' | 'local';
  readonly model: string;
  readonly isGenerative: boolean;
  generate(req: GenerationRequest): Promise<GenerationResult>;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}
