import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Patient Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete your health assessments and manage your care
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Assessments</CardTitle>
              <CardDescription>
                Complete these assessments to help your healthcare provider understand your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">TRT Assessment</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Testosterone Replacement Therapy evaluation with personalized recommendations
                  </p>
                  <Link href="/portal/assessments/1">
                    <Button>Start Assessment</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/">
              <Button variant="outline">← Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
