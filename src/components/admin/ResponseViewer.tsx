'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ResponseViewerProps {
  responseId: number
  onClose: () => void
}

interface StepResponse {
  id: number
  data: any
  createdAt: string
  step: {
    id: number
    type: string
    title?: string
    config: any
  }
}

interface DetailedResponse {
  id: number
  status: string
  startedAt: string
  completedAt?: string
  notes?: string
  reviewedBy?: string
  reviewedAt?: string
  patient: {
    id: number
    email: string
  }
  assessment: {
    id: number
    title: string
    description?: string
  }
  stepResponses: StepResponse[]
}

export function ResponseViewer({ responseId, onClose }: ResponseViewerProps) {
  const [response, setResponse] = useState<DetailedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchResponse()
  }, [responseId])

  const fetchResponse = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/responses/${responseId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch response')
      }
      const data = await res.json()
      setResponse(data)
      setNotes(data.notes || '')
      setStatus(data.status || 'DRAFT')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!response) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/responses/${responseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          reviewedBy: 'Provider', // In real app, this would be current user
          reviewedAt: new Date().toISOString()
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update response')
      }

      await fetchResponse()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const formatValue = (value: any, stepConfig: any) => {
    if (value === null || value === undefined) return 'No response'
    
    if (typeof value === 'object' && value.value !== undefined) {
      value = value.value
    }
    
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    
    if (stepConfig?.questionType === 'single_select' && stepConfig?.options) {
      const option = stepConfig.options.find((opt: any) => opt.value === value)
      return option ? option.label : value
    }
    
    return String(value)
  }

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'QUESTION': return 'bg-blue-100 text-blue-800'
      case 'INFORMATION': return 'bg-green-100 text-green-800'
      case 'CONSENT': return 'bg-purple-100 text-purple-800'
      case 'CHECKOUT': return 'bg-orange-100 text-orange-800'
      case 'PROVIDER_REVIEW': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'REVIEWED': return 'bg-blue-100 text-blue-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading response...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !response) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">Error: {error || 'Response not found'}</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                Response Review: {response.assessment.title}
              </CardTitle>
              <CardDescription className="mt-2">
                Patient: {response.patient.email} • 
                Started: {new Date(response.startedAt).toLocaleString()} •
                {response.completedAt && ` Completed: ${new Date(response.completedAt).toLocaleString()}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(response.status)}>
                {response.status}
              </Badge>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Response Data */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Patient Responses</h3>
            <div className="space-y-4">
              {response.stepResponses.map((stepResponse, index) => (
                <Card key={stepResponse.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStepTypeColor(stepResponse.step.type)}>
                            {stepResponse.step.type}
                          </Badge>
                          <span className="font-medium">
                            {stepResponse.step.title || `Step ${index + 1}`}
                          </span>
                        </div>
                        {stepResponse.step.config?.text && (
                          <p className="text-sm text-gray-600 mb-2">
                            {stepResponse.step.config.text}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(stepResponse.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <strong>Response:</strong>{' '}
                      <span className="text-blue-700 font-medium">
                        {formatValue(stepResponse.data, stepResponse.step.config)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Provider Review Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Provider Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Response Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Provider Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this response..."
                />
              </div>
            </div>

            {response.reviewedAt && (
              <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                Last reviewed by {response.reviewedBy} on {new Date(response.reviewedAt).toLocaleString()}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Review'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
