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
    const { responseId, notes } = body

    // Verify that the user is a provider and has access to this response
    const dbUser = await db.user.findUnique({
      where: { 
        // In production, you'd link Clerk userId to your User model
        // For now, we'll use a different approach to verify provider access
        id: 1 // This is a simplification for the POC
      }
    })

    if (!dbUser || (dbUser.role !== 'DOCTOR' && dbUser.role !== 'PA' && dbUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify that the response exists and belongs to the provider's practice
    const response = await db.assessmentResponse.findUnique({
      where: { id: responseId },
      include: {
        assessment: {
          include: {
            practice: true
          }
        }
      }
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // For POC, we'll allow any authenticated provider to add notes
    // In production, you'd verify practice membership

    // Update the response with provider notes
    const updatedResponse = await db.assessmentResponse.update({
      where: { id: responseId },
      data: {
        notes: notes || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Notes saved successfully',
      notes: updatedResponse.notes
    })

  } catch (error) {
    console.error('Save notes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
