import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSystemSettings, useUpdateSystemSettings } from '@/api/queries/system'

export default function AdminSettingsPage() {
  const { data: settings = [], isLoading } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()

  const encodeKey = (k: string) => k.replace(/\./g, '․')
  const decodeKey = (k: string) => k.replace(/․/g, '.')

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Record<string, string>>()

  useEffect(() => {
    if (settings.length > 0) {
      const defaults: Record<string, string> = {}
      settings.forEach(s => { defaults[encodeKey(s.key)] = String(s.value) })
      reset(defaults)
    }
  }, [settings, reset])

  const onSubmit = async (data: Record<string, string>) => {
    const normalized: Record<string, string> = {}
    Object.entries(data).forEach(([k, v]) => { normalized[decodeKey(k)] = v })
    await updateSettings.mutateAsync(normalized)
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-serif text-primary-ink mb-2">System Settings</h1>
        <p className="text-sm text-muted-foreground font-mono">Configure global system parameters</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-3xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : settings.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 shadow-sm">
          <EmptyState icon={Settings} title="No settings found" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border/50 rounded-3xl divide-y divide-border/40 shadow-sm overflow-hidden">
            {settings.map(setting => (
              <div key={setting.key} className="px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-muted/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground font-mono tracking-wide">{setting.description}</p>
                  {/* {setting.description && (
                    <p className="text-sm text-muted-foreground mt-1.5">{setting.description}</p>
                  )} */}
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <Input
                    {...register(encodeKey(setting.key))}
                    className="bg-muted/5 border-border/60 text-foreground h-11 text-sm rounded-xl focus-visible:ring-primary shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full font-mono text-xs tracking-wider uppercase h-11 px-8 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
