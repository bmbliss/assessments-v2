import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/SignOutButton'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function PatientPortalPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get or create patient user in database
  let dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0]?.emailAddress },
    include: {
      practice: true,
      patientResponses: {
        include: {
          assessment: true
        }
      }
    }
  })

  // If user doesn't exist in our database, create them as a patient
  if (!dbUser) {
    const practice = await db.practice.findFirst()
    if (practice) {
      dbUser = await db.user.create({
        data: {
          email: user.emailAddresses[0]?.emailAddress || '',
          role: 'PATIENT',
          practiceId: practice.id
        },
        include: {
          practice: true,
          patientResponses: {
            include: {
              assessment: true
            }
          }
        }
      })
    }
  }

  if (!dbUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Setup Required</h1>
          <p>Unable to find or create your patient profile. Please contact support.</p>
        </div>
      </div>
    )
  }

  // Get available assessments for this practice
  const availableAssessments = await db.assessment.findMany({
    where: {
      practiceId: dbUser.practiceId || undefined,
      status: 'ACTIVE'
    },
    include: {
      responses: {
        where: {
          patientId: dbUser.id
        }
      },
      versions: {
        orderBy: {
          versionNumber: 'desc'
        },
        take: 1,
        include: {
          questions: true
        }
      }
    }
  })

  const completedResponses = dbUser.patientResponses.filter(r => r.status === 'COMPLETED')
  const draftResponses = dbUser.patientResponses.filter(r => r.status === 'DRAFT')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
              <p className="text-gray-600">Welcome, {user.firstName || 'Patient'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {dbUser.practice?.name}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Available Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableAssessments.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedResponses.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{draftResponses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Available Assessments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Assessments</CardTitle>
            <CardDescription>
              Complete these assessments assigned by your healthcare provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableAssessments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No assessments available at this time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableAssessments.map((assessment) => {
                  const hasResponse = assessment.responses.length > 0
                  const response = assessment.responses[0]
                  const isCompleted = response?.status === 'COMPLETED'
                  const isDraft = response?.status === 'DRAFT'
                  
                  return (
                    <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{assessment.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{assessment.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-500">
                            {assessment.versions[0]?.questions?.length || 0} questions
                          </span>
                          {isCompleted && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Completed
                            </span>
                          )}
                          {isDraft && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {isCompleted ? (
                          <Link href={`/portal/assessments/${assessment.id}/view`}>
                            <Button variant="outline" size="sm">View Results</Button>
                          </Link>
                        ) : (
                          <Link href={`/portal/assessments/${assessment.id}`}>
                            <Button size="sm">
                              {isDraft ? 'Continue' : 'Start Assessment'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {dbUser.patientResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Assessment History</CardTitle>
              <CardDescription>
                Review your completed and in-progress assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dbUser.patientResponses.map((response) => (
                  <div key={response.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{response.assessment.title}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Status: {response.status}</span>
                        <span>
                          Started: {new Date(response.startedAt).toLocaleDateString()}
                        </span>
                        {response.completedAt && (
                          <span>
                            Completed: {new Date(response.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {response.status === 'COMPLETED' ? (
                        <Link href={`/portal/assessments/${response.assessmentId}/view`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      ) : (
                        <Link href={`/portal/assessments/${response.assessmentId}`}>
                          <Button variant="outline" size="sm">Continue</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
