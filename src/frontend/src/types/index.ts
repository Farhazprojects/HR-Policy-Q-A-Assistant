export type Role = 'EMPLOYEE' | 'HR_OFFICER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  jobTitle: string | null;
  department: string | null;
}

export interface Citation {
  id: string;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  page: number;
  section: string;
  excerpt: string;
  similarity: number;
  rank: number;
}

export interface Explainability {
  confidence: number;
  confidencePercentage: number;
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';
  topSimilarity: number;
  meanSimilarity: number;
  retrievedCount: number;
  acceptedCount: number;
  threshold: number;
  topK: number;
  methodology: string;
  similarityFunction: string;
  whyRelevant: string;
  components: Record<string, number>;
}

export interface ProviderInfo {
  llm: string;
  llmModel: string;
  embedding: string;
  embeddingModel: string;
  generationMode: 'generative' | 'extractive';
  isNeuralEmbedding: boolean;
  demoMode: boolean;
}

export interface AskResult {
  questionId: string;
  question: string;
  answer: string;
  status: 'GROUNDED' | 'FALLBACK';
  fallbackReason?: string;
  citations: Citation[];
  explainability: Explainability;
  provider: ProviderInfo;
  latencyMs: number;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  version: string;
  summary: string | null;
  pageCount: number;
  chunkCount: number;
  status: string;
  statusMessage: string | null;
  isDemo: boolean;
  requiresAcknowledgement: boolean;
  createdAt: string;
  updatedAt: string;
  embeddingModel: string | null;
  uploadedBy: { name: string; role: Role } | null;
}

export interface PolicySearchResult {
  id: string;
  title: string;
  category: string;
  version: string;
  summary: string | null;
  updatedAt: string;
  pageCount: number;
  chunkCount: number;
  isDemo: boolean;
  relevantSections: string[];
  bestMatch: { page: number; section: string; excerpt: string; similarity: number } | null;
  score: number;
}

export interface LeaveRequest {
  id: string;
  leaveType: 'ANNUAL' | 'PERSONAL' | 'CARERS' | 'UNPAID' | 'LONG_SERVICE';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
}

export interface AcknowledgementRow {
  id: string;
  policyVersion: string;
  assignedAt: string;
  acknowledgedAt: string | null;
  document: { id: string; title: string; category: string; version: string; summary: string | null; isDemo: boolean };
}
