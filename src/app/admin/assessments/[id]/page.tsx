'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FlowBuilder } from '@/components/admin/FlowBuilder'
import { ResponseViewer } from '@/components/admin/ResponseViewer'

interface Assessment {
  id: number
  title: string
  description?: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  finalMessage?: string
  creator: { id: number; email: string }
  practice: { id: number; name: string }
  versions: Array<{
    id: number
    versionNumber: number
    flows: Array<{
      id: number
      startStepId?: number
      steps: any[]
      transitions: any[]
    }>
  }>
  responses: Array<{
    id: number
    status: string
    startedAt: string
    completedAt?: string
    patient: { id: number; email: string }
  }>
}

interface AssessmentEditPageProps {
  params: { id: string }
}

export default function AssessmentEditPage({ params }: AssessmentEditPageProps) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    finalMessage: '',
    status: 'DRAFT'
  })
  const [publishing, setPublishing] = useState(false)
  const [viewingResponseId, setViewingResponseId] = useState<number | null>(null)

  useEffect(() => {
    fetchAssessment()
  }, [params.id])

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/admin/assessments/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch assessment')
      }
      const data = await response.json()
      setAssessment(data)
      setFormData({
        title: data.title,
        description: data.description || '',
        finalMessage: data.finalMessage || '',
        status: data.status
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/assessments/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update assessment')
      }

      const updatedAssessment = await response.json()
      setAssessment(updatedAssessment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePublish = async () => {
    if (!assessment) return
    
    setPublishing(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/assessments/${assessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' })
      })

      if (!response.ok) {
        throw new Error('Failed to publish assessment')
      }

      const updatedAssessment = await response.json()
      // Preserve existing data and only update the status
      setAssessment(prev => prev ? { ...prev, status: updatedAssessment.status } : updatedAssessment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!assessment) return
    
    setPublishing(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/assessments/${assessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' })
      })

      if (!response.ok) {
        throw new Error('Failed to unpublish assessment')
      }

      const updatedAssessment = await response.json()
      // Preserve existing data and only update the status
      setAssessment(prev => prev ? { ...prev, status: updatedAssessment.status } : updatedAssessment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPublishing(false)
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
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Assessment not found'}</p>
          <Button onClick={() => router.push('/admin')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  const currentFlow = assessment.versions[0]?.flows[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="text-gray-600 mt-2">{assessment.description || 'No description'}</p>
              <div className="flex items-center gap-4 mt-4">
                <Badge className={getStatusColor(assessment.status)}>
                  {assessment.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  {assessment.responses?.length || 0} responses
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
              >
                Back to Dashboard
              </Button>
              {currentFlow && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/portal/assessments/${assessment.id}`)}
                >
                  Preview Assessment
                </Button>
              )}
              {assessment.status === 'DRAFT' ? (
                <Button
                  onClick={handlePublish}
                  disabled={publishing || !currentFlow}
                  className="bg-green-600 hover:bg-green-700"
                  title={!currentFlow ? 'Add some steps to the flow before publishing' : 'Make this assessment available to patients'}
                >
                  {publishing ? 'Publishing...' : 'Publish Assessment'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleUnpublish}
                  disabled={publishing}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  title="Move assessment back to draft status"
                >
                  {publishing ? 'Unpublishing...' : 'Unpublish (Move to Draft)'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="flow" className="space-y-6">
          <TabsList>
            <TabsTrigger value="flow">Flow Builder</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="flow">
            {currentFlow ? (
              <FlowBuilder 
                flowId={currentFlow.id} 
                onFlowChange={fetchAssessment}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Flow Found</CardTitle>
                  <CardDescription>
                    This assessment doesn't have a flow yet. This shouldn't happen.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Settings</CardTitle>
                <CardDescription>
                  Configure basic assessment properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveBasicInfo} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Assessment Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="finalMessage">Final Message</Label>
                    <textarea
                      id="finalMessage"
                      name="finalMessage"
                      value={formData.finalMessage}
                      onChange={handleInputChange}
                      placeholder="Message shown when assessment is completed..."
                      className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Responses ({assessment.responses?.length || 0})</CardTitle>
                <CardDescription>
                  Review and manage patient responses to this assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessment.responses && assessment.responses.length > 0 ? (
                  <div className="space-y-4">
                    {assessment.responses.map((response) => (
                      <div key={response.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-medium">{response.patient.email}</p>
                              <Badge className={
                                response.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                response.status === 'REVIEWED' ? 'bg-blue-100 text-blue-800' :
                                response.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {response.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Started: {new Date(response.startedAt).toLocaleString()}</p>
                              {response.completedAt && (
                                <p>Completed: {new Date(response.completedAt).toLocaleString()}</p>
                              )}
                              <p className="text-xs text-gray-500">Response ID: {response.id}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingResponseId(response.id)}
                            >
                              Review Response
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">No responses yet</p>
                    <p className="text-sm mt-2">
                      Responses will appear here when patients complete this assessment.
                    </p>
                    {assessment.status === 'DRAFT' && (
                      <p className="text-sm mt-2 text-orange-600">
                        💡 Remember to publish this assessment to make it available to patients.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Response Viewer Modal */}
        {viewingResponseId && (
          <ResponseViewer
            responseId={viewingResponseId}
            onClose={() => {
              setViewingResponseId(null)
              fetchAssessment() // Refresh to show any status updates
            }}
          />
        )}
      </div>
    </div>
  )
}
