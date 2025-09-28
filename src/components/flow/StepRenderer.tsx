'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestionStep } from './steps/QuestionStep'
import { InformationStep } from './steps/InformationStep'

interface StepRendererProps {
  step: {
    id: number
    type: string
    title?: string
    config: any
  }
  onSubmit: (response: any) => void
  loading: boolean
  error: string | null
}

export function StepRenderer({ step, onSubmit, loading, error }: StepRendererProps) {
  const [response, setResponse] = useState<any>(null)

  const handleSubmit = () => {
    onSubmit(response)
  }

  const renderStepContent = () => {
    switch (step.type) {
      case 'QUESTION':
        return (
          <QuestionStep
            config={step.config}
            onChange={setResponse}
            value={response}
          />
        )
      case 'INFORMATION':
        return (
          <InformationStep
            config={step.config}
            onContinue={() => setResponse({ acknowledged: true })}
          />
        )
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              Step type "{step.type}" not yet implemented
            </p>
          </div>
        )
    }
  }

  const canProceed = () => {
    if (step.type === 'INFORMATION') {
      return response?.acknowledged
    }
    if (step.type === 'QUESTION') {
      return response !== null && response !== undefined && response !== ''
    }
    return true
  }

  return (
    <Card>
      <CardHeader>
        {step.title && <CardTitle>{step.title}</CardTitle>}
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepContent()}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="min-w-24"
          >
            {loading ? 'Loading...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}