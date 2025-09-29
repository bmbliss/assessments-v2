'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StepEditor } from './StepEditor'
import { VisualFlowEditor } from './VisualFlowEditor'

interface FlowStep {
  id: number
  type: string
  title?: string
  config: any
  position?: any
  outgoing: Array<{
    id: number
    toStep: {
      id: number
      title?: string
      type: string
    }
    condition: any
    order: number
  }>
  incoming: Array<{
    id: number
    fromStep: {
      id: number
      title?: string
      type: string
    }
  }>
}

interface FlowTransition {
  id: number
  fromStepId: number
  toStepId: number
  condition: any
  order: number
  fromStep: {
    id: number
    title?: string
    type: string
  }
  toStep: {
    id: number
    title?: string
    type: string
  }
}

interface FlowBuilderProps {
  flowId: number
  onFlowChange?: () => void
}

export function FlowBuilder({ flowId, onFlowChange }: FlowBuilderProps) {
  const [steps, setSteps] = useState<FlowStep[]>([])
  const [transitions, setTransitions] = useState<FlowTransition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null)

  useEffect(() => {
    fetchFlowData()
  }, [flowId])

  const fetchFlowData = async () => {
    try {
      setLoading(true)
      const [stepsResponse, transitionsResponse] = await Promise.all([
        fetch(`/api/admin/flows/${flowId}/steps`),
        fetch(`/api/admin/flows/${flowId}/transitions`)
      ])

      if (!stepsResponse.ok || !transitionsResponse.ok) {
        throw new Error('Failed to fetch flow data')
      }

      const stepsData = await stepsResponse.json()
      const transitionsData = await transitionsResponse.json()

      setSteps(stepsData)
      setTransitions(transitionsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStep = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/flows/${flowId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        throw new Error('Failed to create step')
      }

      await fetchFlowData()
      onFlowChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create step')
    }
  }

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm('Are you sure you want to delete this step? This will also delete all connected transitions.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/flows/${flowId}/steps/${stepId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete step')
      }

      await fetchFlowData()
      onFlowChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete step')
    }
  }

  const handleUpdateStep = async (stepId: number, updates: any) => {
    try {
      const response = await fetch(`/api/admin/flows/${flowId}/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update step')
      }

      await fetchFlowData()
      onFlowChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step')
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flow...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={fetchFlowData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visual">🎨 Visual Editor</TabsTrigger>
          <TabsTrigger value="list">📋 List View</TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <div className="space-y-6">
            {/* Step Creation */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Step</CardTitle>
                <CardDescription>
                  Choose a step type to add to your flow, then arrange visually below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['QUESTION', 'INFORMATION', 'CONSENT', 'CHECKOUT', 'PROVIDER_REVIEW'].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => handleCreateStep(type)}
                      className="capitalize"
                    >
                      Add {type.toLowerCase().replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual Flow Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Flow Design</CardTitle>
                <CardDescription>
                  Drag nodes to arrange • Double-click to edit • Drag between nodes to connect
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <VisualFlowEditor 
                  flowId={flowId}
                  onStepEdit={setEditingStep}
                  onFlowChange={() => {
                    // Don't do full refresh, just update list view if needed
                    // Visual editor handles its own state
                  }}
                  onStepCreate={(newStep) => {
                    // Add new step to steps list without full refresh
                    setSteps(current => [...current, newStep])
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list">
          {/* Step Creation */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Step</CardTitle>
              <CardDescription>
                Choose a step type to add to your flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['QUESTION', 'INFORMATION', 'CONSENT', 'CHECKOUT', 'PROVIDER_REVIEW'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => handleCreateStep(type)}
                    className="capitalize"
                  >
                    Add {type.toLowerCase().replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardContent>
            </Card>

            {/* Steps List */}
            <Card>
              <CardHeader>
                <CardTitle>Flow Steps ({steps.length})</CardTitle>
                <CardDescription>
                  Manage the steps in your assessment flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                {steps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No steps yet. Add your first step above to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step) => (
                      <div key={step.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getStepTypeColor(step.type)}>
                                {step.type}
                              </Badge>
                              <h3 className="font-medium">
                                {step.title || `Untitled ${step.type} Step`}
                              </h3>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>ID: {step.id}</p>
                              <p>Outgoing transitions: {step.outgoing.length}</p>
                              <p>Incoming transitions: {step.incoming.length}</p>
                            </div>

                            {step.outgoing.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Connects to:</p>
                                <div className="flex flex-wrap gap-1">
                                  {step.outgoing.map((transition) => (
                                    <Badge key={transition.id} variant="outline" className="text-xs">
                                      {transition.toStep.title || `Step ${transition.toStep.id}`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingStep(step)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteStep(step.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transitions Section */}
            {transitions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Flow Transitions ({transitions.length})</CardTitle>
                  <CardDescription>
                    Connections between steps in your flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transitions.map((transition) => (
                      <div key={transition.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">
                            {transition.fromStep.title || `Step ${transition.fromStep.id}`}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">
                            {transition.toStep.title || `Step ${transition.toStep.id}`}
                          </span>
                          {transition.condition && (
                            <Badge variant="outline" className="text-xs ml-2">
                              Conditional
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Step Editor Modal/Dialog */}
        {editingStep && (
          <StepEditor
            step={editingStep}
            onSave={async (updates: any) => {
              try {
                const response = await fetch(`/api/admin/flows/${flowId}/steps/${editingStep.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updates)
                })
                
                if (response.ok) {
                  const updatedStep = await response.json()
                  
                  // Update local state instead of full refresh
                  setSteps(current => 
                    current.map(step => 
                      step.id === editingStep.id ? updatedStep : step
                    )
                  )
                  
                  setEditingStep(null)
                } else {
                  throw new Error('Failed to update step')
                }
              } catch (error) {
                console.error('Error updating step:', error)
                alert('Failed to update step')
              }
            }}
            onCancel={() => setEditingStep(null)}
          />
        )}
      </div>
    )
  }
