'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface StartStepSelectorProps {
  flowId: number
  steps: Array<{
    id: number
    type: string
    title?: string
  }>
  onStartStepChange: () => void
}

export function StartStepSelector({ flowId, steps, onStartStepChange }: StartStepSelectorProps) {
  const [startStepId, setStartStepId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStartStep()
  }, [flowId])

  const fetchStartStep = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/flows/${flowId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch flow data')
      }
      const flowData = await response.json()
      setStartStepId(flowData.startStepId)
    } catch (err) {
      setError('Failed to load start step')
    } finally {
      setLoading(false)
    }
  }

  const handleSetStartStep = async (stepId: number) => {
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startStepId: stepId })
      })

      if (!response.ok) {
        throw new Error('Failed to set start step')
      }

      setStartStepId(stepId)
      onStartStepChange()
    } catch (err) {
      setError('Failed to set start step')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading flow configuration...</p>
      </div>
    )
  }

  const startStep = steps.find(step => step.id === startStepId)

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Current Start Step:
          </label>
          {startStep ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                START
              </Badge>
              <span className="text-sm font-medium">
                {startStep.title || `${startStep.type} Step ${startStep.id}`}
              </span>
              <span className="text-xs text-gray-500">
                (Step {startStep.id})
              </span>
            </div>
          ) : (
            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ <strong>No start step set!</strong> Patients won't be able to begin this assessment.
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Change Start Step:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {steps.map((step) => (
            <Button
              key={step.id}
              variant={step.id === startStepId ? "default" : "outline"}
              size="sm"
              onClick={() => handleSetStartStep(step.id)}
              disabled={saving || step.id === startStepId}
              className="justify-start text-left h-auto p-3"
            >
              <div>
                <div className="font-medium text-sm">
                  {step.title || `${step.type} Step`}
                </div>
                <div className="text-xs opacity-70">
                  {step.type} • ID: {step.id}
                </div>
              </div>
            </Button>
          ))}
        </div>
        {saving && (
          <div className="text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Saving start step...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
