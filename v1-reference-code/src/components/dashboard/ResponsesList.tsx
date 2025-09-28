'use client'

import { AssessmentResponse, User, Assessment, Answer } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClientDate } from '@/components/ui/ClientDate'
import { Eye, Calendar, User as UserIcon, FileText } from 'lucide-react'
import Link from 'next/link'

interface ResponsesListProps {
  responses: (AssessmentResponse & {
    patient: User
    assessment: Assessment & {
      versions: any[]
    }
    answers: Answer[]
  })[]
}

export function ResponsesList({ responses }: ResponsesListProps) {
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

  const formatDuration = (started: Date, completed: Date | null) => {
    if (!completed) return 'In progress'
    const duration = completed.getTime() - started.getTime()
    const minutes = Math.floor(duration / (1000 * 60))
    if (minutes < 1) return 'Less than 1 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No responses found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Patients haven't completed any assessments yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <div key={response.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h3 className="font-semibold text-lg">{response.assessment.title}</h3>
                {getStatusBadge(response.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span>{response.patient.email}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Started: <ClientDate date={new Date(response.startedAt)} format="date" /></span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {response.completedAt 
                      ? <>Completed: <ClientDate date={new Date(response.completedAt)} format="date" /></>
                      : 'In progress'
                    }
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                <span>{response.answers.length} answers • </span>
                <span>Duration: {formatDuration(new Date(response.startedAt), response.completedAt ? new Date(response.completedAt) : null)}</span>
                {response.notes && (
                  <span> • Has provider notes</span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Link href={`/dashboard/responses/${response.id}`}>
                <Button size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
