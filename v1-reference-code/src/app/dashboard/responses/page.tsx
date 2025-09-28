import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignOutButton } from '@/components/SignOutButton'
import { FileText, Filter, Download } from 'lucide-react'
import Link from 'next/link'
import { ResponseFilters } from '@/components/dashboard/ResponseFilters'
import { ResponsesList } from '@/components/dashboard/ResponsesList'

interface ResponsesPageProps {
  searchParams: {
    status?: string
    assessment?: string
    patient?: string
    date?: string
  }
}

export default async function ResponsesPage({ searchParams }: ResponsesPageProps) {
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

  // Build filter conditions
  const whereClause: any = {
    assessment: {
      practiceId: dbUser.practiceId
    }
  }

  if (searchParams.status) {
    whereClause.status = searchParams.status
  }

  if (searchParams.assessment) {
    whereClause.assessmentId = parseInt(searchParams.assessment)
  }

  if (searchParams.patient) {
    whereClause.patient = {
      email: {
        contains: searchParams.patient,
        mode: 'insensitive'
      }
    }
  }

  if (searchParams.date) {
    const selectedDate = new Date(searchParams.date)
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    
    whereClause.startedAt = {
      gte: selectedDate,
      lt: nextDay
    }
  }

  // Get responses with related data
  const responses = await db.assessmentResponse.findMany({
    where: whereClause,
    include: {
      patient: true,
      assessment: {
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
            include: {
              questions: true
            }
          }
        }
      },
      answers: true
    },
    orderBy: {
      completedAt: 'desc'
    }
  })

  // Get assessments for filter dropdown
  const assessments = await db.assessment.findMany({
    where: {
      practiceId: dbUser.practiceId,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      title: true
    }
  })

  // Calculate stats
  const totalResponses = responses.length
  const completedResponses = responses.filter(r => r.status === 'COMPLETED').length
  const draftResponses = responses.filter(r => r.status === 'DRAFT').length
  const todayResponses = responses.filter(r => {
    const today = new Date()
    const responseDate = new Date(r.startedAt)
    return responseDate.toDateString() === today.toDateString()
  }).length


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Responses</h1>
              <p className="text-gray-600">Review and manage assessment responses</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
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
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedResponses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{draftResponses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayResponses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponseFilters 
              assessments={assessments}
              currentFilters={searchParams}
            />
          </CardContent>
        </Card>

        {/* Responses List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Assessment Responses</CardTitle>
                <CardDescription>
                  {responses.length === 0 
                    ? 'No responses found with current filters' 
                    : `Showing ${responses.length} response${responses.length !== 1 ? 's' : ''}`
                  }
                </CardDescription>
              </div>
              {responses.length > 0 && (
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsesList responses={responses} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
