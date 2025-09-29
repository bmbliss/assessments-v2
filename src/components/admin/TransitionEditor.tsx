'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TransitionEditorProps {
  flowId: number
  transition?: any
  onSave: (transitionData: any) => void
  onCancel: () => void
  availableSteps: any[]
}

interface ConditionRule {
  stepId: number
  path: string
  operator: string
  value: any
}

export function TransitionEditor({ 
  flowId, 
  transition, 
  onSave, 
  onCancel, 
  availableSteps 
}: TransitionEditorProps) {
  const [fromStepId, setFromStepId] = useState<number>(transition?.fromStepId || 0)
  const [toStepId, setToStepId] = useState<number>(transition?.toStepId || 0)
  const [order, setOrder] = useState<number>(transition?.order || 0)
  const [hasCondition, setHasCondition] = useState<boolean>(!!transition?.condition)
  const [conditionRules, setConditionRules] = useState<ConditionRule[]>([])

  useEffect(() => {
    if (transition?.condition?.rules) {
      setConditionRules(transition.condition.rules)
    } else if (hasCondition) {
      // Initialize with one empty rule
      setConditionRules([{
        stepId: 0,
        path: 'value',
        operator: 'equals',
        value: ''
      }])
    }
  }, [transition, hasCondition])

  const handleSave = async () => {
    const transitionData = {
      fromStepId,
      toStepId,
      order,
      condition: hasCondition ? {
        logic: 'AND',
        rules: conditionRules.filter(rule => rule.stepId && rule.value !== '')
      } : null
    }

    try {
      let response
      if (transition?.id) {
        // Update existing transition
        response = await fetch(`/api/admin/flows/${flowId}/transitions/${transition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transitionData)
        })
      } else {
        // Create new transition
        response = await fetch(`/api/admin/flows/${flowId}/transitions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transitionData)
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save transition')
      }

      const savedTransition = await response.json()
      onSave(savedTransition)
    } catch (error) {
      console.error('Error saving transition:', error)
      alert('Failed to save transition')
    }
  }

  const addRule = () => {
    setConditionRules([
      ...conditionRules,
      {
        stepId: 0,
        path: 'value',
        operator: 'equals',
        value: ''
      }
    ])
  }

  const updateRule = (index: number, field: keyof ConditionRule, value: any) => {
    const updatedRules = [...conditionRules]
    updatedRules[index] = { ...updatedRules[index], [field]: value }
    setConditionRules(updatedRules)
  }

  const removeRule = (index: number) => {
    setConditionRules(conditionRules.filter((_, i) => i !== index))
  }

  const questionSteps = availableSteps.filter(step => step.type === 'QUESTION')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {transition ? 'Edit Transition' : 'Create Transition'}
          </CardTitle>
          <CardDescription>
            Configure how users move between steps in your flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Basic Transition Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromStep">From Step</Label>
              <Select value={fromStepId.toString()} onValueChange={(value) => setFromStepId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source step" />
                </SelectTrigger>
                <SelectContent>
                  {availableSteps.map((step) => (
                    <SelectItem key={step.id} value={step.id.toString()}>
                      {step.title || `${step.type} Step ${step.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="toStep">To Step</Label>
              <Select value={toStepId.toString()} onValueChange={(value) => setToStepId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination step" />
                </SelectTrigger>
                <SelectContent>
                  {availableSteps.map((step) => (
                    <SelectItem key={step.id} value={step.id.toString()}>
                      {step.title || `${step.type} Step ${step.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="order">Order (priority)</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Conditional Logic Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Conditional Logic</h3>
                <p className="text-sm text-gray-600">
                  Add conditions that must be met for this transition to occur
                </p>
              </div>
              <Button
                variant={hasCondition ? "default" : "outline"}
                onClick={() => setHasCondition(!hasCondition)}
              >
                {hasCondition ? "Remove Conditions" : "Add Conditions"}
              </Button>
            </div>

            {hasCondition && (
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Condition Rules</h4>
                  <Button variant="outline" size="sm" onClick={addRule}>
                    Add Rule
                  </Button>
                </div>

                {conditionRules.map((rule, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <div>
                      <Label>Question Step</Label>
                      <Select
                        value={rule.stepId.toString()}
                        onValueChange={(value) => updateRule(index, 'stepId', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionSteps.map((step) => (
                            <SelectItem key={step.id} value={step.id.toString()}>
                              {step.title || `Question ${step.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Operator</Label>
                      <Select
                        value={rule.operator}
                        onValueChange={(value) => updateRule(index, 'operator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                          <SelectItem value="greater_than_or_equal">Greater Than or Equal</SelectItem>
                          <SelectItem value="less_than_or_equal">Less Than or Equal</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="not_contains">Does Not Contain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Value</Label>
                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(index, 'value', e.target.value)}
                        placeholder="Expected value"
                      />
                    </div>

                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRule(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {conditionRules.length > 1 && (
                  <div className="text-sm text-gray-600">
                    <Badge variant="outline">ALL rules must be true (AND logic)</Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          {hasCondition && conditionRules.some(rule => rule.stepId && rule.value) && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="text-sm text-gray-700">
                This transition will occur when:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {conditionRules
                    .filter(rule => rule.stepId && rule.value)
                    .map((rule, index) => {
                      const step = questionSteps.find(s => s.id === rule.stepId)
                      return (
                        <li key={index}>
                          {step?.title || `Question ${rule.stepId}`} {rule.operator.replace('_', ' ')} "{rule.value}"
                        </li>
                      )
                    })}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!fromStepId || !toStepId}
            >
              {transition ? 'Update Transition' : 'Create Transition'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
