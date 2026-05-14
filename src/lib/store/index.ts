import { create } from 'zustand'
import { Profile, Manuscript, Comment, Message, Review } from '@/types'

interface AppState {
  profile: Profile | null
  setProfile: (p: Profile | null) => void

  manuscripts: Manuscript[]
  setManuscripts: (m: Manuscript[]) => void
  addManuscript: (m: Manuscript) => void
  updateManuscript: (id: string, updates: Partial<Manuscript>) => void

  activeManuscript: Manuscript | null
  setActiveManuscript: (m: Manuscript | null) => void

  comments: Comment[]
  setComments: (c: Comment[]) => void
  addComment: (c: Comment) => void
  updateComment: (id: string, updates: Partial<Comment>) => void

  messages: Message[]
  setMessages: (m: Message[]) => void
  addMessage: (m: Message) => void

  activeReview: Review | null
  setActiveReview: (r: Review | null) => void

  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  workspaceTab: 'manuscript' | 'figures'
  setWorkspaceTab: (t: 'manuscript' | 'figures') => void

  rightPanelTab: 'comments' | 'checklist' | 'chat' | 'activity'
  setRightPanelTab: (t: 'comments' | 'checklist' | 'chat' | 'activity') => void
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (p) => set({ profile: p }),

  manuscripts: [],
  setManuscripts: (m) => set({ manuscripts: m }),
  addManuscript: (m) => set(s => ({ manuscripts: [m, ...s.manuscripts] })),
  updateManuscript: (id, updates) =>
    set(s => ({
      manuscripts: s.manuscripts.map(m => m.id === id ? { ...m, ...updates } : m),
      activeManuscript: s.activeManuscript?.id === id
        ? { ...s.activeManuscript, ...updates }
        : s.activeManuscript,
    })),

  activeManuscript: null,
  setActiveManuscript: (m) => set({ activeManuscript: m }),

  comments: [],
  setComments: (c) => set({ comments: c }),
  addComment: (c) => set(s => ({ comments: [c, ...s.comments] })),
  updateComment: (id, updates) =>
    set(s => ({ comments: s.comments.map(c => c.id === id ? { ...c, ...updates } : c) })),

  messages: [],
  setMessages: (m) => set({ messages: m }),
  addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),

  activeReview: null,
  setActiveReview: (r) => set({ activeReview: r }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  workspaceTab: 'manuscript',
  setWorkspaceTab: (t) => set({ workspaceTab: t }),

  rightPanelTab: 'comments',
  setRightPanelTab: (t) => set({ rightPanelTab: t }),
}))
