import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET /api/admin/responses/[responseId] - Get detailed response with all step responses
export async function GET(
  request: NextRequest,
  { params }: { params: { responseId: string } }
) {
  try {
    const responseId = parseInt(params.responseId)

    const response = await prisma.assessmentResponse.findUnique({
      where: { id: responseId },
      include: {
        patient: {
          select: { id: true, email: true }
        },
        assessment: {
          select: { id: true, title: true, description: true }
        },
        stepResponses: {
          include: {
            step: {
              select: { 
                id: true, 
                type: true, 
                title: true, 
                config: true 
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching response:', error)
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/responses/[responseId] - Update response status or add notes
export async function PUT(
  request: NextRequest,
  { params }: { params: { responseId: string } }
) {
  try {
    const responseId = parseInt(params.responseId)
    const body = await request.json()
    const { status, notes, reviewedBy, reviewedAt } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (reviewedBy !== undefined) updateData.reviewedBy = reviewedBy
    if (reviewedAt !== undefined) updateData.reviewedAt = reviewedAt

    const response = await prisma.assessmentResponse.update({
      where: { id: responseId },
      data: updateData,
      include: {
        patient: {
          select: { id: true, email: true }
        },
        assessment: {
          select: { id: true, title: true, description: true }
        }
      }
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating response:', error)
    return NextResponse.json(
      { error: 'Failed to update response' },
      { status: 500 }
    )
  }
}
