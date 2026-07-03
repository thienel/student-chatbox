import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSystemSettings, useUpdateSettings } from './queries'

export default function AdminSettingsPage() {
  const { data: settings = [], isLoading } = useSystemSettings()
  const updateSettings = useUpdateSettings()

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
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure global system parameters</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      ) : settings.length === 0 ? (
        <EmptyState icon={Settings} title="No settings found" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-card border rounded-lg divide-y divide-border">
            {settings.map(setting => (
              <div key={setting.key} className="px-5 py-4 flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground font-mono">{setting.key}</p>
                  {setting.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                  )}
                </div>
                <div className="w-48">
                  <Input
                    {...register(encodeKey(setting.key))}
                    className="bg-secondary border-border text-foreground h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 text-sm font-medium rounded-md"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
