'use client'

import { Question } from '@prisma/client'
import { Control, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { parseValidation } from '../utils/validation'

interface MultiSelectQuestionProps {
  question: Question
  control: Control<any>
  fieldName: string
}

export function MultiSelectQuestion({ question, control, fieldName }: MultiSelectQuestionProps) {
  const validation = parseValidation(question.validation)
  const options = question.options?.split(',').map(opt => opt.trim()) || []

  return (
    <div className="space-y-3">
      <Label htmlFor={fieldName} className="text-sm font-medium">
        {question.text}
        {validation.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <p className="text-xs text-gray-500">Select all that apply</p>
      
      <Controller
        name={fieldName}
        control={control}
        rules={{
          required: validation.required ? 'Please select at least one option' : false
        }}
        render={({ field, fieldState: { error } }) => {
          const selectedValues = field.value || []
          
          const handleChange = (option: string, checked: boolean) => {
            let newValues = [...selectedValues]
            if (checked) {
              if (!newValues.includes(option)) {
                newValues.push(option)
              }
            } else {
              newValues = newValues.filter(v => v !== option)
            }
            field.onChange(newValues)
          }

          return (
            <div>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${fieldName}_${index}`}
                      checked={selectedValues.includes(option)}
                      onCheckedChange={(checked) => handleChange(option, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`${fieldName}_${index}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-1">{error.message}</p>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}
