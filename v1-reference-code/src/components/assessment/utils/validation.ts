interface ValidationRules {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  step?: number
}

export function parseValidation(validationString?: string | null): ValidationRules {
  if (!validationString) return {}
  
  const rules: ValidationRules = {}
  
  // Parse validation string like "required=true,min=0,max=100"
  const pairs = validationString.split(',')
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(s => s.trim())
    
    switch (key.toLowerCase()) {
      case 'required':
        rules.required = value.toLowerCase() === 'true'
        break
      case 'min':
        rules.min = parseFloat(value)
        break
      case 'max':
        rules.max = parseFloat(value)
        break
      case 'minlength':
        rules.minLength = parseInt(value)
        break
      case 'maxlength':
        rules.maxLength = parseInt(value)
        break
      case 'step':
        rules.step = parseFloat(value)
        break
    }
  }
  
  return rules
}

export function formatValidationSummary(rules: ValidationRules): string {
  const parts: string[] = []
  
  if (rules.required) parts.push('Required')
  if (rules.min !== undefined && rules.max !== undefined) {
    parts.push(`Range: ${rules.min}-${rules.max}`)
  } else if (rules.min !== undefined) {
    parts.push(`Min: ${rules.min}`)
  } else if (rules.max !== undefined) {
    parts.push(`Max: ${rules.max}`)
  }
  
  if (rules.minLength) parts.push(`Min length: ${rules.minLength}`)
  if (rules.maxLength) parts.push(`Max length: ${rules.maxLength}`)
  
  return parts.join(', ')
}
