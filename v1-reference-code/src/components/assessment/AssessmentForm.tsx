'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Assessment, Version, Question, AssessmentResponse, Answer, User } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuestionRenderer } from './QuestionRenderer'
import { Progress } from '@/components/ui/progress'
import { Save, Send, ArrowLeft, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AssessmentFormProps {
  assessment: Assessment & {
    practice: { name: string }
    versions: Version[]
  }
  version: Version & {
    questions: (Question & { dependsOn: Question | null })[]
  }
  existingResponse: AssessmentResponse & {
    answers: Answer[]
  }
  user: User
}

export function AssessmentForm({ 
  assessment, 
  version, 
  existingResponse, 
  user 
}: AssessmentFormProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const questionsPerPage = 3 // Show 3 questions per page

  // Initialize form with existing answers
  const defaultValues = useMemo(() => {
    const values: Record<string, any> = {}
    existingResponse.answers.forEach(answer => {
      const fieldName = `question_${answer.questionId}`
      if (answer.value) {
        // Handle multi-select values (stored as JSON strings)
        try {
          const parsed = JSON.parse(answer.value)
          values[fieldName] = Array.isArray(parsed) ? parsed : answer.value
        } catch {
          values[fieldName] = answer.value
        }
      } else if (answer.fileUrl) {
        values[fieldName] = answer.fileUrl
      }
    })
    return values
  }, [existingResponse.answers])

  const form = useForm({
    defaultValues,
    mode: 'onChange'
  })

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form
  const watchedValues = watch()

  // Calculate visible questions based on conditional logic
  const visibleQuestions = useMemo(() => {
    return version.questions.filter(question => {
      if (!question.dependsOnQuestionId || !question.conditionValue) {
        return true // Always show questions without dependencies
      }

      const dependsOnFieldName = `question_${question.dependsOnQuestionId}`
      const dependentValue = watchedValues[dependsOnFieldName]
      
      if (!dependentValue) return false

      // Simple condition matching
      if (Array.isArray(dependentValue)) {
        // Multi-select: check if any selected value matches the condition
        return dependentValue.includes(question.conditionValue)
      } else {
        // Single value: direct comparison
        return String(dependentValue) === question.conditionValue
      }
    })
  }, [version.questions, watchedValues])

  // Pagination
  const totalPages = Math.ceil(visibleQuestions.length / questionsPerPage)
  const currentQuestions = visibleQuestions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  )

  // Progress calculation
  const answeredQuestions = visibleQuestions.filter(q => {
    const fieldName = `question_${q.id}`
    const value = watchedValues[fieldName]
    return value !== undefined && value !== '' && value !== null
  }).length
  const progress = Math.round((answeredQuestions / visibleQuestions.length) * 100)

  // Auto-save functionality
  const saveAnswers = async (isSubmit: boolean = false) => {
    setSaving(true)
    try {
      const answers = Object.entries(watchedValues).map(([fieldName, value]) => {
        const questionId = parseInt(fieldName.replace('question_', ''))
        return {
          questionId,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value || ''),
          fileUrl: typeof value === 'string' && value.startsWith('http') ? value : null
        }
      }).filter(answer => answer.value || answer.fileUrl)

      const response = await fetch('/api/assessments/save-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: existingResponse.id,
          answers,
          isSubmit
        })
      })

      if (!response.ok) throw new Error('Failed to save')
      
      setLastSaved(new Date())
      
      if (isSubmit) {
        router.push(`/portal/assessments/${assessment.id}/success`)
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save your progress. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(watchedValues).length > 0) {
        saveAnswers(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [watchedValues])

  // Validation for current page
  const currentPageErrors = currentQuestions.some(q => {
    const fieldName = `question_${q.id}`
    return errors[fieldName]
  })

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const canProceed = !currentPageErrors
  const isLastPage = currentPage === totalPages - 1
  const isFirstPage = currentPage === 0

  return (
    <form onSubmit={handleSubmit(() => saveAnswers(true))} className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{answeredQuestions} of {visibleQuestions.length} questions answered</span>
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {currentQuestions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                Question {visibleQuestions.indexOf(question) + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionRenderer
                question={question}
                control={control}
                setValue={setValue}
                watch={watch}
                isVisible={true}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!isFirstPage && (
            <Button
              type="button"
              variant="outline"
              onClick={prevPage}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          Page {currentPage + 1} of {totalPages}
        </div>

        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => saveAnswers(false)}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          {!isLastPage ? (
            <Button
              type="button"
              onClick={nextPage}
              disabled={!canProceed}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!canProceed || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Back to Portal */}
      <div className="text-center pt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/portal')}
        >
          Back to Portal
        </Button>
      </div>
    </form>
  )
}
