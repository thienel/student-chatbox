import { create } from 'zustand'

interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbStore {
  crumbs: Crumb[]
  set: (crumbs: Crumb[]) => void
  reset: () => void
}

export const useBreadcrumbStore = create<BreadcrumbStore>(set => ({
  crumbs: [],
  set: crumbs => set({ crumbs }),
  reset: () => set({ crumbs: [] }),
}))
