import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignOutButton } from '@/components/SignOutButton'
import { ArrowLeft, Edit, Eye, Users, BarChart3, Copy } from 'lucide-react'
import { ClientDate } from '@/components/ui/ClientDate'
import Link from 'next/link'

interface AssessmentViewPageProps {
  params: {
    id: string
  }
}

export default async function AssessmentViewPage({ params }: AssessmentViewPageProps) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get or create user in database
  let dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0]?.emailAddress },
    include: { practice: true }
  })

  if (!dbUser) {
    const practice = await db.practice.findFirst()
    if (practice) {
      dbUser = await db.user.create({
        data: {
          email: user.emailAddresses[0]?.emailAddress || '',
          role: 'DOCTOR',
          practiceId: practice.id
        },
        include: {
          practice: true
        }
      })
    }
  }

  if (!dbUser || (dbUser.role !== 'DOCTOR' && dbUser.role !== 'PA' && dbUser.role !== 'ADMIN')) {
    redirect('/portal')
  }

  // Get the assessment with its data
  const assessment = await db.assessment.findUnique({
    where: { 
      id: parseInt(params.id)
    },
    include: {
      practice: true,
      creator: true,
      versions: {
        orderBy: {
          versionNumber: 'desc'
        },
        include: {
          questions: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      },
      responses: {
        include: {
          patient: true
        }
      }
    }
  })

  if (!assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Assessment Not Found</h1>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if user has permission to view this assessment
  if (assessment.practiceId !== dbUser.practiceId) {
    redirect('/dashboard')
  }

  const latestVersion = assessment.versions[0]
  const totalResponses = assessment.responses.length
  const completedResponses = assessment.responses.filter(r => r.status === 'COMPLETED').length
  const draftResponses = assessment.responses.filter(r => r.status === 'DRAFT').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'ARCHIVED':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assessment Details</h1>
                <p className="text-gray-600">Manage and monitor your assessment</p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assessment Overview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{assessment.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {assessment.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(assessment.status)}
                    {assessment.isTemplate && (
                      <Badge variant="outline">Template</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Created by:</p>
                    <p>{assessment.creator.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Practice:</p>
                    <p>{assessment.practice.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Questions:</p>
                    <p>{latestVersion?.questions.length || 0} questions</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Current Version:</p>
                    <p>Version {latestVersion?.versionNumber || 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Questions ({latestVersion?.questions.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {!latestVersion?.questions || latestVersion.questions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No questions added yet</p>
                ) : (
                  <div className="space-y-3">
                    {latestVersion.questions.map((question, index) => (
                      <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              Q{index + 1}
                            </span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              {question.type.replace('_', ' ')}
                            </span>
                            {question.validation?.includes('required=true') && (
                              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="font-medium">{question.text}</p>
                          {question.dependsOnQuestionId && (
                            <p className="text-sm text-blue-600">
                              Conditional: Shows when Q{question.dependsOnQuestionId} = "{question.conditionValue}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Success Message */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 whitespace-pre-wrap">
                    {assessment.finalMessage || 'Thank you for completing this assessment.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/dashboard/assessments/${assessment.id}/edit`}>
                  <Button className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Assessment
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
              </CardContent>
            </Card>

            {/* Response Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{totalResponses}</p>
                    <p className="text-sm text-blue-800">Total Responses</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{completedResponses}</p>
                      <p className="text-xs text-green-800">Completed</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="text-lg font-bold text-yellow-600">{draftResponses}</p>
                      <p className="text-xs text-yellow-800">In Progress</p>
                    </div>
                  </div>
                </div>
                
                <Link href="/dashboard/responses">
                  <Button variant="outline" className="w-full" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View All Responses
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Assessment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Assessment ID:</span>
                  <p>{assessment.id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Total Versions:</span>
                  <p>{assessment.versions.length}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Last Updated:</span>
                  <p><ClientDate date={latestVersion?.createdAt || new Date()} format="date" /></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
