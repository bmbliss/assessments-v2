'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StepRenderer } from './StepRenderer'

interface FlowExecutorProps {
  flowId: number
}

interface FlowStep {
  id: number
  type: string
  title?: string
  config: any
}

interface FlowSession {
  assessmentResponseId: number
  currentStep: FlowStep
  flowId: number
  completed?: boolean
}

export function FlowExecutor({ flowId }: FlowExecutorProps) {
  const [session, setSession] = useState<FlowSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startFlow = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/flows/${flowId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: 1 }) // Demo patient
      })
      
      if (!response.ok) {
        throw new Error('Failed to start flow')
      }
      
      const data = await response.json()
      setSession(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStepSubmit = async (stepResponse: any) => {
    if (!session) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/flows/${flowId}/next-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentResponseId: session.assessmentResponseId,
          currentStepId: session.currentStep.id,
          stepResponse
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to proceed to next step')
      }
      
      const data = await response.json()
      
      if (data.completed) {
        setSession({ ...session, completed: true })
      } else {
        setSession({
          ...session,
          currentStep: data.currentStep
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Ready to Begin Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={startFlow} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Starting...' : 'Start Assessment'}
          </Button>
          {error && (
            <p className="text-red-600 mt-2 text-sm">{error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (session.completed) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Assessment Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 mb-4">
            Thank you for completing the assessment. Your responses have been submitted successfully.
          </p>
          <Button onClick={() => setSession(null)} variant="outline">
            Start New Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepRenderer
        step={session.currentStep}
        onSubmit={handleStepSubmit}
        loading={loading}
        error={error}
      />
    </div>
  )
}
