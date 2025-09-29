import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET /api/admin/assessments - List all assessments
export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        creator: {
          select: { id: true, email: true }
        },
        practice: {
          select: { id: true, name: true }
        },
        versions: {
          select: { id: true, versionNumber: true, createdAt: true },
          orderBy: { versionNumber: 'desc' }
        },
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(assessments)
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

// POST /api/admin/assessments - Create new assessment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, practiceId, creatorId } = body

    if (!title || !practiceId || !creatorId) {
      return NextResponse.json(
        { error: 'Title, practiceId, and creatorId are required' },
        { status: 400 }
      )
    }

    // Create assessment with initial version and flow
    const assessment = await prisma.assessment.create({
      data: {
        title,
        description,
        practiceId,
        creatorId,
        status: 'DRAFT'
      }
    })

    // Create initial version
    const version = await prisma.version.create({
      data: {
        versionNumber: 1,
        assessmentId: assessment.id
      }
    })

    // Create initial flow
    const flow = await prisma.assessmentFlow.create({
      data: {
        versionId: version.id
      }
    })

    // Return assessment with version and flow
    const fullAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: {
        versions: {
          include: {
            flows: true
          }
        }
      }
    })

    return NextResponse.json(fullAssessment, { status: 201 })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}
