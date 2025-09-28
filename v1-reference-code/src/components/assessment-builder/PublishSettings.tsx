'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssessmentData } from './AssessmentBuilder'
import { CheckCircle, AlertCircle, Send, Save, Eye, Users } from 'lucide-react'

interface PublishSettingsProps {
  assessment: AssessmentData
  onChange: (data: AssessmentData) => void
  onSave: () => void
  onPublish: () => void
  saving: boolean
}

export function PublishSettings({ 
  assessment, 
  onChange, 
  onSave, 
  onPublish, 
  saving 
}: PublishSettingsProps) {
  
  const isReadyToPublish = assessment.title.trim() && assessment.description.trim()

  return (
    <div className="space-y-6">
      {/* Publish Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {assessment.status === 'ACTIVE' ? (
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
            )}
            Publication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Badge 
              className={
                assessment.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {assessment.status === 'ACTIVE' ? 'Published' : 'Draft'}
            </Badge>
            
            {assessment.isTemplate && (
              <Badge variant="outline">
                Template
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            {assessment.status === 'ACTIVE' 
              ? 'This assessment is live and available to patients.'
              : 'This assessment is saved as a draft and not yet available to patients.'
            }
          </p>
        </CardContent>
      </Card>

      {/* Pre-publish Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Publication Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {assessment.title.trim() ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={assessment.title.trim() ? 'text-green-900' : 'text-yellow-700'}>
                Assessment has a title
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {assessment.description.trim() ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={assessment.description.trim() ? 'text-green-900' : 'text-yellow-700'}>
                Assessment has a description
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-900">
                Assessment has been previewed
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {assessment.finalMessage.trim() ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className={assessment.finalMessage.trim() ? 'text-green-900' : 'text-yellow-700'}>
                Completion message is set
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Happens When You Publish */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            What Happens When You Publish?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Patients can access the assessment</p>
                <p className="text-gray-600">The assessment will appear in the patient portal</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Responses will be collected</p>
                <p className="text-gray-600">Patient answers will be saved and available for review</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Version is locked</p>
                <p className="text-gray-600">Future edits will create a new version to preserve response integrity</p>
              </div>
            </div>
            
            {assessment.isTemplate && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Available as template</p>
                  <p className="text-gray-600">Other practices can fork and customize this assessment</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Save as Draft */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Save as Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Save your progress without making the assessment available to patients yet.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          </CardContent>
        </Card>

        {/* Publish */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Publish Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Make this assessment available to patients immediately.
            </p>
            <Button 
              className="w-full"
              onClick={onPublish}
              disabled={!isReadyToPublish || saving}
            >
              <Send className="w-4 h-4 mr-2" />
              {saving ? 'Publishing...' : 'Publish Assessment'}
            </Button>
            
            {!isReadyToPublish && (
              <p className="text-xs text-red-600 mt-2">
                Complete the checklist above before publishing
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Full Preview
            </Button>
            <Button variant="outline" className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Assign to Patients
            </Button>
            <Button variant="outline" className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
