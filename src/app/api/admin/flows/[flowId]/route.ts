import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// PUT /api/admin/flows/[flowId] - Update flow (like setting start step)
export async function PUT(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)
    const body = await request.json()
    const { startStepId } = body

    const flow = await prisma.assessmentFlow.update({
      where: { id: flowId },
      data: {
        ...(startStepId !== undefined && { startStepId })
      }
    })

    return NextResponse.json(flow)
  } catch (error) {
    console.error('Error updating flow:', error)
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    )
  }
}

// GET /api/admin/flows/[flowId] - Get flow details
export async function GET(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)

    const flow = await prisma.assessmentFlow.findUnique({
      where: { id: flowId },
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
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json(flow)
  } catch (error) {
    console.error('Error fetching flow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flow' },
      { status: 500 }
    )
  }
}
