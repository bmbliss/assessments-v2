import { PrismaClient, UserRole, AssessmentStatus, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a practice
  const practice = await prisma.practice.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'TeleHealth Clinic',
    },
  })

  // Create a doctor user
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@example.com' },
    update: {},
    create: {
      email: 'doctor@example.com',
      role: UserRole.DOCTOR,
      practiceId: practice.id,
    },
  })

  // Create a patient user
  const patient = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      role: UserRole.PATIENT,
      practiceId: practice.id,
    },
  })

  // Create a sample assessment
  const assessment = await prisma.assessment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'TRT Initial Assessment',
      description: 'Initial assessment for Testosterone Replacement Therapy candidates',
      status: AssessmentStatus.ACTIVE,
      practiceId: practice.id,
      creatorId: doctor.id,
      finalMessage: 'Thank you for completing your TRT assessment. A provider will review your responses and contact you shortly.',
    },
  })

  // Create the first version of the assessment
  const version = await prisma.version.upsert({
    where: { 
      assessmentId_versionNumber: {
        assessmentId: assessment.id,
        versionNumber: 1
      }
    },
    update: {},
    create: {
      versionNumber: 1,
      assessmentId: assessment.id,
    },
  })

  // Create sample questions
  const questions = [
    {
      order: 1,
      text: 'What is your age?',
      type: QuestionType.NUMBER,
      validation: 'required=true,min=18,max=100',
    },
    {
      order: 2,
      text: 'Have you been diagnosed with low testosterone before?',
      type: QuestionType.SINGLE_SELECT,
      options: 'Yes,No,Not sure',
      validation: 'required=true',
    },
    {
      order: 3,
      text: 'If yes, please describe your previous diagnosis and treatment:',
      type: QuestionType.TEXT,
      dependsOnQuestionId: null, // Will be set after questions are created
      conditionValue: 'Yes',
      validation: 'required=false',
    },
    {
      order: 4,
      text: 'Rate your current energy level (1-10):',
      type: QuestionType.SLIDER,
      validation: 'required=true,min=1,max=10',
    },
    {
      order: 5,
      text: 'Which symptoms are you currently experiencing? (Select all that apply)',
      type: QuestionType.MULTI_SELECT,
      options: 'Low energy,Decreased libido,Mood changes,Sleep issues,Weight gain,Muscle loss',
      validation: 'required=true',
    },
  ]

  const createdQuestions = []
  for (const questionData of questions) {
    const question = await prisma.question.create({
      data: {
        ...questionData,
        versionId: version.id,
      },
    })
    createdQuestions.push(question)
  }

  // Update the conditional question to depend on the "low testosterone" question
  await prisma.question.update({
    where: { id: createdQuestions[2].id },
    data: {
      dependsOnQuestionId: createdQuestions[1].id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created practice: ${practice.name}`)
  console.log(`Created doctor: ${doctor.email}`)
  console.log(`Created patient: ${patient.email}`)
  console.log(`Created assessment: ${assessment.title} with ${createdQuestions.length} questions`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
