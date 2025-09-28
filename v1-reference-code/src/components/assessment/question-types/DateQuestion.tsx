'use client'

import { Question } from '@prisma/client'
import { Control, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { parseValidation } from '../utils/validation'

interface DateQuestionProps {
  question: Question
  control: Control<any>
  fieldName: string
}

export function DateQuestion({ question, control, fieldName }: DateQuestionProps) {
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
          required: validation.required ? 'Please select a date' : false
        }}
        render={({ field, fieldState: { error } }) => (
          <div>
            <Input
              {...field}
              id={fieldName}
              type="date"
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error.message}</p>
            )}
          </div>
        )}
      />
    </div>
  )
}
