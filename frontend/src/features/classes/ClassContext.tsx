import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { usePermission } from '@/store/useAuthStore'
import { useActiveClassStore } from '@/store/useActiveClassStore'
import { useClasses, useMyClass } from './queries'
import type { Class } from '@/types'

interface SubjectClassValue {
  subjectId: string
  isStudent: boolean
  isLecturer: boolean
  /** The class id all content operations should use, or undefined while unresolved. */
  classId?: string
  loading: boolean
  // student
  myClass?: Class | null
  needsEnroll: boolean
  // lecturer/admin
  classes: Class[]
  activeClassId?: string
  setActiveClass: (classId: string) => void
  needsClass: boolean
}

const Ctx = createContext<SubjectClassValue | null>(null)

export function SubjectClassProvider({
  subjectId,
  children,
}: {
  subjectId: string
  children: ReactNode
}) {
  // Class managers (class:manage) work inside a class they pick. Enrollers
  // (subject:enroll, i.e. students) access the single class they joined and are
  // gated until they do. Anyone else (e.g. a scoped admin) is neither — they
  // browse without a class context and are never gated.
  const isLecturer = usePermission('class:manage')
  const canEnroll = usePermission('subject:enroll')
  const isStudent = canEnroll && !isLecturer

  const myClassQ = useMyClass(subjectId, isStudent)
  const classesQ = useClasses(subjectId, isLecturer)

  const bySubject = useActiveClassStore(s => s.bySubject)
  const setActive = useActiveClassStore(s => s.setActiveClass)
  const classes = classesQ.data ?? []
  const storedActive = bySubject[subjectId]
  const activeClassId =
    isLecturer && classes.length > 0
      ? classes.some(c => c.id === storedActive)
        ? storedActive
        : classes[0].id
      : undefined

  // Default the active class to the first one once classes load.
  useEffect(() => {
    if (isLecturer && classes.length > 0 && !classes.some(c => c.id === storedActive)) {
      setActive(subjectId, classes[0].id)
    }
  }, [isLecturer, classes, storedActive, setActive, subjectId])

  const value: SubjectClassValue = {
    subjectId,
    isStudent,
    isLecturer,
    classId: isStudent ? myClassQ.data?.id : activeClassId,
    loading: isStudent ? myClassQ.isLoading : classesQ.isLoading,
    myClass: myClassQ.data,
    needsEnroll: isStudent && !myClassQ.isLoading && !myClassQ.data,
    classes,
    activeClassId,
    setActiveClass: (classId: string) => setActive(subjectId, classId),
    needsClass: isLecturer && !classesQ.isLoading && classes.length === 0,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSubjectClass(): SubjectClassValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSubjectClass must be used within SubjectClassProvider')
  return v
}
