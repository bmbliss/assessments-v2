'use client'

import { Question } from '@prisma/client'
import { Control, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseValidation } from '../utils/validation'

interface SingleSelectQuestionProps {
  question: Question
  control: Control<any>
  fieldName: string
}

export function SingleSelectQuestion({ question, control, fieldName }: SingleSelectQuestionProps) {
  const validation = parseValidation(question.validation)
  const options = question.options?.split(',').map(opt => opt.trim()) || []
  
  // Use radio buttons for <= 4 options, dropdown for more
  const useRadio = options.length <= 4

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
          required: validation.required ? 'Please select an option' : false
        }}
        render={({ field, fieldState: { error } }) => (
          <div>
            {useRadio ? (
              <RadioGroup 
                value={field.value || ''} 
                onValueChange={field.onChange}
                className="space-y-2"
              >
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${fieldName}_${index}`} />
                    <Label 
                      htmlFor={`${fieldName}_${index}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger className={error ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
