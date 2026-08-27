export const formatDate = (d: string | Date): string =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (d: string | Date): string =>
  new Date(d).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export const formatPercent = (n: number, digits = 0): string => `${(n * 100).toFixed(digits)}%`;

export const formatNumber = (n: number): string => n.toLocaleString('en-AU');

export const relativeTime = (d: string | Date): string => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(d);
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  PERSONAL: 'Personal Leave',
  CARERS: "Carer's Leave",
  UNPAID: 'Unpaid Leave',
  LONG_SERVICE: 'Long Service Leave',
};

export const AUDIT_EVENT_LABELS: Record<string, string> = {
  LOGIN: 'Signed in',
  LOGIN_FAILED: 'Failed sign-in',
  LOGOUT: 'Signed out',
  AI_QUERY: 'AI question asked',
  AI_GROUNDED_RESPONSE: 'Grounded answer returned',
  AI_FALLBACK: 'Fallback / refusal returned',
  POLICY_UPLOAD: 'Policy uploaded',
  POLICY_INDEXED: 'Policy indexed',
  POLICY_INDEX_FAILED: 'Policy indexing failed',
  POLICY_SEARCH: 'Policy search',
  LEAVE_REQUEST: 'Leave request submitted',
  POLICY_ACKNOWLEDGED: 'Policy acknowledged',
  ACCESS_DENIED: 'Access denied',
};
