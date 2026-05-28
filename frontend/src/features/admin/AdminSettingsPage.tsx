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

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Record<string, string>>()

  useEffect(() => {
    if (settings.length > 0) {
      const defaults: Record<string, string> = {}
      settings.forEach(s => { defaults[s.key] = String(s.value) })
      reset(defaults)
    }
  }, [settings, reset])

  const onSubmit = async (data: Record<string, string>) => {
    await updateSettings.mutateAsync(data)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">System Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Configure global system parameters</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : settings.length === 0 ? (
        <EmptyState icon={Settings} title="No settings found" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            {settings.map(setting => (
              <div key={setting.key} className="px-5 py-4 flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-300 font-mono">{setting.key}</p>
                  {setting.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{setting.description}</p>
                  )}
                </div>
                <div className="w-48">
                  <Input
                    {...register(setting.key)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-50 h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-4 text-sm font-medium rounded-md"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
