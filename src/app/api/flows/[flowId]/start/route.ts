import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)
    const { patientId } = await request.json()

    // Get the flow with its version and assessment
    const flow = await prisma.assessmentFlow.findUnique({
      where: { id: flowId },
      include: {
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

    // Create a new assessment response
    const assessmentResponse = await prisma.assessmentResponse.create({
      data: {
        patientId: patientId || 1, // Default to patient ID 1 for demo
        assessmentId: flow.version.assessment.id,
        versionId: flow.versionId,
        metadata: {
          flowId: flow.id,
          startedAt: new Date().toISOString()
        }
      }
    })

    // Get the starting step
    const startStep = await prisma.flowStep.findUnique({
      where: { id: flow.startStepId! }
    })

    return NextResponse.json({
      assessmentResponseId: assessmentResponse.id,
      currentStep: startStep,
      flowId: flow.id
    })
  } catch (error) {
    console.error('Error starting flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
