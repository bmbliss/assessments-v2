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
    const { assessment, questions, practiceId, creatorId } = body

    // Verify that the user is a provider
    const dbUser = await db.user.findUnique({
      where: { id: creatorId }
    })

    if (!dbUser || (dbUser.role !== 'DOCTOR' && dbUser.role !== 'PA' && dbUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create assessment and version in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the assessment
      const newAssessment = await tx.assessment.create({
        data: {
          title: assessment.title,
          description: assessment.description,
          finalMessage: assessment.finalMessage,
          status: assessment.status || 'DRAFT',
          isTemplate: assessment.isTemplate || false,
          practiceId: practiceId,
          creatorId: creatorId
        }
      })

      // Create the first version
      const version = await tx.version.create({
        data: {
          versionNumber: 1,
          assessmentId: newAssessment.id
        }
      })

      // Create questions
      if (questions && questions.length > 0) {
        await tx.question.createMany({
          data: questions.map((question: any) => ({
            versionId: version.id,
            order: question.order,
            text: question.text,
            type: question.type,
            options: question.options || null,
            validation: question.validation || null,
            dependsOnQuestionId: question.dependsOnQuestionId || null,
            conditionValue: question.conditionValue || null
          }))
        })
      }

      return { assessmentId: newAssessment.id, versionId: version.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Assessment created successfully',
      assessmentId: result.assessmentId,
      versionId: result.versionId
    })

  } catch (error) {
    console.error('Create assessment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
