import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

interface Params {
  id: string
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assessmentId = parseInt(params.id)
    const body = await request.json()
    const { assessment, questions, practiceId, creatorId } = body

    // Verify that the user is a provider
    const dbUser = await db.user.findUnique({
      where: { id: creatorId }
    })

    if (!dbUser || (dbUser.role !== 'DOCTOR' && dbUser.role !== 'PA' && dbUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the existing assessment
    const existingAssessment = await db.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    })

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Check if user has permission to edit
    if (existingAssessment.practiceId !== practiceId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update assessment and handle versioning in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update the assessment basic info
      const updatedAssessment = await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          title: assessment.title,
          description: assessment.description,
          finalMessage: assessment.finalMessage,
          status: assessment.status || 'DRAFT',
          isTemplate: assessment.isTemplate || false
        }
      })

      let versionId = existingAssessment.versions[0]?.id

      // If assessment is already published (ACTIVE), create a new version for changes
      if (existingAssessment.status === 'ACTIVE' && assessment.status === 'ACTIVE') {
        const latestVersion = existingAssessment.versions[0]
        const newVersion = await tx.version.create({
          data: {
            versionNumber: latestVersion.versionNumber + 1,
            assessmentId: assessmentId
          }
        })
        versionId = newVersion.id
      } else {
        // For draft assessments, update the existing version
        if (versionId) {
          // Delete existing questions for this version
          await tx.question.deleteMany({
            where: { versionId: versionId }
          })
        } else {
          // Create first version if none exists
          const newVersion = await tx.version.create({
            data: {
              versionNumber: 1,
              assessmentId: assessmentId
            }
          })
          versionId = newVersion.id
        }
      }

      // Create/update questions
      if (questions && questions.length > 0 && versionId) {
        await tx.question.createMany({
          data: questions.map((question: any) => ({
            versionId: versionId,
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

      return { assessmentId: updatedAssessment.id, versionId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Assessment updated successfully',
      assessmentId: result.assessmentId,
      versionId: result.versionId
    })

  } catch (error) {
    console.error('Update assessment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
