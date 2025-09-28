import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { responseId, answers, isSubmit } = body

    // Verify that the user owns this response
    const response = await db.assessmentResponse.findUnique({
      where: { id: responseId },
      include: { patient: true }
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // For now, we'll allow any authenticated user to save responses
    // In production, you'd verify the user matches the patient

    // Delete existing answers for this response
    await db.answer.deleteMany({
      where: { responseId: responseId }
    })

    // Create new answers
    if (answers && answers.length > 0) {
      await db.answer.createMany({
        data: answers.map((answer: any) => ({
          responseId: responseId,
          questionId: answer.questionId,
          value: answer.value || null,
          fileUrl: answer.fileUrl || null,
          answeredAt: new Date()
        }))
      })
    }

    // Update response status if submitting
    if (isSubmit) {
      await db.assessmentResponse.update({
        where: { id: responseId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: isSubmit ? 'Assessment submitted successfully' : 'Progress saved successfully'
    })

  } catch (error) {
    console.error('Save response error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
