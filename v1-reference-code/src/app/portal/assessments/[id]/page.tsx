import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AssessmentForm } from '@/components/assessment/AssessmentForm'

interface AssessmentPageProps {
  params: {
    id: string
  }
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
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
      id: parseInt(params.id),
      status: 'ACTIVE'
    },
    include: {
      practice: true,
      versions: {
        orderBy: {
          versionNumber: 'desc'
        },
        take: 1,
        include: {
          questions: {
            orderBy: {
              order: 'asc'
            },
            include: {
              dependsOn: true
            }
          }
        }
      }
    }
  })

  if (!assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Assessment Not Found</h1>
          <p>The assessment you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    )
  }

  // Check if assessment belongs to user's practice
  if (assessment.practiceId !== dbUser.practiceId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p>You don't have permission to access this assessment.</p>
        </div>
      </div>
    )
  }

  const latestVersion = assessment.versions[0]
  if (!latestVersion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Assessment Unavailable</h1>
          <p>This assessment doesn't have any questions configured yet.</p>
        </div>
      </div>
    )
  }

  // Check for existing response
  let existingResponse = await db.assessmentResponse.findFirst({
    where: {
      assessmentId: assessment.id,
      patientId: dbUser.id,
      versionId: latestVersion.id
    },
    include: {
      answers: true
    }
  })

  // If no existing response, create a new draft
  if (!existingResponse) {
    existingResponse = await db.assessmentResponse.create({
      data: {
        assessmentId: assessment.id,
        patientId: dbUser.id,
        versionId: latestVersion.id,
        status: 'DRAFT'
      },
      include: {
        answers: true
      }
    })
  }

  // If already completed, redirect to view page
  if (existingResponse.status === 'COMPLETED') {
    redirect(`/portal/assessments/${assessment.id}/view`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
            <div className="text-sm text-gray-500">
              {assessment.practice.name}
            </div>
          </div>
          
          {assessment.description && (
            <p className="text-gray-600 mb-4">{assessment.description}</p>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Please answer all questions honestly and completely</li>
              <li>• Your responses are automatically saved as you progress</li>
              <li>• You can return to complete this assessment later if needed</li>
              <li>• Required questions are marked with a red asterisk (*)</li>
            </ul>
          </div>
        </div>

        <AssessmentForm
          assessment={assessment}
          version={latestVersion}
          existingResponse={existingResponse}
          user={dbUser}
        />
      </div>
    </div>
  )
}
