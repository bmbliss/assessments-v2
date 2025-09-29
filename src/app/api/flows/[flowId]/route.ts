import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

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
          orderBy: { order: 'asc' }
        },
        version: {
          include: {
            assessment: true
          }
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
