'use client'

import { AssessmentResponse, Answer, Question, User, Assessment } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientDate } from '@/components/ui/ClientDate'
import { Calendar, FileText, Link as LinkIcon } from 'lucide-react'

interface ResponseDetailProps {
  response: AssessmentResponse & {
    patient: User
    assessment: Assessment & {
      practice: { name: string }
      creator: User
    }
    answers: (Answer & {
      question: Question
    })[]
  }
}

export function ResponseDetail({ response }: ResponseDetailProps) {
  const renderAnswerValue = (answer: Answer & { question: Question }) => {
    const { question, value, fileUrl } = answer

    // Handle different question types
    switch (question.type) {
      case 'FILE_UPLOAD':
        if (fileUrl) {
          return (
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View uploaded file
              </a>
            </div>
          )
        }
        return <span className="text-gray-500 italic">No file uploaded</span>

      case 'MULTI_SELECT':
        if (value) {
          try {
            const selectedValues = JSON.parse(value)
            if (Array.isArray(selectedValues) && selectedValues.length > 0) {
              return (
                <div className="flex flex-wrap gap-1">
                  {selectedValues.map((val, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {val}
                    </Badge>
                  ))}
                </div>
              )
            }
          } catch {
            // If parsing fails, treat as single value
            return <span>{value}</span>
          }
        }
        return <span className="text-gray-500 italic">No selections made</span>

      case 'SLIDER':
        const options = question.options?.split(',') || []
        const min = options.find(opt => opt.includes('min='))?.split('=')[1] || '0'
        const max = options.find(opt => opt.includes('max='))?.split('=')[1] || '10'
        
        return (
          <div className="flex items-center space-x-2">
            <span className="font-medium text-lg">{value}</span>
            <span className="text-gray-500 text-sm">
              (on a scale of {min} to {max})
            </span>
          </div>
        )

      case 'DATE':
        if (value) {
          return <ClientDate date={new Date(value)} format="date" />
        }
        return <span className="text-gray-500 italic">No date selected</span>

      case 'NUMBER':
        return <span className="font-medium">{value}</span>

      case 'TEXT':
      case 'SINGLE_SELECT':
      default:
        return value ? (
          <span>{value}</span>
        ) : (
          <span className="text-gray-500 italic">No response</span>
        )
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'TEXT': 'Text',
      'NUMBER': 'Number',
      'DATE': 'Date',
      'SINGLE_SELECT': 'Single Choice',
      'MULTI_SELECT': 'Multiple Choice',
      'SLIDER': 'Scale',
      'FILE_UPLOAD': 'File Upload'
    }
    return typeLabels[type] || type
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Patient Responses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {response.answers.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No responses yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              The patient hasn't answered any questions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {response.answers.map((answer, index) => (
              <div key={answer.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        Question {index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getQuestionTypeLabel(answer.question.type)}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      {answer.question.text}
                    </h4>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 ml-4">
                    <Calendar className="w-3 h-3 mr-1" />
                    <ClientDate date={new Date(answer.answeredAt)} format="date" />
                  </div>
                </div>

                {/* Show answer options for select questions */}
                {(answer.question.type === 'SINGLE_SELECT' || answer.question.type === 'MULTI_SELECT') && 
                 answer.question.options && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">
                      Available options: {answer.question.options}
                    </span>
                  </div>
                )}

                {/* Show validation rules if present */}
                {answer.question.validation && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">
                      Validation: {answer.question.validation}
                    </span>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Patient's response:</span>
                    <div className="mt-2">
                      {renderAnswerValue(answer)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
