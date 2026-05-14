export type UserRole = 'author' | 'reviewer' | 'admin'

export type ManuscriptStatus =
  | 'draft'
  | 'submitted'
  | 'matching'
  | 'matched'
  | 'in_review'
  | 'revision_requested'
  | 'completed'
  | 'rejected'

export type ReviewStatus = 'pending' | 'accepted' | 'active' | 'submitted' | 'completed' | 'declined'

export type FileType = 'pdf' | 'docx' | 'latex' | 'tex' | 'image' | 'supplementary' | 'html'

export type CommentType = 'inline' | 'general' | 'figure'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  institution?: string
  field?: string
  bio?: string
  orcid_id?: string
  h_index?: number
  publication_count?: number
  created_at: string
}

export interface ReviewerProfile extends Profile {
  expertise_tags: string[]
  semantic_scholar_id?: string
  verified: boolean
  rating: number
  review_count: number
  acceptance_rate: number
  avg_turnaround_days: number
  total_earned: number
}

export interface Manuscript {
  id: string
  author_id: string
  title: string
  abstract?: string
  target_journal?: string
  field?: string
  status: ManuscriptStatus
  progress: number
  word_count?: number
  page_count?: number
  file_url?: string
  file_name?: string
  file_type?: FileType
  semantic_concepts?: SemanticConcept[]
  review_price: number
  deadline_days: number
  created_at: string
  updated_at: string
  // joins
  author?: Profile
  reviews?: Review[]
  files?: ManuscriptFile[]
}

export interface ManuscriptFile {
  id: string
  manuscript_id: string
  name: string
  type: FileType
  url: string
  size: number
  is_primary?: boolean
  created_at: string
}

export interface SemanticConcept {
  tag: string
  confidence: number
  category: 'core' | 'method' | 'data' | 'variable' | 'domain'
  openalex_id?: string
}

export interface Review {
  id: string
  manuscript_id: string
  reviewer_id: string
  status: ReviewStatus
  payment_amount: number
  deadline: string
  overall_score?: number
  recommendation?: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
  summary?: string
  checklist_data?: ChecklistItem[]
  submitted_at?: string
  created_at: string
  updated_at: string
  // joins
  reviewer?: ReviewerProfile
  manuscript?: Manuscript
}

export interface ChecklistItem {
  id: number
  label: string
  status: 'pass' | 'flag' | null
  category: string
  note?: string
}

export interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}

export interface Comment {
  id: string
  manuscript_id: string
  review_id?: string
  author_id: string
  type: CommentType
  content: string
  quote?: string
  page_number?: number
  position_x?: number
  position_y?: number
  highlight_rects?: HighlightRect[] | null
  color?: string
  figure_id?: string
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  // joins
  author?: Profile
  replies?: CommentReply[]
}

export interface CommentReply {
  id: string
  comment_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface Message {
  id: string
  manuscript_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
}

export interface ReviewerMatch {
  reviewer: ReviewerProfile
  match_score: number
  concept_overlap: string[]
  publications_relevant: number
  estimated_turnaround: number
}

export interface UploadState {
  file: File | null
  progress: number
  url: string | null
  error: string | null
}

export interface SubmissionForm {
  title: string
  abstract: string
  target_journal: string
  field: string
  review_type: string
  turnaround_days: number
  special_instructions: string
}

export interface PaperFromAPI {
  paperId: string
  title: string
  abstract?: string
  year?: number
  authors: { authorId: string; name: string }[]
  fieldsOfStudy?: string[]
  citationCount?: number
  referenceCount?: number
  externalIds?: Record<string, string>
}

export interface AuthorFromAPI {
  authorId: string
  name: string
  affiliations?: string[]
  homepage?: string
  paperCount?: number
  citationCount?: number
  hIndex?: number
}

export interface OpenAlexConcept {
  id: string
  display_name: string
  level: number
  score: number
  wikidata?: string
}

export interface DashboardStats {
  manuscripts: number
  activeReviews: number
  avgTurnaround: number
  totalSpent: number
}

export interface ReviewerDashboardStats {
  totalEarned: number
  completedReviews: number
  avgRating: number
  activeJobs: number
  monthlyEarnings: { month: string; amount: number }[]
}
