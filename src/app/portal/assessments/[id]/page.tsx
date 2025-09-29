'use client'

import { useState, useEffect } from 'react'
import { FlowExecutor } from '@/components/flow/FlowExecutor'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AssessmentPageProps {
  params: {
    id: string
  }
}

interface Assessment {
  id: number
  title: string
  status: string
  versions: Array<{
    id: number
    flows: Array<{
      id: number
    }>
  }>
}

export default function AssessmentPage({ params }: AssessmentPageProps) {
  const assessmentId = parseInt(params.id)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessment()
  }, [assessmentId])

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}`)
      if (!response.ok) {
        throw new Error('Assessment not found')
      }
      const data = await response.json()
      setAssessment(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Assessment not found'}</p>
          <Link href="/portal">
            <Button>Back to Portal</Button>
          </Link>
        </div>
      </div>
    )
  }

  const flowId = assessment.versions?.[0]?.flows?.[0]?.id

  if (!flowId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-orange-600 mb-4">This assessment is not yet configured.</p>
          <p className="text-gray-600 mb-4">Please contact your healthcare provider.</p>
          <Link href="/portal">
            <Button>Back to Portal</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/portal">
            <Button variant="outline" className="mb-4">
              ← Back to Portal
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {assessment.title}
          </h1>
        </div>

        <FlowExecutor flowId={flowId} />
      </div>
    </div>
  )
}
