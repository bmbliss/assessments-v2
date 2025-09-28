'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuestionData } from './AssessmentBuilder'
import { Save, X, Settings } from 'lucide-react'

interface QuestionEditorProps {
  question: QuestionData
  questionIndex: number
  allQuestions: QuestionData[]
  onChange: (question: QuestionData) => void
  onClose: () => void
}

export function QuestionEditor({ question, questionIndex, allQuestions, onChange, onClose }: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState<QuestionData>(question)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateField = (field: keyof QuestionData, value: any) => {
    setLocalQuestion(prev => ({ ...prev, [field]: value }))
  }

  const updateValidation = (field: string, value: any) => {
    const validation = localQuestion.validation || ''
    const rules = validation.split(',').filter(r => r.trim())
    
    // Remove existing rule for this field
    const filteredRules = rules.filter(rule => !rule.startsWith(`${field}=`))
    
    // Add new rule if value is provided
    if (value !== undefined && value !== null && value !== '') {
      filteredRules.push(`${field}=${value}`)
    }
    
    updateField('validation', filteredRules.join(','))
  }

  const getValidationValue = (field: string) => {
    const validation = localQuestion.validation || ''
    const rule = validation.split(',').find(r => r.startsWith(`${field}=`))
    return rule ? rule.split('=')[1] : ''
  }

  const isRequired = getValidationValue('required') === 'true'

  const saveQuestion = () => {
    if (!localQuestion.text.trim()) {
      alert('Question text is required')
      return
    }
    onChange(localQuestion)
    onClose()
  }

  const availableDependencies = allQuestions
    .slice(0, questionIndex) // Only previous questions
    .map((q, idx) => ({ order: idx + 1, text: q.text, type: q.type }))

  return (
    <div className="space-y-6 border-t pt-4">
      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor="questionText" className="text-sm font-medium">
          Question Text <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="questionText"
          placeholder="Enter your question..."
          value={localQuestion.text}
          onChange={(e) => updateField('text', e.target.value)}
          rows={2}
        />
      </div>

      {/* Question Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Question Type</Label>
        <Select value={localQuestion.type} onValueChange={(value) => updateField('type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Text Input</SelectItem>
            <SelectItem value="NUMBER">Number Input</SelectItem>
            <SelectItem value="DATE">Date Picker</SelectItem>
            <SelectItem value="SINGLE_SELECT">Single Choice (Radio/Dropdown)</SelectItem>
            <SelectItem value="MULTI_SELECT">Multiple Choice (Checkboxes)</SelectItem>
            <SelectItem value="SLIDER">Scale/Slider</SelectItem>
            <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Options for Select Questions */}
      {(localQuestion.type === 'SINGLE_SELECT' || localQuestion.type === 'MULTI_SELECT') && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Answer Options <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Enter options separated by commas (e.g., Yes, No, Maybe)"
            value={localQuestion.options || ''}
            onChange={(e) => updateField('options', e.target.value)}
            rows={3}
          />
          <p className="text-xs text-gray-500">
            Separate each option with a comma. Example: "Yes, No, Not sure"
          </p>
        </div>
      )}

      {/* Slider Configuration */}
      {localQuestion.type === 'SLIDER' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Min Value</Label>
            <Input
              type="number"
              placeholder="0"
              value={getValidationValue('min')}
              onChange={(e) => updateValidation('min', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Max Value</Label>
            <Input
              type="number"
              placeholder="10"
              value={getValidationValue('max')}
              onChange={(e) => updateValidation('max', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Step</Label>
            <Input
              type="number"
              placeholder="1"
              value={getValidationValue('step')}
              onChange={(e) => updateValidation('step', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Number Validation */}
      {localQuestion.type === 'NUMBER' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Min Value (optional)</Label>
            <Input
              type="number"
              placeholder="e.g., 0"
              value={getValidationValue('min')}
              onChange={(e) => updateValidation('min', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Max Value (optional)</Label>
            <Input
              type="number"
              placeholder="e.g., 100"
              value={getValidationValue('max')}
              onChange={(e) => updateValidation('max', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Required Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={isRequired}
          onCheckedChange={(checked) => updateValidation('required', checked ? 'true' : 'false')}
        />
        <Label htmlFor="required" className="text-sm">
          This question is required
        </Label>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              <CardTitle className="text-sm">Advanced Settings</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent className="space-y-4">
            {/* Conditional Logic */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Conditional Display</Label>
              <CardDescription>
                Only show this question if a previous question has a specific answer
              </CardDescription>
              
              {availableDependencies.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Depends on Question</Label>
                    <Select
                      value={localQuestion.dependsOnQuestionId?.toString() || 'none'}
                      onValueChange={(value) => updateField('dependsOnQuestionId', value === 'none' ? null : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No dependency</SelectItem>
                        {availableDependencies.map((dep) => (
                          <SelectItem key={dep.order} value={dep.order.toString()}>
                            Q{dep.order}: {dep.text.substring(0, 50)}{dep.text.length > 50 ? '...' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {localQuestion.dependsOnQuestionId && (
                    <div className="space-y-2">
                      <Label className="text-xs">When answer equals</Label>
                      <Input
                        placeholder="e.g., Yes"
                        value={localQuestion.conditionValue || ''}
                        onChange={(e) => updateField('conditionValue', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Add previous questions to enable conditional logic
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={saveQuestion}>
          <Save className="w-4 h-4 mr-2" />
          Save Question
        </Button>
      </div>
    </div>
  )
}
