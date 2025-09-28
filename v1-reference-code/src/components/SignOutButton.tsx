'use client'

import { useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ 
  variant = 'outline', 
  size = 'sm', 
  className,
  children = 'Sign Out'
}: SignOutButtonProps) {
  const { signOut } = useClerk()

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={() => signOut({ redirectUrl: '/' })}
    >
      {children}
    </Button>
  )
}
