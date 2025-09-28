'use client'

import { Question } from '@prisma/client'
import { Control, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { parseValidation } from '../utils/validation'

interface SliderQuestionProps {
  question: Question
  control: Control<any>
  fieldName: string
}

export function SliderQuestion({ question, control, fieldName }: SliderQuestionProps) {
  const validation = parseValidation(question.validation)
  const min = validation.min ?? 0
  const max = validation.max ?? 10
  const step = validation.step ?? 1

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
          required: validation.required ? 'Please select a value' : false
        }}
        render={({ field, fieldState: { error } }) => {
          const value = field.value ? [Number(field.value)] : [min]
          
          return (
            <div>
              <div className="space-y-4">
                <Slider
                  value={value}
                  onValueChange={(newValue) => field.onChange(newValue[0])}
                  min={min}
                  max={max}
                  step={step}
                  className="w-full"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{min}</span>
                  <div className="bg-gray-100 px-3 py-1 rounded-md">
                    <span className="text-sm font-medium">
                      {value[0]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{max}</span>
                </div>
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
