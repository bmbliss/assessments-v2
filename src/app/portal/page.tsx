'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Assessment {
  id: number
  title: string
  description?: string
  status: string
}

export default function PortalPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPublishedAssessments()
  }, [])

  const fetchPublishedAssessments = async () => {
    try {
      const response = await fetch('/api/admin/assessments')
      if (!response.ok) {
        throw new Error('Failed to fetch assessments')
      }
      const allAssessments = await response.json()
      // Filter to only show ACTIVE (published) assessments
      const publishedAssessments = allAssessments.filter((assessment: Assessment) => 
        assessment.status === 'ACTIVE'
      )
      setAssessments(publishedAssessments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Patient Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete your health assessments and manage your care
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Assessments</CardTitle>
              <CardDescription>
                Complete these assessments to help your healthcare provider understand your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading assessments...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Error: {error}</p>
                  <Button onClick={fetchPublishedAssessments} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">No assessments available</p>
                  <p className="text-sm text-gray-500">
                    Check back later or contact your healthcare provider
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{assessment.title}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          Available
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {assessment.description || 'Complete this assessment to help your healthcare provider'}
                      </p>
                      <Link href={`/portal/assessments/${assessment.id}`}>
                        <Button>Start Assessment</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/">
              <Button variant="outline">← Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
