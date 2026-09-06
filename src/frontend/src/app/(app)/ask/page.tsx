'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CitationCard } from '@/components/ui/CitationCard';
import { ConfidenceIndicator } from '@/components/ui/ConfidenceIndicator';
import { TypingIndicator } from '@/components/ui/States';
import { api, ApiRequestError } from '@/lib/api';
import type { AskResult } from '@/types';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  result?: AskResult;
  error?: boolean;
}

const DEMO_QUESTIONS = [
  'How many days of annual leave are employees entitled to?',
  'What is the process for requesting flexible work?',
  'Do employees need to acknowledge the information security policy?',
  'What are the requirements for remote work?',
  "What is the company's policy on purchasing private aircraft?",
];

type Mode = 'gemini' | 'local';

const MODES: Record<Mode, { label: string; hint: string }> = {
  gemini: {
    label: 'Gemini',
    hint: 'Semantic retrieval and a generated answer. Understands wording the policy does not use.',
  },
  local: {
    label: 'Local',
    hint: 'Lexical retrieval and a quoted passage. No API key, no network, fully deterministic.',
  },
};

export default function AskAIPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [mode, setMode] = useState<Mode>('gemini');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<AskResult | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, busy]);

  const submit = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;

    setInput('');
    setBusy(true);
    setTurns((t) => [...t, { id: `u-${Date.now()}`, role: 'user', text: q }]);

    try {
      const result = await api.post<AskResult>('/chat', { question: q, mode });
      setTurns((t) => [
        ...t,
        { id: result.questionId, role: 'assistant', text: result.answer, result },
      ]);
      setActive(result);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : 'The assistant could not be reached. Please try again.';
      setTurns((t) => [...t, { id: `e-${Date.now()}`, role: 'assistant', text: message, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        backTo="/dashboard"
        backLabel="Dashboard"
        title="Ask AI"
        description="Ask a natural-language HR policy question. Answers are grounded in approved documents."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Conversation */}
        <Card className="flex min-h-[560px] flex-col p-6">
          <div className="flex-1 space-y-6 overflow-y-auto">
            {turns.length === 0 && !busy ? (
              <div className="py-6">
                <p className="text-sm font-medium text-ink">
                  Ask a question about your organisation&rsquo;s HR policies.
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  Every answer is grounded in the indexed policy documents and cited to page and section.
                  Try one of these:
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {DEMO_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-left text-sm text-ink-muted transition-colors hover:border-brand-200 hover:bg-brand-wash hover:text-ink"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {turns.map((turn) =>
              turn.role === 'user' ? (
                <div key={turn.id} className="animate-slide-up">
                  <p className="mb-2 text-sm font-medium text-ink-muted">Employee</p>
                  <div className="inline-block max-w-[85%] rounded-xl bg-brand-wash px-5 py-4">
                    <p className="text-[17px] font-medium leading-snug text-ink">{turn.text}</p>
                  </div>
                </div>
              ) : (
                <div key={turn.id} className="animate-slide-up">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-sm font-medium text-ink-muted">HR Policy Assistant</p>
                    {turn.result?.status === 'FALLBACK' ? (
                      <Badge tone="caution">Fallback — no answer invented</Badge>
                    ) : turn.result?.status === 'GROUNDED' ? (
                      <Badge tone="positive">Grounded</Badge>
                    ) : null}
                  </div>

                  <div
                    className={
                      turn.error
                        ? 'rounded-xl border border-danger/25 bg-danger-wash px-5 py-4'
                        : turn.result?.status === 'FALLBACK'
                          ? 'rounded-xl border border-caution/25 bg-caution-wash px-5 py-4'
                          : 'rounded-xl border border-line bg-canvas px-5 py-4'
                    }
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{turn.text}</p>

                    {turn.result?.status === 'GROUNDED' ? (
                      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                        Source-grounded response • No unsupported policy information used
                      </p>
                    ) : null}

                    {turn.result?.status === 'FALLBACK' ? (
                      <div className="mt-4 border-t border-caution/25 pt-3">
                        <p className="text-xs font-medium text-caution">
                          Why no answer was given
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">{turn.result.fallbackReason}</p>
                        <p className="mt-2 text-xs text-ink-muted">
                          Suggested action: contact the People and Culture team for clarification.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {turn.result ? (
                    <button
                      onClick={() => setActive(turn.result!)}
                      className="mt-2 text-xs font-medium text-brand hover:underline"
                    >
                      Show explainability for this answer
                    </button>
                  ) : null}
                </div>
              ),
            )}

            {busy ? (
              <div className="animate-fade-in">
                <p className="mb-2 text-sm font-medium text-ink-muted">HR Policy Assistant</p>
                <div className="rounded-xl border border-line bg-canvas px-5 py-4">
                  <TypingIndicator label="Retrieving policy evidence…" />
                </div>
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <div className="mt-5 border-t border-line pt-5">
            {/* Suggestions stay reachable for the whole session, not only on an
                empty conversation, so a demonstrator can move between scripted
                questions without reloading. */}
            {turns.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="self-center text-xs font-medium text-ink-subtle">Try:</span>
                {DEMO_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void submit(q)}
                    disabled={busy}
                    title={q}
                    className="max-w-[220px] truncate rounded-full border border-line bg-canvas px-3 py-1 text-xs text-ink-muted transition-colors hover:border-brand-200 hover:bg-brand-wash hover:text-ink disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              onSubmit={(e: FormEvent) => { e.preventDefault(); void submit(input); }}
              className="flex gap-3"
            >
              <label htmlFor="question" className="sr-only">Your HR question</label>
              <input
                id="question"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your HR question…"
                disabled={busy}
                maxLength={1000}
                className="h-12 flex-1 rounded-lg border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-subtle focus:border-brand disabled:bg-canvas"
              />

              {/* Answering mode. The same question can be put to either stack,
                  which is what makes the difference between lexical retrieval
                  and semantic retrieval observable rather than asserted. */}
              <div
                role="group"
                aria-label="Answering mode"
                className="flex h-12 shrink-0 items-center rounded-lg border border-line bg-canvas p-1"
              >
                {(Object.keys(MODES) as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    disabled={busy}
                    aria-pressed={mode === m}
                    title={MODES[m].hint}
                    className={`h-full rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                      mode === m
                        ? 'bg-white text-ink shadow-sm ring-1 ring-line'
                        : 'text-ink-subtle hover:text-ink'
                    }`}
                  >
                    {MODES[m].label}
                  </button>
                ))}
              </div>

              <Button type="submit" size="lg" loading={busy} disabled={!input.trim()}>
                Send
              </Button>
            </form>

            <p className="mt-2 text-xs text-ink-subtle">{MODES[mode].hint}</p>
          </div>
        </Card>

        {/* Explainability */}
        <Card className="h-fit p-6 lg:sticky lg:top-6">
          <h2 className="text-xl font-bold text-ink">Explainability</h2>

          {!active ? (
            <>
              <p className="mt-4 text-sm text-ink-muted">
                Ask a question and this panel will show which policy passages were retrieved, how
                closely they matched, and how the confidence figure was derived.
              </p>
              <p className="mt-4 border-t border-line pt-4 text-xs text-ink-subtle">
                If no relevant policy is found, the assistant refuses to invent an answer.
              </p>
            </>
          ) : (
            <div className="animate-fade-in">
              <p className="mt-4 text-sm font-semibold text-ink">Why this answer?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                {active.explainability.whyRelevant}
              </p>

              <p className="mt-5 text-sm font-medium text-ink-muted">Retrieved policy sources</p>
              <div className="mt-2 space-y-2">
                {active.citations.length > 0 ? (
                  active.citations.map((c) => <CitationCard key={c.id} citation={c} />)
                ) : (
                  <div className="rounded-lg border border-caution/25 bg-caution-wash p-3.5">
                    <p className="text-sm font-medium text-caution">No qualifying sources</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      No passage reached the {active.explainability.threshold} relevance threshold, so the
                      language model was not called at all.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-medium text-ink-muted">Confidence</p>
                <div className="mt-2">
                  <ConfidenceIndicator
                    percentage={active.explainability.confidencePercentage}
                    band={active.explainability.confidenceBand}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-subtle">Retrieval-based confidence indicator</p>
              </div>

              <dl className="mt-5 space-y-2 border-t border-line pt-5 text-xs">
                {[
                  ['Top similarity', active.explainability.topSimilarity.toFixed(3)],
                  ['Mean similarity', active.explainability.meanSimilarity.toFixed(3)],
                  ['Chunks retrieved', `${active.explainability.retrievedCount}`],
                  ['Chunks accepted', `${active.explainability.acceptedCount}`],
                  ['Retrieval threshold', `${active.explainability.threshold}`],
                  ['Top-K', `${active.explainability.topK}`],
                  ['Similarity function', active.explainability.similarityFunction],
                  ['Response time', `${active.latencyMs} ms`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-ink-subtle">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <details className="mt-5 border-t border-line pt-4">
                <summary className="cursor-pointer text-xs font-medium text-brand hover:underline">
                  How is confidence calculated?
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  {active.explainability.methodology}
                </p>
              </details>

              <div className="mt-5 rounded-lg border border-line bg-canvas p-3">
                <p className="text-xs font-medium text-ink">Answer produced by</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Retrieval: {active.provider.embedding} ({active.provider.embeddingModel})
                  {active.provider.isNeuralEmbedding ? '' : ' — lexical, not neural'}
                </p>
                <p className="text-xs text-ink-muted">
                  Generation: {active.provider.llmModel === 'not-invoked'
                    ? 'not invoked — refusal produced by the application'
                    : `${active.provider.llm} (${active.provider.llmModel})`}
                </p>
                {active.provider.generationMode === 'extractive' &&
                 active.provider.llmModel !== 'not-invoked' ? (
                  <Badge tone="caution" className="mt-2">
                    Extractive — quotes policy text, no language model
                  </Badge>
                ) : null}
              </div>

              <p className="mt-4 border-t border-line pt-4 text-xs text-ink-subtle">
                If no relevant policy is found, the assistant refuses to invent an answer. This
                assistant supports, but does not replace, HR professional judgement.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
