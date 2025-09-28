import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AssessmentBuilder } from '@/components/assessment-builder/AssessmentBuilder'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EditAssessmentPageProps {
  params: {
    id: string
  }
}

export default async function EditAssessmentPage({ params }: EditAssessmentPageProps) {
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

  // Get the assessment with its latest version and questions
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
        take: 1,
        include: {
          questions: {
            orderBy: {
              order: 'asc'
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
          <p>The assessment you're trying to edit doesn't exist.</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if user has permission to edit this assessment
  if (assessment.practiceId !== dbUser.practiceId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p>You don't have permission to edit this assessment.</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Assessment</h1>
              <p className="text-gray-600">Modify "{assessment.title}"</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <AssessmentBuilder 
          user={dbUser}
          mode="edit"
          existingAssessment={assessment}
        />
      </div>
    </div>
  )
}
