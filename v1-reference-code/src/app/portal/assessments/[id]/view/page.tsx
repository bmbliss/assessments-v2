import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { ResponseDetail } from '@/components/dashboard/ResponseDetail'

interface ViewAssessmentPageProps {
  params: {
    id: string
  }
}

export default async function ViewAssessmentPage({ params }: ViewAssessmentPageProps) {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0]?.emailAddress }
  })

  if (!dbUser) {
    redirect('/portal')
  }

  const assessment = await db.assessment.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      practice: true,
      responses: {
        where: {
          patientId: dbUser.id,
          status: 'COMPLETED'
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: 1,
        include: {
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
      }
    }
  })

  if (!assessment || assessment.responses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Assessment Not Found</h1>
          <p>You haven't completed this assessment yet or it doesn't exist.</p>
          <Link href="/portal">
            <Button className="mt-4">Back to Portal</Button>
          </Link>
        </div>
      </div>
    )
  }

  const response = assessment.responses[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/portal">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Assessment</h1>
                <p className="text-gray-600">Review your submitted responses</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
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
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Practice:</span>
                  <span className="ml-2">{assessment.practice.name}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Completed:</span>
                  <span className="ml-2">
                    {response.completedAt ? new Date(response.completedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Questions:</span>
                  <span className="ml-2">{response.answers.length} answered</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient's Responses */}
          <ResponseDetail response={response} />

          {/* Provider Notes (if any) */}
          {response.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Provider Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 whitespace-pre-wrap">{response.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <Link href="/portal">
              <Button variant="outline">
                Back to Portal
              </Button>
            </Link>
            <Button variant="outline">
              Print Summary
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
