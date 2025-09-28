import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Telehealth Assessments V2
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced flow-based patient assessment platform with conditional branching and multiple step types
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Provider Dashboard</CardTitle>
              <CardDescription>
                Create and manage assessment flows, review patient responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full">Access Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Portal</CardTitle>
              <CardDescription>
                Take assessments and view your health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/portal">
                <Button variant="outline" className="w-full">Enter Portal</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Sample Assessment</h2>
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>TRT Assessment</CardTitle>
              <CardDescription>
                Testosterone Replacement Therapy evaluation with conditional flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/portal/assessments/1">
                <Button variant="secondary" className="w-full">Try Demo Assessment</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
