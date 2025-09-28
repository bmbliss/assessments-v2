'use client'

import { Question, QuestionType } from '@prisma/client'
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { TextQuestion } from './question-types/TextQuestion'
import { NumberQuestion } from './question-types/NumberQuestion'
import { DateQuestion } from './question-types/DateQuestion'
import { SingleSelectQuestion } from './question-types/SingleSelectQuestion'
import { MultiSelectQuestion } from './question-types/MultiSelectQuestion'
import { SliderQuestion } from './question-types/SliderQuestion'
import { FileUploadQuestion } from './question-types/FileUploadQuestion'

interface QuestionRendererProps {
  question: Question
  control: Control<any>
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
  isVisible?: boolean
}

export function QuestionRenderer({ 
  question, 
  control, 
  setValue, 
  watch, 
  isVisible = true 
}: QuestionRendererProps) {
  if (!isVisible) {
    return null
  }

  const fieldName = `question_${question.id}`

  const commonProps = {
    question,
    control,
    setValue,
    watch,
    fieldName
  }

  switch (question.type) {
    case QuestionType.TEXT:
      return <TextQuestion {...commonProps} />
    
    case QuestionType.NUMBER:
      return <NumberQuestion {...commonProps} />
    
    case QuestionType.DATE:
      return <DateQuestion {...commonProps} />
    
    case QuestionType.SINGLE_SELECT:
      return <SingleSelectQuestion {...commonProps} />
    
    case QuestionType.MULTI_SELECT:
      return <MultiSelectQuestion {...commonProps} />
    
    case QuestionType.SLIDER:
      return <SliderQuestion {...commonProps} />
    
    case QuestionType.FILE_UPLOAD:
      return <FileUploadQuestion {...commonProps} />
    
    default:
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Unsupported question type: {question.type}</p>
        </div>
      )
  }
}
