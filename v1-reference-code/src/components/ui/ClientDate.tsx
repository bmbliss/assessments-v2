'use client'

import { useEffect, useState } from 'react'

interface ClientDateProps {
  date: Date
  format?: 'date' | 'datetime' | 'time'
  className?: string
}

export function ClientDate({ date, format = 'datetime', className }: ClientDateProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return <span className={className}>Loading...</span>
  }

  const formatDate = () => {
    switch (format) {
      case 'date':
        return date.toLocaleDateString()
      case 'time':
        return date.toLocaleTimeString()
      case 'datetime':
      default:
        return date.toLocaleString()
    }
  }

  return <span className={className}>{formatDate()}</span>
}
