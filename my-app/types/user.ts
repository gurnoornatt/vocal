export interface UserProfile {
  id: string
  name: string
  joinedDate: Date
  lastSession: Date
  completedExercises: number
  weeklyGoal: number
  strengths: string[]
  areasToImprove: string[]
}

export interface Conversation {
  id: string
  timestamp: Date
  userMessage: string
  vocalResponse: string
  improvement: number
}

