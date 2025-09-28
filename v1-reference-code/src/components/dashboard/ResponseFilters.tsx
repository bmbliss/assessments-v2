'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface ResponseFiltersProps {
  assessments: { id: number; title: string }[]
  currentFilters: {
    status?: string
    assessment?: string
    patient?: string
    date?: string
  }
}

export function ResponseFilters({ assessments, currentFilters }: ResponseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`/dashboard/responses?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push('/dashboard/responses')
  }

  const hasFilters = Object.values(currentFilters).some(value => value && value !== 'all')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </Label>
          <Select 
            value={currentFilters.status || 'all'} 
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DRAFT">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assessment Filter */}
        <div className="space-y-2">
          <Label htmlFor="assessment-filter" className="text-sm font-medium">
            Assessment
          </Label>
          <Select 
            value={currentFilters.assessment || 'all'} 
            onValueChange={(value) => updateFilter('assessment', value)}
          >
            <SelectTrigger id="assessment-filter">
              <SelectValue placeholder="All assessments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assessments</SelectItem>
              {assessments.map((assessment) => (
                <SelectItem key={assessment.id} value={assessment.id.toString()}>
                  {assessment.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Patient Filter */}
        <div className="space-y-2">
          <Label htmlFor="patient-filter" className="text-sm font-medium">
            Patient Email
          </Label>
          <Input
            id="patient-filter"
            placeholder="Search by email..."
            value={currentFilters.patient || ''}
            onChange={(e) => updateFilter('patient', e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="date-filter" className="text-sm font-medium">
            Date Started
          </Label>
          <Input
            id="date-filter"
            type="date"
            value={currentFilters.date || ''}
            onChange={(e) => updateFilter('date', e.target.value)}
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-gray-600"
          >
            <X className="w-4 h-4 mr-2" />
            Clear all filters
          </Button>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.status && currentFilters.status !== 'all' && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Status: {currentFilters.status}
              <button
                onClick={() => updateFilter('status', 'all')}
                className="ml-2 hover:bg-blue-200 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {currentFilters.assessment && currentFilters.assessment !== 'all' && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
              Assessment: {assessments.find(a => a.id.toString() === currentFilters.assessment)?.title || 'Unknown'}
              <button
                onClick={() => updateFilter('assessment', 'all')}
                className="ml-2 hover:bg-green-200 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {currentFilters.patient && (
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
              Patient: {currentFilters.patient}
              <button
                onClick={() => updateFilter('patient', '')}
                className="ml-2 hover:bg-purple-200 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {currentFilters.date && (
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center">
              Date: {new Date(currentFilters.date).toLocaleDateString()}
              <button
                onClick={() => updateFilter('date', '')}
                className="ml-2 hover:bg-orange-200 rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
