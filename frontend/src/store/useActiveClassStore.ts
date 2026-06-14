import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ActiveClassState {
  // subjectId -> classId the lecturer/admin is currently working in
  bySubject: Record<string, string>
  setActiveClass: (subjectId: string, classId: string) => void
}

export const useActiveClassStore = create<ActiveClassState>()(
  persist(
    (set) => ({
      bySubject: {},
      setActiveClass: (subjectId, classId) =>
        set((s) => ({ bySubject: { ...s.bySubject, [subjectId]: classId } })),
    }),
    { name: 'educhat-active-class' },
  ),
)
