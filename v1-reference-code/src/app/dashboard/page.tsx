import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/SignOutButton'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get or create user in database
  let dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0]?.emailAddress },
    include: {
      practice: true,
      createdAssessments: {
        include: {
          responses: true,
          versions: {
            include: {
              questions: true
            }
          }
        }
      }
    }
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
          practice: true,
          createdAssessments: {
            include: {
              responses: true,
              versions: {
                include: {
                  questions: true
                }
              }
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
          <p>Unable to find or create your user profile. Please contact support.</p>
        </div>
      </div>
    )
  }

  const totalResponses = dbUser.createdAssessments.reduce(
    (acc, assessment) => acc + assessment.responses.length, 
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.firstName || 'Doctor'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {dbUser.practice?.name} • {dbUser.role}
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
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dbUser.createdAssessments.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Practice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{dbUser.practice?.name}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Assessment</CardTitle>
              <CardDescription>
                Build a new assessment for your patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/assessments/create">
                  <Button className="w-full">
                    Create Assessment
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Build custom patient assessments
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>View Patient Responses</CardTitle>
              <CardDescription>
                Review completed assessments from patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/responses">
                  <Button variant="outline" className="w-full">
                    View All Responses
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Review and analyze patient submissions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assessments</CardTitle>
            <CardDescription>
              Manage your created assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dbUser.createdAssessments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No assessments created yet</p>
                <Link href="/dashboard/assessments/create">
                  <Button>Create Your First Assessment</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {dbUser.createdAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{assessment.title}</h3>
                      <p className="text-sm text-gray-600">{assessment.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Status: {assessment.status}</span>
                        <span>{assessment.responses.length} responses</span>
                        <span>{assessment.versions.length} version(s)</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/assessments/${assessment.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <Link href={`/dashboard/assessments/${assessment.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
