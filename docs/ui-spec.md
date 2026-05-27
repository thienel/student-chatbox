# EduChat — UI Specification

> **Source of truth** cho toàn bộ UI/UX. Mọi component mới phải tuân thủ spec này.  
> Xem **Section 0** để biết full tech stack, setup commands, và cấu hình.

---

## 0. Tech Stack

### 0.1 Overview

| Layer | Package | Version | Status |
|-------|---------|---------|--------|
| Build | `vite` | ^5.3 | ✅ installed |
| Framework | `react` + `react-dom` | ^18.3 | ✅ installed |
| Language | `typescript` | ^5.4, strict mode | ✅ installed |
| Routing | `react-router-dom` | ^6.24 | ✅ installed |
| Styling | `tailwindcss` | ^3.4 | ✅ installed |
| Components | `shadcn/ui` | latest CLI | ⬜ needs setup |
| Icons | `lucide-react` | ^0.400 | ✅ installed |
| Class util | `tailwind-merge` | ^2.x | ⬜ needs install |
| Class util | `clsx` | ^2.x | ✅ installed |
| CVA | `class-variance-authority` | ^0.7 | ⬜ needs install |
| Animation | `tailwindcss-animate` | ^1.x | ⬜ needs install |
| Font | `Geist` | via CSS import | ⬜ needs config |
| Server state | `@tanstack/react-query` | ^5.x | ⬜ needs install |
| Client state | `zustand` | ^4.5 | ✅ installed |
| HTTP | `axios` | ^1.7 | ✅ installed |
| Forms | `react-hook-form` | ^7.x | ⬜ needs install |
| Validation | `zod` | ^3.x | ⬜ needs install |
| RHF + Zod | `@hookform/resolvers` | ^3.x | ⬜ needs install |
| Markdown | `react-markdown` + `remark-gfm` | ^9/^4 | ✅ installed |
| Command | `cmdk` | ^1.x | ⬜ (via shadcn) |

---

### 0.2 Lý do chọn từng package

**Vite** thay vì Create React App hay Next.js:
- App là pure SPA với NestJS backend riêng → không cần SSR
- Vite build nhanh hơn CRA 10–20x, HMR gần như instant

**shadcn/ui** thay vì MUI hay Chakra:
- Không phải library — copy source code vào project, toàn quyền override style
- Build trên Radix UI (accessible primitives) + Tailwind → khớp hoàn toàn với dark theme
- Không cần fight với `!important` hay theme provider

**TanStack Query** thay vì SWR hay tự fetch:
- Cache, background refetch, loading/error state, pagination — built-in
- Zustand giữ *client state* (auth token, UI state); TanStack Query giữ *server state* (API data)
- Rule: không dùng Zustand để store data từ API

**React Hook Form + Zod** thay vì Formik:
- RHF không re-render toàn form khi type → performance tốt hơn nhiều
- Zod infer TypeScript type từ schema → viết schema 1 lần, dùng làm cả validation lẫn type
- `@hookform/resolvers` kết nối hai cái lại

**Zustand** thay vì Redux hay Context:
- Boilerplate gần bằng 0, không cần Provider wrap
- Chỉ dùng cho: auth state, command palette open/close, UI preferences

**class-variance-authority (CVA)**:
- shadcn/ui dùng CVA để định nghĩa variant của component
- Thay vì `cn(base, variant === 'primary' ? '...' : '...')` → `cva(base, { variants: {...} })`

---

### 0.3 Setup commands

```bash
# 1. Packages còn thiếu
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form zod @hookform/resolvers
npm install tailwind-merge class-variance-authority tailwindcss-animate
npm install cmdk

# 2. shadcn/ui init
npx shadcn@latest init
# Chọn: Dark theme · CSS variables · zinc base color · src/components/ui

# 3. Thêm các shadcn components cần dùng
npx shadcn@latest add button input label textarea
npx shadcn@latest add dialog alert-dialog
npx shadcn@latest add tooltip
npx shadcn@latest add command
npx shadcn@latest add toast
npx shadcn@latest add badge separator skeleton
npx shadcn@latest add dropdown-menu
```

---

### 0.4 Cấu hình bắt buộc

**`tailwind.config.ts` — màu zinc + animation plugin:**
```ts
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: 'class',   // class-based, nhưng chỉ dùng dark
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        // shadcn/ui CSS variable mapping — để shadcn components tự dùng đúng màu
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        card:  { DEFAULT: 'hsl(var(--card))',  foreground: 'hsl(var(--card-foreground))' },
        // Giữ nguyên zinc scale để dùng trực tiếp trong className
      },
      borderRadius: {
        lg: '0.5rem',   // 8px  — card, dialog
        md: '0.375rem', // 6px  — button, input
        sm: '0.25rem',  // 4px  — badge, tooltip
      },
    },
  },
  plugins: [animate],
} satisfies Config
```

**`src/index.css` — CSS variables cho shadcn + Geist font:**
```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn/ui dark tokens — mapped to zinc palette */
    --background:    240 10% 3.9%;    /* zinc-950 */
    --foreground:    0 0% 98%;         /* zinc-50  */
    --card:          240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --muted:         240 3.7% 15.9%;  /* zinc-800 */
    --muted-foreground: 240 5% 64.9%; /* zinc-400 */
    --border:        240 3.7% 15.9%;  /* zinc-800 */
    --input:         240 3.7% 15.9%;
    --ring:          240 4.9% 83.9%;  /* zinc-300 */
  }

  * { @apply border-border; }

  html {
    /* Luôn dark, không toggle */
    @apply bg-zinc-950 text-zinc-50;
    font-family: 'Geist', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar — dark style */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { @apply bg-zinc-950; }
  ::-webkit-scrollbar-thumb { @apply bg-zinc-800 rounded-full; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-zinc-700; }
}
```

**`src/lib/utils.ts` — helper cn():**
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**`src/main.tsx` — TanStack Query provider:**
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,      // 1 phút
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    {import.meta.env.DEV && <ReactQueryDevtools />}
  </QueryClientProvider>
)
```

**`tsconfig.json` — strict mode + path alias:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

```ts
// vite.config.ts — path alias
import path from 'path'
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

---

### 0.5 Folder structure

```
src/
├── api/
│   ├── axiosInstance.ts      ← interceptors, auth header, refresh logic
│   └── endpoints/
│       ├── auth.ts
│       ├── subjects.ts
│       ├── documents.ts
│       └── chats.ts
├── components/
│   ├── ui/                   ← shadcn/ui components (auto-generated, không edit trực tiếp)
│   ├── layout/
│   │   ├── AppShell.tsx      ← topbar + dock + main wrapper
│   │   ├── Topbar.tsx
│   │   ├── Dock.tsx
│   │   └── SubjectTabs.tsx
│   └── shared/               ← reusable UI: EmptyState, ConfirmDialog, ...
├── features/
│   ├── auth/
│   ├── subjects/
│   ├── documents/
│   ├── chat/
│   └── admin/
├── hooks/
│   ├── useAuth.ts
│   ├── useChatStream.ts      ← SSE fetch stream
│   └── useCommandPalette.ts
├── lib/
│   └── utils.ts              ← cn()
├── store/
│   └── useAuthStore.ts       ← Zustand: user, token, permissions
├── types/
│   └── index.ts
└── main.tsx
```

> **Convention:** `features/` chứa page-level components + queries. `components/shared/` chứa reusable UI không phụ thuộc vào feature cụ thể. Không import chéo giữa các `features/`.

---

### 0.6 Pattern chuẩn: query + form

```ts
// features/subjects/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectsApi } from '@/api/endpoints/subjects'

export const subjectKeys = {
  all:    () => ['subjects'] as const,
  list:   (filters: ListFilter) => [...subjectKeys.all(), filters] as const,
  detail: (id: string) => [...subjectKeys.all(), id] as const,
}

export function useSubjects(filters: ListFilter) {
  return useQuery({
    queryKey: subjectKeys.list(filters),
    queryFn:  () => subjectsApi.list(filters),
  })
}

export function useCreateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: subjectsApi.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: subjectKeys.all() }),
  })
}
```

```tsx
// features/subjects/CreateSubjectForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function CreateSubjectForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const createSubject = useCreateSubject()

  return (
    <form onSubmit={handleSubmit(v => createSubject.mutateAsync(v).then(onSuccess))}>
      {/* fields */}
    </form>
  )
}
```

---

## 1. Design philosophy

**Clean. Dark. Monochrome. Sharp.**

- Whitespace là design element, không phải khoảng trống thừa
- Không có màu accent — hierarchy được tạo bởi contrast và weight
- Border và background phân tầng, không phải shadow
- Interactive element phải rõ ràng qua hover state, không qua màu sắc
- Mọi thứ phải cảm giác *intentional* — không trang trí thừa

---

## 2. Color tokens

### Dark palette (dark only — không có light mode)

| Token | Value | Tailwind class | Dùng cho |
|-------|-------|----------------|----------|
| `bg-base` | `#09090B` | `bg-zinc-950` | Background toàn trang |
| `bg-surface` | `#18181B` | `bg-zinc-900` | Card, sidebar, panel |
| `bg-elevated` | `#27272A` | `bg-zinc-800` | Dropdown, hover state, input |
| `bg-overlay` | `#3F3F46` | `bg-zinc-700` | Selected state, active nav item |
| `border-default` | `#27272A` | `border-zinc-800` | Border mặc định |
| `border-strong` | `#3F3F46` | `border-zinc-700` | Border nhấn mạnh, divider |
| `text-primary` | `#FAFAFA` | `text-zinc-50` | Heading, nội dung chính |
| `text-secondary` | `#A1A1AA` | `text-zinc-400` | Subtext, metadata, placeholder |
| `text-muted` | `#71717A` | `text-zinc-500` | Caption, disabled text |
| `text-inverted` | `#09090B` | `text-zinc-950` | Text trên nền sáng (badge) |

### Semantic colors (chỉ dùng cho trạng thái, không trang trí)

| Token | Value | Tailwind | Dùng cho |
|-------|-------|----------|----------|
| `status-success` | `#22C55E` | `text-green-500` | Success state text/icon |
| `status-warning` | `#EAB308` | `text-yellow-500` | Warning state text/icon |
| `status-error` | `#EF4444` | `text-red-500` | Error state text/icon |
| `status-info` | `#A1A1AA` | `text-zinc-400` | Neutral info |
| `bg-success-subtle` | `#14532D/20%` | `bg-green-950` | Background badge success |
| `bg-error-subtle` | `#450A0A/20%` | `bg-red-950` | Background badge error |

> **Rule:** Màu semantic chỉ xuất hiện tại trạng thái — upload processing, document error, user suspended. Không dùng để highlight hay decoration.

---

## 3. Typography

**Font:** [Geist](https://vercel.com/font) — import từ `next/font` hoặc Google Fonts  
**Mono font:** Geist Mono — chỉ dùng cho code, ID, timestamp

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

body {
  font-family: 'Geist', system-ui, sans-serif;
}
```

### Type scale

| Role | Size | Weight | Line height | Tailwind |
|------|------|--------|-------------|---------|
| Display | 28px | 600 | 1.2 | `text-2xl font-semibold leading-tight` |
| Heading | 20px | 600 | 1.3 | `text-xl font-semibold` |
| Subheading | 16px | 500 | 1.4 | `text-base font-medium` |
| Body | 14px | 400 | 1.5 | `text-sm` |
| Small | 13px | 400 | 1.5 | `text-[13px]` |
| Caption | 12px | 400 | 1.4 | `text-xs` |
| Mono | 13px | 400 | 1.4 | `text-[13px] font-mono` |

### Typography rules

- **Heading**: luôn `text-zinc-50`, weight 600
- **Body**: `text-zinc-300` cho nội dung dài, `text-zinc-50` cho label ngắn
- **Secondary**: `text-zinc-400` — metadata, timestamp, description
- **Muted**: `text-zinc-500` — placeholder, disabled, empty state
- Không dùng `font-bold` (700) trong UI — max là `font-semibold` (600)
- Không tự ý thêm letter-spacing trừ khi spec ghi rõ

---

## 4. Spacing system

Base unit: **4px**. Chỉ dùng bội số của 4.

| Scale | px | Tailwind | Dùng cho |
|-------|----|----------|----------|
| 1 | 4px | `p-1` | Icon padding nhỏ nhất |
| 2 | 8px | `p-2` | Badge, icon button |
| 3 | 12px | `p-3` | Button default |
| 4 | 16px | `p-4` | Card padding nhỏ |
| 5 | 20px | `p-5` | — |
| 6 | 24px | `p-6` | Card padding chuẩn |
| 8 | 32px | `p-8` | Section padding |

**Gap giữa components:** `gap-2` (8px) cho elements liên quan, `gap-4` (16px) cho sections.

> Không dùng giá trị lẻ như `px-[14px]`, `mt-[7px]`. Nếu cần giá trị đặc biệt, confirm trước.

---

## 5. Border & radius

### Border radius

| Component | Value | Tailwind |
|-----------|-------|---------|
| Card, panel, dialog | 8px | `rounded-lg` |
| Button, input, select | 6px | `rounded-md` |
| Badge, tag | 4px | `rounded` |
| Avatar | 50% | `rounded-full` |
| Tooltip | 4px | `rounded` |

> Sharp & Precise: không dùng `rounded-xl` (12px) hay `rounded-2xl` trừ avatar.

### Border

```
border border-zinc-800          ← mặc định cho card/panel
border border-zinc-700          ← focus state, strong divider
border-b border-zinc-800        ← divider ngang
```

- Không dùng `divide-*` utility — dùng `border-b` explicit trên từng item
- Card không có shadow — dùng `bg-zinc-900 border border-zinc-800` thay thế

---

## 6. Components

### Button

```tsx
// Primary action — white on dark
<Button className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md">
  Action
</Button>

// Secondary — outline
<Button variant="outline" className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 h-8 px-3 text-sm rounded-md">
  Secondary
</Button>

// Ghost — sidebar/nav item
<Button variant="ghost" className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 h-8 px-2 text-sm justify-start w-full rounded-md">
  Ghost item
</Button>

// Destructive
<Button className="bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-red-300 h-8 px-3 text-sm rounded-md">
  Delete
</Button>

// Icon button
<Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800">
  <MoreHorizontal className="h-4 w-4" />
</Button>
```

**Rules:**
- Height chuẩn: `h-8` (32px). Chỉ dùng `h-9` (36px) cho form context.
- Không tự tạo button từ `<div>` hay `<span>` — luôn dùng `<Button>`
- Không dùng `shadow-*` trên button

### Input & Form

```tsx
<div className="space-y-1.5">
  <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
    Email
  </Label>
  <Input
    className="bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-600
               focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:border-zinc-600
               h-9 text-sm rounded-md"
    placeholder="name@example.com"
  />
  {error && (
    <p className="text-xs text-red-400">{error}</p>
  )}
</div>
```

**Rules:**
- Label: `text-xs uppercase tracking-wide text-zinc-400` — không dùng label thường
- Error: `text-xs text-red-400` dưới input, không dùng icon
- Required field: không dùng `*` đỏ — dùng `(required)` nếu cần thiết
- Textarea: `min-h-[80px] resize-none`

### Card

```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
  {/* content */}
</div>

// Card với header
<div className="bg-zinc-900 border border-zinc-800 rounded-lg">
  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
    <h3 className="text-sm font-medium text-zinc-50">Title</h3>
    <Button variant="ghost" size="icon" ...>...</Button>
  </div>
  <div className="p-4">
    {/* content */}
  </div>
</div>
```

### Badge / Status

```tsx
// Default
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-zinc-800 text-zinc-400">
  Label
</span>

// Active / Success
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-green-950 text-green-400">
  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  Active
</span>

// Error
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-red-950 text-red-400">
  Error
</span>
```

### Table (Comfortable density)

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-zinc-800">
      <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">
        Column
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors duration-150">
      <td className="py-3 px-4 text-zinc-300">Value</td>
    </tr>
  </tbody>
</table>
```

- Row height: `py-3` (comfortable ~48px tổng)
- Header: `text-xs uppercase tracking-wide text-zinc-500`
- Hover: `hover:bg-zinc-900/50` — nhẹ nhàng, không flash

### Dialog / Modal

```tsx
<DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-md">
  <div className="px-5 py-4 border-b border-zinc-800">
    <DialogTitle className="text-base font-semibold text-zinc-50">Title</DialogTitle>
    <DialogDescription className="text-sm text-zinc-400 mt-0.5">Description</DialogDescription>
  </div>
  <div className="p-5 space-y-4">
    {/* body */}
  </div>
  <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2">
    <Button variant="outline" ...>Cancel</Button>
    <Button ...>Confirm</Button>
  </div>
</DialogContent>
```

### Empty state

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="h-10 w-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
    <IconName className="h-5 w-5 text-zinc-500" />
  </div>
  <p className="text-sm font-medium text-zinc-300">No items yet</p>
  <p className="text-xs text-zinc-500 mt-1 max-w-xs">Description of what this section is for.</p>
  {/* CTA nếu có action */}
  <Button className="mt-4 ...">Create first item</Button>
</div>
```

---

## 7. Navigation

### Pattern: **Floating dock (bottom-center) + Topbar context**

Dock là điểm navigation duy nhất — không có sidebar. Topbar hiện breadcrumb và context của trang hiện tại. Khi đi sâu vào subject, sub-tabs xuất hiện ngay dưới topbar.

---

### 7.1 Shell layout

```
┌──────────────────────────────────────────────────────────┐
│  Breadcrumb / Page title              [⌘K]  [avatar]     │  ← topbar h-12
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│                    Page content                          │
│                    max-w-5xl mx-auto px-6                │
│                                                          │
│                                                          │
│              ┌───────────────────────────┐              │
│              │  🏠    📚    💬    ⚙️      │  ← dock      │
│              └───────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
                         pb-20 để content không bị dock che
```

**Khi vào trong một subject — sub-tabs xuất hiện:**

```
┌──────────────────────────────────────────────────────────┐
│  Subjects > CS101 — Intro to CS       [⌘K]  [avatar]     │  ← topbar
├──────────────────────────────────────────────────────────┤
│  Documents    Chat    Members                             │  ← sub-tabs (h-10)
├──────────────────────────────────────────────────────────┤
│                                                          │
│                    Page content                          │
│                                                          │
│              ┌───────────────────────────┐              │
│              │  🏠    📚    💬    ⚙️      │              │
│              └───────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

---

### 7.2 Dock component

```tsx
// Dock — fixed, bottom-center, floating
<nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                flex items-center gap-1 px-3 h-12
                bg-zinc-900/90 backdrop-blur-md
                border border-zinc-800 rounded-2xl
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

  <DockItem href="/home"     icon={Home}      label="Home"     />
  <DockItem href="/subjects" icon={BookOpen}   label="Subjects" />
  <DockItem href="/chats"    icon={MessageSquare} label="My Chats" />

  {/* Admin only */}
  {isAdmin && (
    <>
      <div className="w-px h-5 bg-zinc-800 mx-1" />  {/* divider */}
      <DockItem href="/admin" icon={ShieldCheck} label="Admin" />
    </>
  )}

  <div className="w-px h-5 bg-zinc-800 mx-1" />
  <DockItem href="/settings" icon={Settings} label="Settings" />
</nav>
```

**DockItem:**
```tsx
function DockItem({ href, icon: Icon, label }: DockItemProps) {
  const isActive = usePathname().startsWith(href)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={cn(
            "relative flex items-center justify-center h-8 w-8 rounded-xl",
            "transition-colors duration-150",
            isActive
              ? "bg-zinc-800 text-zinc-50"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
          {/* Active dot */}
          {isActive && (
            <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2
                             h-0.5 w-3 rounded-full bg-zinc-50" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
```

**Visual spec của dock:**
| Property | Value |
|----------|-------|
| Position | `fixed bottom-4`, horizontally centered |
| Height | `h-12` (48px) |
| Background | `bg-zinc-900/90 backdrop-blur-md` |
| Border | `border border-zinc-800` |
| Radius | `rounded-2xl` (exception — dock là floating element, không phải card) |
| Shadow | `shadow-[0_8px_32px_rgba(0,0,0,0.4)]` |
| Icon size | `h-[18px] w-[18px]` |
| Item size | `h-8 w-8 rounded-xl` |
| Active bg | `bg-zinc-800` |
| Active dot | `h-0.5 w-3 bg-zinc-50` dưới icon |
| Inactive | `text-zinc-500 hover:text-zinc-300` |

---

### 7.3 Topbar

```tsx
<header className="fixed top-0 left-0 right-0 z-40 h-12
                   flex items-center justify-between px-5
                   bg-zinc-950/90 backdrop-blur-md
                   border-b border-zinc-900">

  {/* Left: breadcrumb */}
  <Breadcrumb />

  {/* Right: command bar trigger + avatar */}
  <div className="flex items-center gap-2">
    <button
      onClick={() => setCommandOpen(true)}
      className="flex items-center gap-2 h-7 px-2.5 rounded-md
                 bg-zinc-900 border border-zinc-800 text-zinc-500
                 hover:text-zinc-300 hover:border-zinc-700
                 transition-colors duration-150 text-xs"
    >
      <Search className="h-3 w-3" />
      <span>Search</span>
      <kbd className="ml-1 text-[10px] text-zinc-600 font-mono">⌘K</kbd>
    </button>
    <UserMenu />
  </div>
</header>
```

**Breadcrumb pattern:**
```tsx
// Top level — chỉ hiện section name
<span className="text-sm font-medium text-zinc-50">Subjects</span>

// Inside subject — clickable path
<nav className="flex items-center gap-1.5 text-sm">
  <Link href="/subjects" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">
    Subjects
  </Link>
  <ChevronRight className="h-3 w-3 text-zinc-700" />
  <span className="text-zinc-50 font-medium truncate max-w-[200px]">
    CS101 — Intro to CS
  </span>
</nav>
```

---

### 7.4 Sub-tabs (chỉ xuất hiện khi ở trong một subject)

```tsx
<div className="flex items-center gap-0 border-b border-zinc-900 px-5 bg-zinc-950">
  {tabs.map(tab => (
    <Link
      key={tab.href}
      href={tab.href}
      className={cn(
        "flex items-center gap-1.5 h-10 px-3 text-sm border-b-2 -mb-px",
        "transition-colors duration-150",
        isActive(tab.href)
          ? "border-zinc-50 text-zinc-50"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      )}
    >
      <tab.icon className="h-3.5 w-3.5" />
      {tab.label}
    </Link>
  ))}
</div>

// Tabs cho subject:
const subjectTabs = [
  { label: 'Documents', href: `/subjects/${id}/documents`, icon: FileText },
  { label: 'Chat',      href: `/subjects/${id}/chat`,      icon: MessageSquare },
  { label: 'Members',   href: `/subjects/${id}/members`,   icon: Users },
]
```

---

### 7.5 Command palette (⌘K)

```tsx
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput
    placeholder="Search subjects, chats..."
    className="border-0 focus:ring-0 text-sm text-zinc-50 placeholder:text-zinc-600"
  />
  <CommandList className="max-h-80">
    <CommandEmpty className="text-sm text-zinc-500 text-center py-6">
      No results found.
    </CommandEmpty>

    <CommandGroup heading="Subjects">
      {subjects.map(s => (
        <CommandItem key={s.id} onSelect={() => navigate(`/subjects/${s.id}`)}>
          <BookOpen className="h-3.5 w-3.5 mr-2 text-zinc-500" />
          <span className="text-zinc-300">{s.code}</span>
          <span className="ml-1.5 text-zinc-500">— {s.name}</span>
        </CommandItem>
      ))}
    </CommandGroup>

    <CommandSeparator />

    <CommandGroup heading="Recent Chats">
      {recentChats.map(c => (
        <CommandItem key={c.id} onSelect={() => navigate(`/chats/${c.id}`)}>
          <MessageSquare className="h-3.5 w-3.5 mr-2 text-zinc-500" />
          <span className="text-zinc-300">{c.title}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

**Style cho CommandDialog:**
```tsx
// Trong globals.css hoặc component override
// Dialog content: bg-zinc-900 border border-zinc-800 rounded-lg shadow-[0_24px_48px_rgba(0,0,0,0.6)]
// CommandItem hover: bg-zinc-800
// CommandGroup heading: text-[11px] uppercase tracking-wider text-zinc-600
// Shortcut: text-[11px] text-zinc-600 font-mono
```

---

### 7.6 Responsive behavior

| Breakpoint | Dock behavior | Sub-tabs |
|------------|---------------|----------|
| Mobile < 768px | Dock vẫn bottom-center, rộng ~90% viewport | Scroll ngang nếu > 3 tabs |
| Tablet 768–1024px | Dock giữ nguyên | Hiện đủ |
| Desktop > 1024px | Dock giữ nguyên | Hiện đủ |

**Content area padding để tránh bị dock che:**
```tsx
// Layout wrapper — luôn có padding bottom bằng dock height + offset
<main className="pt-12 pb-24 min-h-screen">
  {/* pt-12 = topbar, pb-24 = dock 48px + bottom-4 (16px) + buffer (16px) */}
  {children}
</main>
```

---

## 8. Chat UI — Split panel

```
┌────────────────────────────┬──────────────────────────┐
│  Chat messages             │  Sources                 │
│  (flex-1)                  │  (w-72, border-l)        │
│                            │                          │
│  ┌──────────────────────┐  │  ┌──────────────────┐   │
│  │ You          14:32   │  │  │ 📄 lecture-01.pdf│   │
│  │ câu hỏi ở đây        │  │  │ > excerpt text...│   │
│  └──────────────────────┘  │  └──────────────────┘   │
│                            │                          │
│  ┌──────────────────────┐  │  ┌──────────────────┐   │
│  │ AI           14:32   │  │  │ 📄 lecture-03.pdf│   │
│  │ trả lời streaming... │  │  │ > excerpt text...│   │
│  └──────────────────────┘  │  └──────────────────┘   │
│                            │                          │
├────────────────────────────┴──────────────────────────┤
│  [  Type a message...                          Send ] │
└───────────────────────────────────────────────────────┘
```

### Message styles

```tsx
// User message
<div className="flex justify-end mb-4">
  <div className="max-w-[72%] bg-zinc-800 rounded-lg px-3 py-2">
    <p className="text-sm text-zinc-50">{content}</p>
    <span className="text-[11px] text-zinc-500 mt-1 block text-right">{time}</span>
  </div>
</div>

// AI message (full width, no bubble)
<div className="mb-6">
  <div className="flex items-center gap-2 mb-2">
    <div className="h-5 w-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
      <Bot className="h-3 w-3 text-zinc-400" />
    </div>
    <span className="text-xs text-zinc-500">EduChat · {time}</span>
  </div>
  <div className="text-sm text-zinc-300 leading-relaxed prose prose-invert prose-sm">
    {/* markdown rendered content */}
  </div>
</div>

// Typing indicator (streaming)
<div className="flex gap-1 py-2">
  <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
  <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
  <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
</div>
```

### Source panel

```tsx
// Source card (right panel)
<div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 mb-2 cursor-pointer hover:border-zinc-700 transition-colors duration-150">
  <div className="flex items-center gap-2 mb-1.5">
    <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
    <span className="text-xs font-medium text-zinc-300 truncate">{filename}</span>
    <span className="text-[11px] text-zinc-600 ml-auto shrink-0">p.{page}</span>
  </div>
  <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-3">
    {excerpt}
  </p>
</div>
```

### Input area

```tsx
<div className="border-t border-zinc-800 p-3">
  <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2
                  focus-within:border-zinc-700 transition-colors duration-150">
    <Textarea
      className="flex-1 bg-transparent border-0 text-sm text-zinc-50 placeholder:text-zinc-600
                 resize-none focus-visible:ring-0 min-h-[20px] max-h-[120px] p-0"
      placeholder="Ask anything about this subject..."
      rows={1}
    />
    <Button size="icon" className="h-7 w-7 rounded-md bg-zinc-50 text-zinc-950 hover:bg-zinc-200 shrink-0">
      <SendHorizonal className="h-3.5 w-3.5" />
    </Button>
  </div>
</div>
```

---

## 9. Animation & transition

**Principle:** Subtle — chỉ báo hiệu state change, không gây distraction.

| Transition | Duration | Easing | Dùng cho |
|-----------|----------|--------|----------|
| Hover state | 150ms | ease-out | button, row, nav item |
| Color change | 150ms | ease-out | border focus, icon color |
| Modal open | 200ms | ease-out | scale 0.95→1 + opacity |
| Modal close | 150ms | ease-in | scale 1→0.95 + opacity |
| Dropdown | 150ms | ease-out | fade + translate-y -4px→0 |
| Toast | 200ms | ease-out | slide in từ bottom-right |

```tsx
// Tailwind transition class chuẩn cho hover
className="transition-colors duration-150"

// Cho transform + opacity (modal/dropdown)
className="transition-all duration-200 ease-out"
```

**Không dùng:** `animate-pulse` (trừ skeleton), `animate-spin` (trừ loading spinner), spring/bounce animation.

**Skeleton loading:**
```tsx
<div className="h-4 w-3/4 rounded bg-zinc-800 animate-pulse" />
```

---

## 10. Icon usage

- **Library:** Lucide React duy nhất — không mix với heroicons, react-icons
- **Size chuẩn:** `h-4 w-4` (16px) — tất cả trường hợp thông thường
- **Size nhỏ:** `h-3.5 w-3.5` (14px) — trong badge, caption, metadata
- **Size lớn:** `h-5 w-5` (20px) — empty state, feature icon standalone
- **Color:** Kế thừa `currentColor` — không set màu trực tiếp trên icon
- **Stroke width:** Mặc định (1.5) — không override

```tsx
// ✓ Đúng
<Upload className="h-4 w-4" />

// ✗ Sai — màu hardcode
<Upload className="h-4 w-4 text-blue-500" />

// ✗ Sai — size không chuẩn
<Upload className="h-[18px] w-[18px]" />
```

---

## 11. Loading & async states

### Button loading

```tsx
<Button disabled={loading} className="...">
  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
  {loading ? 'Saving...' : 'Save changes'}
</Button>
```

### Page / list skeleton

```tsx
// Dùng khi load danh sách
{isLoading ? (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
        <div className="h-4 w-4 rounded bg-zinc-800 animate-pulse" />
        <div className="h-4 flex-1 rounded bg-zinc-800 animate-pulse" />
        <div className="h-4 w-16 rounded bg-zinc-800 animate-pulse" />
      </div>
    ))}
  </div>
) : (
  <DataList />
)}
```

### Refetch (data đã có, đang refresh)

```tsx
<div className="relative">
  <DataContent />
  {isRefetching && (
    <div className="absolute top-2 right-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
    </div>
  )}
</div>
```

---

## 12. Feedback & notifications

### Toast

```tsx
// Success
toast({ description: 'Document uploaded successfully.' })

// Error
toast({ variant: 'destructive', description: 'Upload failed. Try again.' })
```

- Không dùng title cho toast — chỉ description
- Không dùng icon trong toast
- Max 1 toast cùng lúc, duration 3s
- Position: bottom-right

### Confirm destructive

```tsx
// Luôn dùng AlertDialog — không dùng window.confirm
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button ...>Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="bg-zinc-900 border border-zinc-800 ...">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-zinc-50">Delete document?</AlertDialogTitle>
      <AlertDialogDescription className="text-zinc-400">
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="...">Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-red-950 text-red-400 ...">Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 13. Responsive

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Icon rail ẩn, bottom nav 4 items hoặc hamburger |
| Tablet | 768–1024px | Icon rail hiện (w-12), sources panel ẩn |
| Desktop | > 1024px | Full layout — rail + main + sources panel |

```tsx
// Sources panel responsive
<div className="hidden lg:block w-72 border-l border-zinc-800 ...">
  {/* sources */}
</div>
```

---

## 14. Things Claude must NOT do

1. **Không dùng màu accent** — không thêm blue, indigo, cyan hay bất kỳ màu nào ngoài zinc/green/red/yellow semantic
2. **Không dùng shadow** — `shadow-*` bị cấm; dùng border thay thế
3. **Không dùng `rounded-xl`, `rounded-2xl`** cho card/button — chỉ `rounded-lg` và `rounded-md`
4. **Không dùng `font-bold` (700)** — max là `font-semibold` (600)
5. **Không hardcode giá trị lẻ** — không `px-[14px]`, `h-[37px]`, `mt-[7px]`
6. **Không dùng inline style** `style={{...}}` trừ dynamic value không thể tránh
7. **Không import thêm UI library** ngoài shadcn/ui và Lucide React
8. **Không tạo light mode class** — app là dark only, không cần `dark:` prefix
9. **Không dùng `window.confirm`** — luôn dùng AlertDialog
10. **Không tự thêm animation** ngoài những gì đã liệt kê trong section 9
11. **Khi thiếu spec cho component mới** — hỏi trước, không tự phát minh pattern mới

---

## 15. Quick reference

```
Background layers:
  zinc-950  →  page bg
  zinc-900  →  card / sidebar / panel
  zinc-800  →  hover / elevated / input
  zinc-700  →  selected / active / strong border

Text layers:
  zinc-50   →  primary content
  zinc-300  →  body text
  zinc-400  →  secondary / metadata
  zinc-500  →  muted / placeholder
  zinc-600  →  very muted / inactive

Border:
  zinc-800  →  default
  zinc-700  →  focus / strong

Radius:
  rounded-lg  (8px)  →  card, dialog
  rounded-md  (6px)  →  button, input
  rounded     (4px)  →  badge, tooltip
  rounded-full       →  avatar

Transition:
  duration-150  →  color/border hover
  duration-200  →  modal/dropdown open
```
