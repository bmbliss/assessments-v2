'use client'

import { Question } from '@prisma/client'
import { Control, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { parseValidation } from '../utils/validation'

interface TextQuestionProps {
  question: Question
  control: Control<any>
  fieldName: string
}

export function TextQuestion({ question, control, fieldName }: TextQuestionProps) {
  const validation = parseValidation(question.validation)
  const isMultiline = question.text.toLowerCase().includes('describe') || 
                     question.text.toLowerCase().includes('explain') ||
                     question.text.toLowerCase().includes('details')

  return (
    <div className="space-y-3">
      <Label htmlFor={fieldName} className="text-sm font-medium">
        {question.text}
        {validation.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Controller
        name={fieldName}
        control={control}
        rules={{
          required: validation.required ? 'This field is required' : false,
          minLength: validation.minLength ? {
            value: validation.minLength,
            message: `Minimum length is ${validation.minLength} characters`
          } : undefined,
          maxLength: validation.maxLength ? {
            value: validation.maxLength,
            message: `Maximum length is ${validation.maxLength} characters`
          } : undefined
        }}
        render={({ field, fieldState: { error } }) => (
          <div>
            {isMultiline ? (
              <Textarea
                {...field}
                id={fieldName}
                placeholder="Enter your response..."
                className={error ? 'border-red-500' : ''}
                rows={4}
              />
            ) : (
              <Input
                {...field}
                id={fieldName}
                type="text"
                placeholder="Enter your response..."
                className={error ? 'border-red-500' : ''}
              />
            )}
            {error && (
              <p className="text-red-500 text-sm mt-1">{error.message}</p>
            )}
          </div>
        )}
      />
    </div>
  )
}
