import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/assessments/[id] - Get single assessment with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id)

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        creator: {
          select: { id: true, email: true }
        },
        practice: {
          select: { id: true, name: true }
        },
        versions: {
          include: {
            flows: {
              include: {
                steps: {
                  orderBy: { createdAt: 'asc' }
                },
                transitions: {
                  include: {
                    fromStep: {
                      select: { id: true, title: true, type: true }
                    },
                    toStep: {
                      select: { id: true, title: true, type: true }
                    }
                  },
                  orderBy: { order: 'asc' }
                }
              }
            }
          },
          orderBy: { versionNumber: 'desc' }
        },
        responses: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            patient: {
              select: { id: true, email: true }
            }
          },
          orderBy: { startedAt: 'desc' },
          take: 10 // Latest 10 responses
        }
      }
    })

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(assessment)
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/assessments/[id] - Update assessment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id)
    const body = await request.json()
    const { title, description, status, finalMessage } = body

    const assessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(finalMessage !== undefined && { finalMessage })
      },
      include: {
        versions: {
          include: {
            flows: {
              include: {
                steps: true,
                transitions: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(assessment)
  } catch (error) {
    console.error('Error updating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/assessments/[id] - Delete assessment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id)

    await prisma.assessment.delete({
      where: { id: assessmentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assessment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    )
  }
}
