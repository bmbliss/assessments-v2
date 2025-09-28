import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Simple condition evaluator
function evaluateCondition(condition: any, responses: any[]): boolean {
  if (!condition || !condition.rules) return true

  const { rules, logic = 'AND' } = condition
  const results = rules.map((rule: any) => {
    const response = responses.find(r => r.stepId === rule.stepId)
    if (!response) return false

    const value = getValueFromPath(response.data, rule.path)
    
    switch (rule.operator) {
      case 'equals':
        return value === rule.value
      case 'greater_than':
        return Number(value) > Number(rule.value)
      case 'greater_than_or_equal':
        return Number(value) >= Number(rule.value)
      case 'less_than':
        return Number(value) < Number(rule.value)
      case 'less_than_or_equal':
        return Number(value) <= Number(rule.value)
      case 'in':
        return Array.isArray(rule.value) ? rule.value.includes(value) : false
      case 'contains':
        return Array.isArray(value) ? value.includes(rule.value) : false
      default:
        return false
    }
  })

  return logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

function getValueFromPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)
    const { assessmentResponseId, currentStepId, stepResponse } = await request.json()

    // Save the step response if provided
    if (stepResponse) {
      await prisma.stepResponse.create({
        data: {
          assessmentResponseId,
          stepId: currentStepId,
          data: stepResponse,
          completedAt: new Date()
        }
      })
    }

    // Get all responses for this assessment to evaluate conditions
    const allResponses = await prisma.stepResponse.findMany({
      where: { assessmentResponseId }
    })

    // Get possible transitions from current step
    const transitions = await prisma.flowTransition.findMany({
      where: {
        flowId,
        fromStepId: currentStepId
      },
      include: {
        toStep: true
      },
      orderBy: { order: 'asc' }
    })

    // Find the first transition that matches conditions
    let nextStep = null
    for (const transition of transitions) {
      if (evaluateCondition(transition.condition, allResponses)) {
        nextStep = transition.toStep
        break
      }
    }

    if (!nextStep) {
      // No more steps - assessment complete
      await prisma.assessmentResponse.update({
        where: { id: assessmentResponseId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      return NextResponse.json({
        completed: true,
        assessmentResponseId
      })
    }

    return NextResponse.json({
      currentStep: nextStep,
      assessmentResponseId
    })
  } catch (error) {
    console.error('Error getting next step:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
