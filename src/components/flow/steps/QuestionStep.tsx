'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

interface QuestionStepProps {
  config: {
    questionType: string
    text: string
    options?: Array<{
      value: string
      label: string
      weight?: number
      score?: number
    }>
    validation?: {
      required?: boolean
      min?: number
      max?: number
      minSelections?: number
      customMessage?: string
    }
  }
  onChange: (value: any) => void
  value: any
}

export function QuestionStep({ config, onChange, value }: QuestionStepProps) {
  const [localValue, setLocalValue] = useState(value || '')
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    Array.isArray(value) ? value : []
  )

  useEffect(() => {
    if (config.questionType === 'multi_select') {
      onChange(selectedOptions)
    } else {
      onChange(localValue)
    }
  }, [localValue, selectedOptions, config.questionType, onChange])

  const handleSingleSelectChange = (newValue: string) => {
    setLocalValue(newValue)
  }

  const handleMultiSelectChange = (optionValue: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedOptions, optionValue]
    } else {
      newSelected = selectedOptions.filter(v => v !== optionValue)
    }
    setSelectedOptions(newSelected)
  }

  const renderInput = () => {
    switch (config.questionType) {
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor="number-input">{config.text}</Label>
            <Input
              id="number-input"
              type="number"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              min={config.validation?.min}
              max={config.validation?.max}
              placeholder="Enter a number"
            />
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="text-input">{config.text}</Label>
            <Input
              id="text-input"
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder="Enter your answer"
            />
          </div>
        )

      case 'single_select':
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">{config.text}</Label>
            <RadioGroup
              value={localValue}
              onValueChange={handleSingleSelectChange}
              className="space-y-3"
            >
              {config.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'multi_select':
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">{config.text}</Label>
            <div className="space-y-3">
              {config.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedOptions.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange(option.value, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={option.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              Question type "{config.questionType}" not yet implemented
            </p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {renderInput()}
      
      {config.validation?.customMessage && (
        <p className="text-sm text-muted-foreground">
          {config.validation.customMessage}
        </p>
      )}
    </div>
  )
}
