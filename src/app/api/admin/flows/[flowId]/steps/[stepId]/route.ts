import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// PUT /api/admin/flows/[flowId]/steps/[stepId] - Update step
export async function PUT(
  request: NextRequest,
  { params }: { params: { flowId: string; stepId: string } }
) {
  try {
    const stepId = parseInt(params.stepId)
    const body = await request.json()
    const { title, config, position } = body

    const step = await prisma.flowStep.update({
      where: { id: stepId },
      data: {
        ...(title !== undefined && { title }),
        ...(config !== undefined && { config }),
        ...(position !== undefined && { position })
      },
      include: {
        outgoing: {
          include: {
            toStep: {
              select: { id: true, title: true, type: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        incoming: {
          include: {
            fromStep: {
              select: { id: true, title: true, type: true }
            }
          }
        }
      }
    })

    return NextResponse.json(step)
  } catch (error) {
    console.error('Error updating step:', error)
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/flows/[flowId]/steps/[stepId] - Delete step
export async function DELETE(
  request: NextRequest,
  { params }: { params: { flowId: string; stepId: string } }
) {
  try {
    const stepId = parseInt(params.stepId)

    // Delete all transitions connected to this step first
    await prisma.flowTransition.deleteMany({
      where: {
        OR: [
          { fromStepId: stepId },
          { toStepId: stepId }
        ]
      }
    })

    // Delete the step
    await prisma.flowStep.delete({
      where: { id: stepId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting step:', error)
    return NextResponse.json(
      { error: 'Failed to delete step' },
      { status: 500 }
    )
  }
}
