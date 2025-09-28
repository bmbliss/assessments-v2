'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssessmentData, QuestionData } from './AssessmentBuilder'
import { Eye, Smartphone, Monitor, Tablet } from 'lucide-react'

interface AssessmentPreviewProps {
  assessment: AssessmentData
  questions: QuestionData[]
}

export function AssessmentPreview({ assessment, questions }: AssessmentPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const getQuestionTypeDisplay = (question: QuestionData) => {
    switch (question.type) {
      case 'TEXT':
        return (
          <div className="space-y-2">
            <textarea 
              className="w-full p-2 border rounded resize-none" 
              rows={question.text.toLowerCase().includes('describe') ? 3 : 1}
              placeholder="Patient will type their answer here..."
              disabled
            />
          </div>
        )
      
      case 'NUMBER':
        return (
          <input 
            type="number" 
            className="w-full p-2 border rounded" 
            placeholder="0"
            disabled
          />
        )
      
      case 'DATE':
        return (
          <input 
            type="date" 
            className="w-full p-2 border rounded"
            disabled
          />
        )
      
      case 'SINGLE_SELECT':
        const singleOptions = question.options?.split(',').map(opt => opt.trim()) || []
        return singleOptions.length <= 4 ? (
          <div className="space-y-2">
            {singleOptions.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-2">
                <input type="radio" name={`question_${question.order}`} disabled />
                <span>{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <select className="w-full p-2 border rounded" disabled>
            <option>Select an option...</option>
            {singleOptions.map((option, idx) => (
              <option key={idx}>{option}</option>
            ))}
          </select>
        )
      
      case 'MULTI_SELECT':
        const multiOptions = question.options?.split(',').map(opt => opt.trim()) || []
        return (
          <div className="space-y-2">
            {multiOptions.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-2">
                <input type="checkbox" disabled />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )
      
      case 'SLIDER':
        const validation = question.validation || ''
        const min = validation.split(',').find(r => r.startsWith('min='))?.split('=')[1] || '0'
        const max = validation.split(',').find(r => r.startsWith('max='))?.split('=')[1] || '10'
        return (
          <div className="space-y-3">
            <input 
              type="range" 
              min={min} 
              max={max} 
              className="w-full"
              disabled
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{min}</span>
              <span>5</span>
              <span>{max}</span>
            </div>
          </div>
        )
      
      case 'FILE_UPLOAD':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-gray-500">Drop files here or click to browse</p>
          </div>
        )
      
      default:
        return <p className="text-gray-400 italic">Unsupported question type</p>
    }
  }

  const getValidationDisplay = (question: QuestionData) => {
    const validation = question.validation || ''
    const isRequired = validation.includes('required=true')
    
    if (!isRequired) return null
    
    return <span className="text-red-500 ml-1">*</span>
  }

  const containerClasses = {
    desktop: 'max-w-4xl',
    tablet: 'max-w-2xl',
    mobile: 'max-w-sm'
  }

  return (
    <div className="space-y-6">
      {/* View Mode Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Assessment Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium">View as:</span>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={viewMode === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('tablet')}
              >
                <Tablet className="w-4 h-4 mr-2" />
                Tablet
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              This preview shows how patients will see your assessment. Test the flow and make sure all questions are clear.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Preview */}
      <div className={`mx-auto ${containerClasses[viewMode]} bg-white border rounded-lg shadow-lg`}>
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
          <p className="text-gray-600 mb-4">{assessment.description}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Please answer all questions honestly and completely</li>
              <li>• Required questions are marked with a red asterisk (*)</li>
              <li>• You can save your progress and return later</li>
            </ul>
          </div>
        </div>

        {/* Questions */}
        <div className="p-6 space-y-8">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions added yet</p>
            </div>
          ) : (
            questions.map((question, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Question {index + 1}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">
                    {question.text}
                    {getValidationDisplay(question)}
                  </CardTitle>
                  
                  {/* Conditional Logic Indicator */}
                  {question.dependsOnQuestionId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                      <p className="text-xs text-yellow-800">
                        ℹ️ This question only appears when Question {question.dependsOnQuestionId} = "{question.conditionValue}"
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {getQuestionTypeDisplay(question)}
                  
                  {/* Show options for reference */}
                  {question.options && (
                    <p className="text-xs text-gray-500 mt-2">
                      Available options: {question.options}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Success Message Preview */}
        {questions.length > 0 && (
          <div className="border-t p-6">
            <h3 className="font-semibold mb-4">Completion Message:</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 whitespace-pre-wrap">
                {assessment.finalMessage || 'Thank you for completing this assessment.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Actions */}
      <div className="text-center">
        <Button variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          Open Full Preview in New Tab
        </Button>
      </div>
    </div>
  )
}
