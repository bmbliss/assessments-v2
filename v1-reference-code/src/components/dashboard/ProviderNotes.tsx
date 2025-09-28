'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ClientDate } from '@/components/ui/ClientDate'
import { Save, Edit3, X, FileText } from 'lucide-react'

interface ProviderNotesProps {
  responseId: number
  initialNotes: string | null
  providerId: number
}

export function ProviderNotes({ responseId, initialNotes, providerId }: ProviderNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [isEditing, setIsEditing] = useState(!initialNotes) // Start editing if no notes exist
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(
    initialNotes ? new Date() : null
  )

  const saveNotes = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/assessments/save-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          notes: notes.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to save notes')
      
      setLastSaved(new Date())
      setIsEditing(false)
    } catch (error) {
      console.error('Save notes error:', error)
      alert('Failed to save notes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setNotes(initialNotes || '')
    setIsEditing(false)
  }

  const startEdit = () => {
    setIsEditing(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Provider Notes
          </CardTitle>
          {!isEditing && notes && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your clinical notes, observations, or follow-up actions here..."
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {notes.trim().length} characters
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveNotes}
                  disabled={saving || notes.trim() === (initialNotes || '')}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notes ? (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm whitespace-pre-wrap">{notes}</p>
                </div>
                {lastSaved && (
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Last updated: <ClientDate date={lastSaved} format="datetime" />
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {notes.trim().length} characters
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-3">No provider notes yet</p>
                <Button size="sm" onClick={startEdit}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Add Notes
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
