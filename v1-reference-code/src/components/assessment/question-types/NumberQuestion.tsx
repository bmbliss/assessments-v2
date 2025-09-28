'use client'

import { Question } from '@prisma/client'
import { Control, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { parseValidation } from '../utils/validation'

interface NumberQuestionProps {
  question: Question
  control: Control<any>
  fieldName: string
}

export function NumberQuestion({ question, control, fieldName }: NumberQuestionProps) {
  const validation = parseValidation(question.validation)

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
          min: validation.min !== undefined ? {
            value: validation.min,
            message: `Minimum value is ${validation.min}`
          } : undefined,
          max: validation.max !== undefined ? {
            value: validation.max,
            message: `Maximum value is ${validation.max}`
          } : undefined,
          validate: (value) => {
            if (value && isNaN(Number(value))) {
              return 'Please enter a valid number'
            }
            return true
          }
        }}
        render={({ field, fieldState: { error } }) => (
          <div>
            <Input
              {...field}
              id={fieldName}
              type="number"
              placeholder="Enter a number..."
              className={error ? 'border-red-500' : ''}
              min={validation.min}
              max={validation.max}
              step={validation.step || 'any'}
            />
            {(validation.min !== undefined || validation.max !== undefined) && (
              <p className="text-xs text-gray-500 mt-1">
                {validation.min !== undefined && validation.max !== undefined
                  ? `Range: ${validation.min} - ${validation.max}`
                  : validation.min !== undefined
                  ? `Minimum: ${validation.min}`
                  : `Maximum: ${validation.max}`
                }
              </p>
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
