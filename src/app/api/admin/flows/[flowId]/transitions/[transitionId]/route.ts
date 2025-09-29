import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// PUT /api/admin/flows/[flowId]/transitions/[transitionId] - Update transition
export async function PUT(
  request: NextRequest,
  { params }: { params: { flowId: string; transitionId: string } }
) {
  try {
    const transitionId = parseInt(params.transitionId)
    const body = await request.json()
    const { condition, order } = body

    const transition = await prisma.flowTransition.update({
      where: { id: transitionId },
      data: {
        ...(condition !== undefined && { condition }),
        ...(order !== undefined && { order })
      },
      include: {
        fromStep: {
          select: { id: true, title: true, type: true }
        },
        toStep: {
          select: { id: true, title: true, type: true }
        }
      }
    })

    return NextResponse.json(transition)
  } catch (error) {
    console.error('Error updating transition:', error)
    return NextResponse.json(
      { error: 'Failed to update transition' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/flows/[flowId]/transitions/[transitionId] - Delete transition
export async function DELETE(
  request: NextRequest,
  { params }: { params: { flowId: string; transitionId: string } }
) {
  try {
    const transitionId = parseInt(params.transitionId)

    await prisma.flowTransition.delete({
      where: { id: transitionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transition:', error)
    return NextResponse.json(
      { error: 'Failed to delete transition' },
      { status: 500 }
    )
  }
}
