import { PrismaClient, UserRole, StepType, AssessmentStatus } from '@prisma/client'

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
    where: { email: 'doctor@clinic.com' },
    update: {},
    create: {
      email: 'doctor@clinic.com',
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

  // Create TRT Assessment
  const assessment = await prisma.assessment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Testosterone Replacement Therapy (TRT) Assessment',
      description: 'Comprehensive evaluation for TRT eligibility and treatment planning',
      status: AssessmentStatus.ACTIVE,
      practiceId: practice.id,
      creatorId: doctor.id,
      finalMessage: 'Thank you for completing your TRT assessment. A provider will review your responses and contact you within 24-48 hours.',
    },
  })

  // Create version
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

  // Create assessment flow
  const flow = await prisma.assessmentFlow.upsert({
    where: { id: 1 },
    update: {},
    create: {
      versionId: version.id,
    },
  })

  // Create flow steps
  const welcomeStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.INFORMATION,
      title: 'Welcome to TRT Assessment',
      config: {
        content: '# Welcome to Your TRT Assessment\n\nThis assessment will help us determine if Testosterone Replacement Therapy is right for you. The evaluation typically takes 10-15 minutes to complete.\n\n**What to expect:**\n- Questions about your symptoms and health history\n- Age and lifestyle verification\n- Treatment options based on your responses\n\nAll information is confidential and will be reviewed by a licensed healthcare provider.',
        format: 'markdown',
        continueButton: 'Start Assessment'
      },
      position: { x: 100, y: 100 }
    },
  })

  const ageStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.QUESTION,
      title: 'Age Verification',
      config: {
        questionType: 'number',
        text: 'What is your current age?',
        validation: {
          required: true,
          min: 18,
          max: 100,
          customMessage: 'You must be at least 18 years old for TRT evaluation'
        }
      },
      position: { x: 300, y: 100 }
    },
  })

  const symptomsStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.QUESTION,
      title: 'Symptom Assessment',
      config: {
        questionType: 'multi_select',
        text: 'Which of the following symptoms have you experienced in the past 6 months? (Select all that apply)',
        options: [
          { value: 'low_energy', label: 'Low energy/fatigue', weight: 2 },
          { value: 'decreased_libido', label: 'Decreased sex drive', weight: 3 },
          { value: 'erectile_dysfunction', label: 'Erectile dysfunction', weight: 3 },
          { value: 'mood_changes', label: 'Mood changes/irritability', weight: 2 },
          { value: 'muscle_loss', label: 'Loss of muscle mass', weight: 2 },
          { value: 'weight_gain', label: 'Unexplained weight gain', weight: 1 },
          { value: 'sleep_issues', label: 'Sleep problems', weight: 1 },
          { value: 'brain_fog', label: 'Difficulty concentrating', weight: 1 }
        ],
        validation: {
          required: true,
          minSelections: 1
        }
      },
      position: { x: 500, y: 100 }
    },
  })

  const severityStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.QUESTION,
      title: 'Symptom Severity',
      config: {
        questionType: 'single_select',
        text: 'How would you rate the overall impact of these symptoms on your daily life?',
        options: [
          { value: 'mild', label: 'Mild - Barely noticeable', score: 1 },
          { value: 'moderate', label: 'Moderate - Somewhat bothersome', score: 2 },
          { value: 'severe', label: 'Severe - Significantly impacts daily activities', score: 3 },
          { value: 'very_severe', label: 'Very Severe - Greatly affects quality of life', score: 4 }
        ],
        validation: {
          required: true
        }
      },
      position: { x: 700, y: 100 }
    },
  })

  const labInfoStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.INFORMATION,
      title: 'Lab Work Required',
      config: {
        content: '# Lab Work Required\n\nBased on your responses, we recommend comprehensive hormone testing to determine your current testosterone levels and overall health status.\n\n**Required Tests:**\n- Total Testosterone\n- Free Testosterone\n- Estradiol (E2)\n- Complete Blood Count (CBC)\n- Comprehensive Metabolic Panel (CMP)\n- Lipid Panel\n- PSA (Prostate Specific Antigen)\n\nThese tests can be completed at any LabCorp or Quest location near you.',
        format: 'markdown',
        continueButton: 'Continue to Treatment Options'
      },
      position: { x: 900, y: 100 }
    },
  })

  const treatmentStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.CHECKOUT,
      title: 'Treatment Plan Selection',
      config: {
        title: 'Select Your TRT Treatment Plan',
        products: [
          {
            id: 'trt_basic',
            name: 'TRT Basic Plan',
            description: 'Monthly testosterone therapy with basic monitoring',
            price: 19900, // $199.00
            recurring: true,
            interval: 'month',
            features: [
              'Monthly testosterone medication',
              'Quarterly lab monitoring',
              'Provider consultations as needed',
              'Treatment adjustments'
            ]
          },
          {
            id: 'trt_premium',
            name: 'TRT Premium Plan',
            description: 'Comprehensive hormone optimization with enhanced support',
            price: 29900, // $299.00
            recurring: true,
            interval: 'month',
            features: [
              'Monthly testosterone medication',
              'Monthly lab monitoring',
              'Bi-weekly provider check-ins',
              'Nutritional guidance',
              'Fitness recommendations',
              'Priority customer support'
            ]
          }
        ],
        paymentRequired: true,
        allowMultiple: false
      },
      position: { x: 1100, y: 100 }
    },
  })

  const providerReviewStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.PROVIDER_REVIEW,
      title: 'Provider Review Required',
      config: {
        priority: 'high',
        message: 'Patient has completed TRT assessment and requires provider review for treatment approval',
        autoAssign: true,
        estimatedReviewTime: '24 hours',
        requiredActions: ['clinical_review', 'lab_order', 'treatment_approval']
      },
      position: { x: 900, y: 300 }
    },
  })

  const lowSymptomsStep = await prisma.flowStep.create({
    data: {
      flowId: flow.id,
      type: StepType.INFORMATION,
      title: 'Alternative Recommendations',
      config: {
        content: '# Alternative Health Recommendations\n\nBased on your responses, your symptoms may not strongly indicate low testosterone. However, there are several lifestyle approaches that can help improve energy, mood, and overall well-being:\n\n**Recommendations:**\n- Regular exercise (strength training + cardio)\n- Optimized sleep schedule (7-9 hours nightly)\n- Stress management techniques\n- Balanced nutrition with adequate protein\n- Vitamin D and B12 supplementation\n\nIf symptoms persist or worsen, we recommend consulting with your primary care physician for further evaluation.',
        format: 'markdown',
        continueButton: 'Complete Assessment'
      },
      position: { x: 700, y: 300 }
    },
  })

  // Create flow transitions
  await prisma.flowTransition.createMany({
    data: [
      // Welcome -> Age
      {
        flowId: flow.id,
        fromStepId: welcomeStep.id,
        toStepId: ageStep.id,
        order: 1
      },
      // Age -> Symptoms (if age >= 18)
      {
        flowId: flow.id,
        fromStepId: ageStep.id,
        toStepId: symptomsStep.id,
        condition: {
          rules: [{
            stepId: ageStep.id,
            operator: 'greater_than_or_equal',
            value: 18,
            path: 'data.value'
          }],
          logic: 'AND'
        },
        order: 1
      },
      // Symptoms -> Severity
      {
        flowId: flow.id,
        fromStepId: symptomsStep.id,
        toStepId: severityStep.id,
        order: 1
      },
      // Severity -> Lab Info (if moderate or severe symptoms)
      {
        flowId: flow.id,
        fromStepId: severityStep.id,
        toStepId: labInfoStep.id,
        condition: {
          rules: [{
            stepId: severityStep.id,
            operator: 'in',
            value: ['moderate', 'severe', 'very_severe'],
            path: 'data.value'
          }],
          logic: 'AND'
        },
        order: 1
      },
      // Severity -> Low Symptoms (if mild)
      {
        flowId: flow.id,
        fromStepId: severityStep.id,
        toStepId: lowSymptomsStep.id,
        condition: {
          rules: [{
            stepId: severityStep.id,
            operator: 'equals',
            value: 'mild',
            path: 'data.value'
          }],
          logic: 'AND'
        },
        order: 2
      },
      // Lab Info -> Treatment
      {
        flowId: flow.id,
        fromStepId: labInfoStep.id,
        toStepId: treatmentStep.id,
        order: 1
      },
      // Treatment -> Provider Review
      {
        flowId: flow.id,
        fromStepId: treatmentStep.id,
        toStepId: providerReviewStep.id,
        order: 1
      }
    ]
  })

  // Update flow with start step
  await prisma.assessmentFlow.update({
    where: { id: flow.id },
    data: { startStepId: welcomeStep.id }
  })

  console.log('✅ Seed data created successfully!')
  console.log(`📋 Assessment: ${assessment.title}`)
  console.log(`👨‍⚕️ Doctor: ${doctor.email}`)
  console.log(`👤 Patient: ${patient.email}`)
  console.log(`🏥 Practice: ${practice.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
