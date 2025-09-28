import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface SuccessPageProps {
  params: {
    id: string
  }
}

export default async function SuccessPage({ params }: SuccessPageProps) {
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
    where: { 
      id: parseInt(params.id)
    },
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
          answers: true
        }
      }
    }
  })

  if (!assessment || assessment.responses.length === 0) {
    redirect('/portal')
  }

  const response = assessment.responses[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assessment Complete!
          </h1>
          <p className="text-gray-600">
            Thank you for completing your assessment. Your responses have been submitted successfully.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Assessment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Assessment Title</p>
                <p className="text-lg">{assessment.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Practice</p>
                <p>{assessment.practice.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                <p>{response.answers.length} questions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Completion Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Started</p>
                <p className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(response.startedAt).toLocaleString()}</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{response.completedAt ? new Date(response.completedAt).toLocaleString() : 'N/A'}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Success Message */}
        {assessment.finalMessage && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Message from your provider:</h3>
                <p className="text-blue-800">{assessment.finalMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Your responses are being reviewed</p>
                  <p className="text-sm text-gray-600">
                    Your healthcare provider will review your assessment responses and may contact you with next steps.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Keep an eye on your communication channels</p>
                  <p className="text-sm text-gray-600">
                    You may receive follow-up information via email, phone, or through this patient portal.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Additional assessments</p>
                  <p className="text-sm text-gray-600">
                    Check your patient portal regularly for any additional assessments that may be assigned.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/portal">
            <Button size="lg" className="w-full sm:w-auto">
              Return to Patient Portal
            </Button>
          </Link>
          <Link href={`/portal/assessments/${assessment.id}/view`}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View Your Responses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
