'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Assessment {
  id: number
  title: string
  description?: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  creator: {
    id: number
    email: string
  }
  practice: {
    id: number
    name: string
  }
  versions: Array<{
    id: number
    versionNumber: number
    createdAt: string
  }>
  _count: {
    responses: number
  }
}

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/admin/assessments')
      if (!response.ok) {
        throw new Error('Failed to fetch assessments')
      }
      const data = await response.json()
      setAssessments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchAssessments}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Admin</h1>
            <p className="text-gray-600 mt-2">Create and manage assessment flows</p>
          </div>
          <Link href="/admin/assessments/create">
            <Button>Create New Assessment</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{assessment.title}</CardTitle>
                  <Badge className={getStatusColor(assessment.status)}>
                    {assessment.status}
                  </Badge>
                </div>
                <CardDescription>
                  {assessment.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>Practice: {assessment.practice.name}</div>
                  <div>Creator: {assessment.creator.email}</div>
                  <div>Versions: {assessment.versions.length}</div>
                  <div>Responses: {assessment._count.responses}</div>
                  <div>Updated: {new Date(assessment.updatedAt).toLocaleDateString()}</div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/assessments/${assessment.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Edit Flow
                    </Button>
                  </Link>
                  <Link href={`/portal/assessments/${assessment.id}`}>
                    <Button variant="secondary">
                      Preview
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {assessments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first assessment flow</p>
            <Link href="/admin/assessments/create">
              <Button>Create Assessment</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
