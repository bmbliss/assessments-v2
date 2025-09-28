'use client'

import { User } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AssessmentData } from './AssessmentBuilder'
import { Building, Info, MessageSquare } from 'lucide-react'

interface AssessmentBasicInfoProps {
  data: AssessmentData
  onChange: (data: AssessmentData) => void
  user: User & { practice: { name: string } | null }
}

export function AssessmentBasicInfo({ data, onChange, user }: AssessmentBasicInfoProps) {
  const updateField = (field: keyof AssessmentData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Practice Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Building className="w-5 h-5 mr-2" />
            Practice Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">This assessment will be created for:</p>
            <p className="font-semibold">{user.practice?.name || 'Unknown Practice'}</p>
            <p className="text-sm text-gray-500">Created by: {user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Info className="w-5 h-5 mr-2" />
            Assessment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Assessment Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., TRT Initial Assessment, Hormone Therapy Evaluation"
              value={data.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={!data.title.trim() ? 'border-red-300' : ''}
            />
            <p className="text-xs text-gray-500">
              This will be displayed to patients when they see available assessments
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide a brief description of what this assessment covers and its purpose..."
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className={!data.description.trim() ? 'border-red-300' : ''}
            />
            <p className="text-xs text-gray-500">
              Help patients understand what this assessment is for
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <MessageSquare className="w-5 h-5 mr-2" />
            Completion Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finalMessage" className="text-sm font-medium">
              Success Message
            </Label>
            <Textarea
              id="finalMessage"
              placeholder="Thank you for completing this assessment..."
              value={data.finalMessage}
              onChange={(e) => updateField('finalMessage', e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              This message will be shown to patients after they submit the assessment
            </p>
          </div>

          {/* Preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Preview:</h4>
            <p className="text-green-800 whitespace-pre-wrap">
              {data.finalMessage || 'Thank you for completing this assessment. Your healthcare provider will review your responses.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTemplate"
              checked={data.isTemplate}
              onCheckedChange={(checked) => updateField('isTemplate', checked)}
            />
            <Label htmlFor="isTemplate" className="text-sm">
              Save as template for other practices to use
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Templates can be shared and forked by other practices in the system
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
