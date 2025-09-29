'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StepEditorProps {
  step: {
    id: number
    type: string
    title?: string
    config: any
  }
  onSave: (updates: any) => void
  onCancel: () => void
}

export function StepEditor({ step, onSave, onCancel }: StepEditorProps) {
  const [formData, setFormData] = useState({
    title: step.title || '',
    config: step.config || {}
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'title') {
      setFormData(prev => ({ ...prev, title: value }))
    } else {
      setFormData(prev => ({
        ...prev,
        config: { ...prev.config, [name]: value }
      }))
    }
  }

  const handleSave = () => {
    onSave({
      title: formData.title,
      config: formData.config
    })
  }

  const renderConfigFields = () => {
    switch (step.type) {
      case 'QUESTION':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <select
                id="questionType"
                name="questionType"
                value={formData.config.questionType || 'single_select'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, questionType: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="text">Text Input</option>
                <option value="number">Number Input</option>
                <option value="single_select">Single Select (Radio)</option>
                <option value="multi_select">Multi Select (Checkbox)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Question Text</Label>
              <textarea
                id="text"
                name="text"
                value={formData.config.text || ''}
                onChange={handleInputChange}
                placeholder="Enter your question here..."
                className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>

            {(formData.config.questionType === 'single_select' || formData.config.questionType === 'multi_select') && (
              <div className="space-y-2">
                <Label htmlFor="options">Options (JSON format)</Label>
                <textarea
                  id="options"
                  name="options"
                  value={JSON.stringify(formData.config.options || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const options = JSON.parse(e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config, options }
                      }))
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  placeholder='[{"value": "option1", "label": "Option 1"}, {"value": "option2", "label": "Option 2"}]'
                  className="w-full min-h-32 px-3 py-2 border border-input rounded-md bg-background text-sm font-mono"
                />
                <p className="text-xs text-gray-500">
                  Format: [{"{"}"value": "key", "label": "Display Text"{"}"}]
                </p>
              </div>
            )}
          </div>
        )

      case 'INFORMATION':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                name="content"
                value={formData.config.content || ''}
                onChange={handleInputChange}
                placeholder="Enter the information content (markdown supported)..."
                className="w-full min-h-48 px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="continueButton">Continue Button Text</Label>
              <Input
                id="continueButton"
                name="continueButton"
                value={formData.config.continueButton || 'Continue'}
                onChange={handleInputChange}
                placeholder="Continue"
              />
            </div>
          </div>
        )

      case 'CONSENT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Consent Content</Label>
              <textarea
                id="content"
                name="content"
                value={formData.config.content || ''}
                onChange={handleInputChange}
                placeholder="Enter consent form content..."
                className="w-full min-h-48 px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agreementText">Agreement Text</Label>
              <Input
                id="agreementText"
                name="agreementText"
                value={formData.config.agreementText || 'I agree to the terms above'}
                onChange={handleInputChange}
                placeholder="I agree to the terms above"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="configJson">Configuration (JSON)</Label>
              <textarea
                id="configJson"
                value={JSON.stringify(formData.config, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, config }))
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full min-h-32 px-3 py-2 border border-input rounded-md bg-background text-sm font-mono"
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader>
          <CardTitle>Edit {step.type} Step</CardTitle>
          <CardDescription>
            Configure this step's properties and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Step Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={`${step.type} Step`}
            />
          </div>

          {renderConfigFields()}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
