import { FlowExecutor } from '@/components/flow/FlowExecutor'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AssessmentPageProps {
  params: {
    id: string
  }
}

export default function AssessmentPage({ params }: AssessmentPageProps) {
  const assessmentId = parseInt(params.id)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/portal">
            <Button variant="outline" className="mb-4">
              ← Back to Portal
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Assessment Flow
          </h1>
        </div>

        <FlowExecutor flowId={1} />
      </div>
    </div>
  )
}
