import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Simple condition evaluator
function evaluateCondition(condition: any, responses: any[]): boolean {
  if (!condition || !condition.rules) return true

  const { rules, logic = 'AND' } = condition
  const results = rules.map((rule: any) => {
    const response = responses.find(r => r.stepId === rule.stepId)
    if (!response) {
      console.log(`No response found for stepId ${rule.stepId}`)
      console.log(`Available responses:`, responses.map(r => ({ stepId: r.stepId, data: r.data })))
      return false
    }

    const value = getValueFromPath(response.data, rule.path)
    console.log(`Evaluating rule: stepId=${rule.stepId}, path=${rule.path}, value=${JSON.stringify(value)}, expected=${JSON.stringify(rule.value)}, operator=${rule.operator}`)
    console.log(`Response data structure:`, JSON.stringify(response.data, null, 2))
    
    switch (rule.operator) {
      case 'equals':
        const equalsResult = value === rule.value
        console.log(`  equals result: ${equalsResult}`)
        return equalsResult
      case 'greater_than':
        const gtResult = Number(value) > Number(rule.value)
        console.log(`  greater_than result: ${Number(value)} > ${Number(rule.value)} = ${gtResult}`)
        return gtResult
      case 'greater_than_or_equal':
        const gteResult = Number(value) >= Number(rule.value)
        console.log(`  greater_than_or_equal result: ${Number(value)} >= ${Number(rule.value)} = ${gteResult}`)
        return gteResult
      case 'less_than':
        const ltResult = Number(value) < Number(rule.value)
        console.log(`  less_than result: ${ltResult}`)
        return ltResult
      case 'less_than_or_equal':
        const lteResult = Number(value) <= Number(rule.value)
        console.log(`  less_than_or_equal result: ${lteResult}`)
        return lteResult
      case 'in':
        const inResult = Array.isArray(rule.value) ? rule.value.includes(value) : false
        console.log(`  in result: ${inResult}`)
        return inResult
      case 'contains':
        const containsResult = Array.isArray(value) ? value.includes(rule.value) : false
        console.log(`  contains result: ${containsResult}`)
        return containsResult
      default:
        console.log(`  unknown operator: ${rule.operator}`)
        return false
    }
  })

  const finalResult = logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
  console.log(`Final condition result (${logic}): ${finalResult}`)
  return finalResult
}

function getValueFromPath(obj: any, path: string): any {
  console.log(`getValueFromPath - obj:`, JSON.stringify(obj, null, 2))
  console.log(`getValueFromPath - path:`, path)
  
  const result = path.split('.').reduce((current, key) => {
    console.log(`  accessing key "${key}" on:`, JSON.stringify(current, null, 2))
    return current?.[key]
  }, obj)
  
  console.log(`getValueFromPath - result:`, JSON.stringify(result, null, 2))
  return result
}

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const flowId = parseInt(params.flowId)
    const { assessmentResponseId, currentStepId, stepResponse } = await request.json()


    console.log('=== Next Step Debug ===')
    console.log('Current Step ID:', currentStepId)
    console.log('Step Response:', JSON.stringify(stepResponse, null, 2))

    // Save the step response if provided
    if (stepResponse) {
      // Convert string numbers to actual numbers for numeric comparisons
      let processedResponse = stepResponse
      if (typeof stepResponse === 'string' && !isNaN(Number(stepResponse))) {
        processedResponse = Number(stepResponse)
      }
      
      // Store the response directly under 'value' key to match our condition path
      const responseData = { value: processedResponse }
      console.log('Saving response data:', JSON.stringify(responseData, null, 2))
      
      await prisma.stepResponse.create({
        data: {
          assessmentResponseId,
          stepId: currentStepId,
          data: responseData,
          completedAt: new Date()
        }
      })
    }

    // Get all responses for this assessment to evaluate conditions
    const allResponses = await prisma.stepResponse.findMany({
      where: { assessmentResponseId }
    })

    console.log('All responses for evaluation:', JSON.stringify(allResponses, null, 2))

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

    console.log('Available transitions:', JSON.stringify(transitions.map(t => ({
      id: t.id,
      fromStepId: t.fromStepId,
      toStepId: t.toStepId,
      order: t.order,
      condition: t.condition
    })), null, 2))

    // Find the first transition that matches conditions
    let nextStep = null
    for (const transition of transitions) {
      const conditionResult = evaluateCondition(transition.condition, allResponses)
      console.log(`Transition ${transition.id} (${transition.fromStepId} -> ${transition.toStepId}): ${conditionResult}`)
      
      if (conditionResult) {
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
