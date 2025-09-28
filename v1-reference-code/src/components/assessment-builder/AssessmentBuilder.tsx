'use client'

import { useState } from 'react'
import { User, Assessment, Question } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssessmentBasicInfo } from './AssessmentBasicInfo'
import { QuestionsBuilder } from './QuestionsBuilder'
import { AssessmentPreview } from './AssessmentPreview'
import { PublishSettings } from './PublishSettings'
import { Save, Eye, Send, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface AssessmentData {
  id?: number
  title: string
  description: string
  finalMessage: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  isTemplate: boolean
}

export interface QuestionData {
  id?: number
  order: number
  text: string
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'SLIDER' | 'FILE_UPLOAD'
  options?: string
  validation?: string
  dependsOnQuestionId?: number | null
  conditionValue?: string
}

interface AssessmentBuilderProps {
  user: User & { practice: { name: string } | null }
  mode: 'create' | 'edit'
  existingAssessment?: Assessment & {
    versions: Array<{
      questions: Question[]
    }>
  }
}

export function AssessmentBuilder({ user, mode, existingAssessment }: AssessmentBuilderProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Initialize assessment data
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    id: existingAssessment?.id,
    title: existingAssessment?.title || '',
    description: existingAssessment?.description || '',
    finalMessage: existingAssessment?.finalMessage || 'Thank you for completing this assessment. Your healthcare provider will review your responses.',
    status: existingAssessment?.status || 'DRAFT',
    isTemplate: existingAssessment?.isTemplate || false
  })

  // Initialize questions data
  const [questions, setQuestions] = useState<QuestionData[]>(
    existingAssessment?.versions[0]?.questions?.map(q => ({
      id: q.id,
      order: q.order,
      text: q.text,
      type: q.type as QuestionData['type'],
      options: q.options || undefined,
      validation: q.validation || undefined,
      dependsOnQuestionId: q.dependsOnQuestionId || null,
      conditionValue: q.conditionValue || undefined
    })) || []
  )

  const canMoveToNext = (tab: string) => {
    switch (tab) {
      case 'basic':
        return assessmentData.title.trim().length > 0 && assessmentData.description.trim().length > 0
      case 'questions':
        return questions.length > 0 && questions.every(q => q.text.trim().length > 0)
      case 'preview':
        return true
      default:
        return true
    }
  }

  const saveAssessment = async (publish: boolean = false) => {
    setSaving(true)
    try {
      const payload = {
        assessment: {
          ...assessmentData,
          status: publish ? 'ACTIVE' : 'DRAFT'
        },
        questions,
        practiceId: user.practiceId,
        creatorId: user.id
      }

      const endpoint = mode === 'create' 
        ? '/api/assessments/create'
        : `/api/assessments/${existingAssessment?.id}/update`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save assessment')
      
      const result = await response.json()
      setLastSaved(new Date())
      
      if (publish) {
        router.push('/dashboard')
      } else if (mode === 'create' && result.assessmentId) {
        // Switch to edit mode after first save
        router.push(`/dashboard/assessments/${result.assessmentId}/edit`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save assessment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const nextTab = () => {
    const tabs = ['basic', 'questions', 'preview', 'publish']
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const prevTab = () => {
    const tabs = ['basic', 'questions', 'preview', 'publish']
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {mode === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="questions" disabled={!canMoveToNext('basic')}>
                    Questions
                  </TabsTrigger>
                  <TabsTrigger value="preview" disabled={!canMoveToNext('questions')}>
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="publish" disabled={!canMoveToNext('preview')}>
                    Publish
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-6">
                  <AssessmentBasicInfo
                    data={assessmentData}
                    onChange={setAssessmentData}
                    user={user}
                  />
                </TabsContent>

                <TabsContent value="questions" className="mt-6">
                  <QuestionsBuilder
                    questions={questions}
                    onChange={setQuestions}
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-6">
                  <AssessmentPreview
                    assessment={assessmentData}
                    questions={questions}
                  />
                </TabsContent>

                <TabsContent value="publish" className="mt-6">
                  <PublishSettings
                    assessment={assessmentData}
                    onChange={setAssessmentData}
                    onSave={() => saveAssessment(false)}
                    onPublish={() => saveAssessment(true)}
                    saving={saving}
                  />
                </TabsContent>
              </Tabs>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={prevTab}
                  disabled={activeTab === 'basic'}
                >
                  Previous
                </Button>

                <div className="flex items-center space-x-4">
                  {lastSaved && (
                    <span className="text-sm text-gray-500">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => saveAssessment(false)}
                    disabled={saving || !canMoveToNext('basic')}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                </div>

                <Button 
                  onClick={nextTab}
                  disabled={!canMoveToNext(activeTab) || activeTab === 'publish'}
                >
                  {activeTab === 'preview' ? 'Ready to Publish' : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`flex items-center ${canMoveToNext('basic') ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${canMoveToNext('basic') ? 'bg-green-600' : 'bg-gray-400'}`} />
                  Basic Information
                </div>
                <div className={`flex items-center ${canMoveToNext('questions') ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${canMoveToNext('questions') ? 'bg-green-600' : 'bg-gray-400'}`} />
                  Questions ({questions.length})
                </div>
                <div className={`flex items-center ${canMoveToNext('preview') ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${canMoveToNext('preview') ? 'bg-green-600' : 'bg-gray-400'}`} />
                  Preview & Test
                </div>
                <div className={`flex items-center ${assessmentData.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${assessmentData.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-400'}`} />
                  Published
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview Assessment
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
