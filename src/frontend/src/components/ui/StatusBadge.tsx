import { Badge } from './Badge';

const map: Record<string, { tone: 'neutral' | 'brand' | 'positive' | 'caution' | 'danger'; label: string }> = {
  INDEXED: { tone: 'positive', label: 'Indexed' },
  UPLOADED: { tone: 'neutral', label: 'Uploaded' },
  EXTRACTING: { tone: 'brand', label: 'Extracting' },
  CHUNKING: { tone: 'brand', label: 'Chunking' },
  EMBEDDING: { tone: 'brand', label: 'Embedding' },
  FAILED: { tone: 'danger', label: 'Failed' },
  GROUNDED: { tone: 'positive', label: 'Grounded' },
  FALLBACK: { tone: 'caution', label: 'Fallback' },
  ERROR: { tone: 'danger', label: 'Error' },
  SUBMITTED: { tone: 'brand', label: 'Submitted' },
  UNDER_REVIEW: { tone: 'caution', label: 'Under review' },
  APPROVED: { tone: 'positive', label: 'Approved' },
  DECLINED: { tone: 'danger', label: 'Declined' },
  CANCELLED: { tone: 'neutral', label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = map[status] ?? { tone: 'neutral' as const, label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
