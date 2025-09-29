import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/flows/[flowId]/steps - Get all steps for a flow
export async function GET(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)

    const steps = await prisma.flowStep.findMany({
      where: { flowId },
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
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(steps)
  } catch (error) {
    console.error('Error fetching flow steps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flow steps' },
      { status: 500 }
    )
  }
}

// POST /api/admin/flows/[flowId]/steps - Create new step
export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)
    const body = await request.json()
    const { type, title, config, position } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Step type is required' },
        { status: 400 }
      )
    }

    const step = await prisma.flowStep.create({
      data: {
        flowId,
        type,
        title: title || `New ${type} Step`,
        config: config || {},
        position: position || { x: 0, y: 0 }
      },
      include: {
        outgoing: {
          include: {
            toStep: {
              select: { id: true, title: true, type: true }
            }
          }
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

    return NextResponse.json(step, { status: 201 })
  } catch (error) {
    console.error('Error creating step:', error)
    return NextResponse.json(
      { error: 'Failed to create step' },
      { status: 500 }
    )
  }
}
