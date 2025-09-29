import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET /api/admin/flows/[flowId]/transitions - Get all transitions for a flow
export async function GET(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)

    const transitions = await prisma.flowTransition.findMany({
      where: { flowId },
      include: {
        fromStep: {
          select: { id: true, title: true, type: true }
        },
        toStep: {
          select: { id: true, title: true, type: true }
        }
      },
      orderBy: [{ fromStepId: 'asc' }, { order: 'asc' }]
    })

    return NextResponse.json(transitions)
  } catch (error) {
    console.error('Error fetching flow transitions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flow transitions' },
      { status: 500 }
    )
  }
}

// POST /api/admin/flows/[flowId]/transitions - Create new transition
export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)
    const body = await request.json()
    const { fromStepId, toStepId, condition, order } = body

    if (!fromStepId || !toStepId) {
      return NextResponse.json(
        { error: 'fromStepId and toStepId are required' },
        { status: 400 }
      )
    }

    // Get the current max order for transitions from this step
    const maxOrder = await prisma.flowTransition.aggregate({
      where: { flowId, fromStepId },
      _max: { order: true }
    })

    const transition = await prisma.flowTransition.create({
      data: {
        flowId,
        fromStepId,
        toStepId,
        condition: condition || null,
        order: order !== undefined ? order : (maxOrder._max.order || 0) + 1
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

    return NextResponse.json(transition, { status: 201 })
  } catch (error) {
    console.error('Error creating transition:', error)
    return NextResponse.json(
      { error: 'Failed to create transition' },
      { status: 500 }
    )
  }
}
