import Link from 'next/link'
import { currentUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignOutButton } from '@/components/SignOutButton'
import { db } from '@/lib/db'

export default async function HomePage() {
  const user = await currentUser()
  
  // If user is signed in, check their role and redirect appropriately
  if (user) {
    const dbUser = await db.user.findUnique({
      where: { email: user.emailAddresses[0]?.emailAddress },
      include: { practice: true }
    })
    
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome back, {user.firstName}!
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Choose your portal to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl">Provider Dashboard</CardTitle>
              <CardDescription>
                Manage assessments, review patient responses, and track progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                {dbUser?.practice && (
                  <p className="text-sm text-gray-600 mb-2">
                    Practice: {dbUser.practice.name}
                  </p>
                )}
                {dbUser?.role && (
                  <p className="text-sm text-gray-600">
                    Role: {dbUser.role}
                  </p>
                )}
              </div>
              <Link href="/dashboard">
                <Button className="w-full" size="lg">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl">Patient Portal</CardTitle>
              <CardDescription>
                Complete assessments assigned by your healthcare provider.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Access your assessments and track your progress.
                </p>
              </div>
              <Link href="/portal">
                <Button variant="outline" className="w-full" size="lg">
                  Go to Portal
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <SignOutButton variant="ghost" size="sm" />
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Patient Assessment Platform
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          A comprehensive solution for healthcare providers to create, manage, and administer patient assessments for telehealth services.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl">For Healthcare Providers</CardTitle>
            <CardDescription>
              Create and manage patient assessments, review responses, and track patient progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Create custom assessments
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Use pre-built templates
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Review patient responses
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Version control for assessments
              </li>
            </ul>
            <Link href="/sign-in">
              <Button className="w-full" size="lg">
                Provider Login
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl">For Patients</CardTitle>
            <CardDescription>
              Complete assessments assigned by your healthcare provider at your own pace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">✓</span>
                Complete assessments online
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">✓</span>
                Save drafts and resume later
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">✓</span>
                Secure and private
              </li>
              <li className="flex items-center">
                <span className="text-blue-500 mr-2">✓</span>
                Mobile-friendly interface
              </li>
            </ul>
            <Link href="/portal">
              <Button variant="outline" className="w-full" size="lg">
                Patient Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-gray-500">
          Proof of Concept for Patient Assessment Platform
        </p>
      </div>
    </div>
  )
}
