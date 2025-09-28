'use client'

import { Button } from '@/components/ui/button'

interface InformationStepProps {
  config: {
    content: string
    format?: string
    continueButton?: string
    media?: {
      type: string
      url: string
    }
  }
  onContinue: () => void
}

export function InformationStep({ config, onContinue }: InformationStepProps) {
  const renderContent = () => {
    if (config.format === 'markdown') {
      // Simple markdown-like rendering for demo
      const content = config.content
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
        .replace(/^\*\* (.*$)/gim, '<p class="font-semibold mb-2">$1</p>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')
        .replace(/\n\n/g, '</p><p class="mb-4">')
        .replace(/\n/g, '<br>')

      return (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${content}</p>` }}
        />
      )
    }

    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {config.content}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderContent()}
      
      {config.media && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">
            Media: {config.media.type}
          </p>
          <p className="text-xs text-gray-500">
            {config.media.url}
          </p>
        </div>
      )}
      
      <div className="flex justify-center">
        <Button onClick={onContinue} className="min-w-32">
          {config.continueButton || 'Continue'}
        </Button>
      </div>
    </div>
  )
}
