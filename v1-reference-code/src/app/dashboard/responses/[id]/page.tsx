import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignOutButton } from '@/components/SignOutButton'
import { ProviderNotes } from '@/components/dashboard/ProviderNotes'
import { ResponseDetail } from '@/components/dashboard/ResponseDetail'
import { ArrowLeft, Calendar, Clock, User, FileText, Download, Edit } from 'lucide-react'
import { ClientDate } from '@/components/ui/ClientDate'
import Link from 'next/link'

interface ResponseDetailPageProps {
  params: {
    id: string
  }
}

export default async function ResponseDetailPage({ params }: ResponseDetailPageProps) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get or create user in database
  let dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0]?.emailAddress },
    include: { practice: true }
  })

  // If user doesn't exist in our database, create them
  if (!dbUser) {
    // For now, create as DOCTOR - in production, you'd have a proper role assignment flow
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

  const response = await db.assessmentResponse.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      patient: true,
      assessment: {
        include: {
          practice: true,
          creator: true
        }
      },
      answers: {
        include: {
          question: true
        },
        orderBy: {
          question: {
            order: 'asc'
          }
        }
      }
    }
  })

  if (!response) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Response Not Found</h1>
          <p>The response you're looking for doesn't exist.</p>
          <Link href="/dashboard/responses">
            <Button className="mt-4">Back to Responses</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if response belongs to user's practice
  if (response.assessment.practiceId !== dbUser.practiceId) {
    redirect('/dashboard/responses')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'DRAFT':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">In Progress</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDuration = () => {
    if (!response.completedAt) return 'In progress'
    const duration = response.completedAt.getTime() - response.startedAt.getTime()
    const minutes = Math.floor(duration / (1000 * 60))
    if (minutes < 1) return 'Less than 1 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/responses">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Responses
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assessment Response</h1>
                <p className="text-gray-600">Detailed view and analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{response.assessment.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {response.assessment.description}
                    </CardDescription>
                  </div>
                  {getStatusBadge(response.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Patient:</span>
                      <span className="ml-2">{response.patient.email}</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Questions:</span>
                      <span className="ml-2">{response.answers.length} answered</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Started:</span>
                      <span className="ml-2">
                        <ClientDate date={new Date(response.startedAt)} format="datetime" />
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{formatDuration()}</span>
                    </div>
                  </div>
                </div>
                {response.completedAt && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Completed:</span>
                      <span className="ml-2">
                        <ClientDate date={new Date(response.completedAt)} format="datetime" />
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Responses */}
            <ResponseDetail response={response} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Response
                </Button>
                <Button className="w-full" variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  View Patient Profile
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  View Assessment Details
                </Button>
              </CardContent>
            </Card>

            {/* Provider Notes */}
            <ProviderNotes 
              responseId={response.id} 
              initialNotes={response.notes} 
              providerId={dbUser.id}
            />

            {/* Assessment Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Practice:</span>
                  <p>{response.assessment.practice.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Created by:</span>
                  <p>{response.assessment.creator.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Assessment ID:</span>
                  <p>{response.assessment.id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Response ID:</span>
                  <p>{response.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
