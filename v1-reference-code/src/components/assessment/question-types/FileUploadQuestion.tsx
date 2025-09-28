'use client'

import { Question } from '@prisma/client'
import { Control, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText } from 'lucide-react'
import { useState } from 'react'
import { parseValidation } from '../utils/validation'

interface FileUploadQuestionProps {
  question: Question
  control: Control<any>
  fieldName: string
}

export function FileUploadQuestion({ question, control, fieldName }: FileUploadQuestionProps) {
  const validation = parseValidation(question.validation)
  const [dragOver, setDragOver] = useState(false)

  // For POC, we'll simulate file upload with a mock URL
  const handleFileUpload = async (file: File): Promise<string> => {
    // In production, this would upload to S3 and return the URL
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://mock-s3-url.com/uploads/${file.name}`)
      }, 1000)
    })
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={fieldName} className="text-sm font-medium">
        {question.text}
        {validation.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <p className="text-xs text-gray-500">Supported formats: PDF, JPEG, PNG (Max 10MB)</p>
      
      <Controller
        name={fieldName}
        control={control}
        rules={{
          required: validation.required ? 'Please upload a file' : false
        }}
        render={({ field, fieldState: { error } }) => {
          const [uploading, setUploading] = useState(false)
          const [fileName, setFileName] = useState<string>('')

          const processFile = async (file: File) => {
            if (!file) return

            // Basic validation
            const maxSize = 10 * 1024 * 1024 // 10MB
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
            
            if (file.size > maxSize) {
              alert('File size must be less than 10MB')
              return
            }
            
            if (!allowedTypes.includes(file.type)) {
              alert('Only PDF, JPEG, and PNG files are allowed')
              return
            }

            setUploading(true)
            setFileName(file.name)
            
            try {
              const url = await handleFileUpload(file)
              field.onChange(url)
            } catch (error) {
              console.error('Upload failed:', error)
              alert('Upload failed. Please try again.')
            } finally {
              setUploading(false)
            }
          }

          const handleDrop = (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            const files = Array.from(e.dataTransfer.files)
            if (files[0]) {
              processFile(files[0])
            }
          }

          const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || [])
            if (files[0]) {
              processFile(files[0])
            }
          }

          const clearFile = () => {
            field.onChange('')
            setFileName('')
          }

          return (
            <div>
              {field.value ? (
                // File uploaded state
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{fileName || 'Uploaded file'}</p>
                        <p className="text-xs text-gray-500">File uploaded successfully</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Upload area
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : error 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {uploading ? (
                    <div className="space-y-2">
                      <div className="animate-spin mx-auto h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Drag and drop your file here, or{' '}
                          <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                            browse
                            <Input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileSelect}
                            />
                          </label>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {error && (
                <p className="text-red-500 text-sm mt-1">{error.message}</p>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}
