'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuestionEditor } from './QuestionEditor'
import { QuestionData } from './AssessmentBuilder'
import { Plus, GripVertical, Trash2 } from 'lucide-react'

interface QuestionsBuilderProps {
  questions: QuestionData[]
  onChange: (questions: QuestionData[]) => void
}

export function QuestionsBuilder({ questions, onChange }: QuestionsBuilderProps) {
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null)

  const addQuestion = () => {
    const newQuestion: QuestionData = {
      order: questions.length + 1,
      text: '',
      type: 'TEXT',
      validation: 'required=true'
    }
    onChange([...questions, newQuestion])
    setEditingQuestion(questions.length)
  }

  const updateQuestion = (index: number, updatedQuestion: QuestionData) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...updatedQuestion, order: index + 1 }
    onChange(newQuestions)
  }

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index)
    // Reorder questions
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i + 1 }))
    onChange(reorderedQuestions)
    setEditingQuestion(null)
  }

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions]
    const [movedQuestion] = newQuestions.splice(fromIndex, 1)
    newQuestions.splice(toIndex, 0, movedQuestion)
    
    // Reorder questions
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i + 1 }))
    onChange(reorderedQuestions)
  }

  const getQuestionTypeName = (type: QuestionData['type']) => {
    const typeNames = {
      'TEXT': 'Text',
      'NUMBER': 'Number',
      'DATE': 'Date',
      'SINGLE_SELECT': 'Single Choice',
      'MULTI_SELECT': 'Multiple Choice',
      'SLIDER': 'Scale/Slider',
      'FILE_UPLOAD': 'File Upload'
    }
    return typeNames[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Assessment Questions</h3>
          <p className="text-sm text-gray-600">
            Add and configure questions for your assessment. Drag to reorder.
          </p>
        </div>
        <Button onClick={addQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your assessment by adding your first question.
            </p>
            <Button onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {/* Drag Handle */}
                    <button className="mt-1 text-gray-400 hover:text-gray-600 cursor-move">
                      <GripVertical className="w-4 h-4" />
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          Question {index + 1}
                        </span>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          {getQuestionTypeName(question.type)}
                        </span>
                        {question.validation?.includes('required=true') && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      
                      {editingQuestion === index ? (
                        <QuestionEditor
                          question={question}
                          questionIndex={index}
                          allQuestions={questions}
                          onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                          onClose={() => setEditingQuestion(null)}
                        />
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900 mb-1">
                            {question.text || <span className="text-gray-400 italic">Question text not set</span>}
                          </p>
                          
                          {/* Show options for select questions */}
                          {(question.type === 'SINGLE_SELECT' || question.type === 'MULTI_SELECT') && question.options && (
                            <p className="text-sm text-gray-600">
                              Options: {question.options}
                            </p>
                          )}
                          
                          {/* Show conditional logic */}
                          {question.dependsOnQuestionId && (
                            <p className="text-sm text-blue-600">
                              Conditional: Shows when Question {question.dependsOnQuestionId} = "{question.conditionValue}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {editingQuestion !== index && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingQuestion(index)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {questions.length > 0 && (
        <div className="flex justify-center">
          <Button onClick={addQuestion} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Question
          </Button>
        </div>
      )}
    </div>
  )
}
