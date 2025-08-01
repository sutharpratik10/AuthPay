export interface PasswordStrength {
  score: number // 0-4 (weak to strong)
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  color: string
  suggestions: string[]
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      color: 'bg-red-500',
      suggestions: ['Enter a password to see strength']
    }
  }

  let score = 0
  const suggestions: string[] = []

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    suggestions.push('Use at least 8 characters')
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    suggestions.push('Add uppercase letters')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    suggestions.push('Add lowercase letters')
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    suggestions.push('Add numbers')
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1
  } else {
    suggestions.push('Add special characters (!@#$%^&*)')
  }

  // Additional length bonus
  if (password.length >= 12) {
    score += 1
  }

  // Cap the score at 4
  score = Math.min(score, 4)

  // Determine label and color based on score
  let label: PasswordStrength['label']
  let color: string

  switch (score) {
    case 0:
    case 1:
      label = 'Very Weak'
      color = 'bg-red-500'
      break
    case 2:
      label = 'Weak'
      color = 'bg-orange-500'
      break
    case 3:
      label = 'Fair'
      color = 'bg-yellow-500'
      break
    case 4:
      label = 'Good'
      color = 'bg-blue-500'
      break
    default:
      label = 'Strong'
      color = 'bg-green-500'
      break
  }

  // Override for very strong passwords
  if (score >= 4 && password.length >= 12) {
    label = 'Strong'
    color = 'bg-green-500'
  }

  return {
    score,
    label,
    color,
    suggestions
  }
}

export function getPasswordStrengthWidth(score: number): string {
  switch (score) {
    case 0:
      return 'w-0'
    case 1:
      return 'w-1/5'
    case 2:
      return 'w-2/5'
    case 3:
      return 'w-3/5'
    case 4:
    default:
      return 'w-4/5'
  }
}
