import { 
  Camera, 
  Users, 
  Shield, 
  Globe, 
  Palette, 
  Image, 
  QrCode, 
  Play, 
  UserPlus,
  type LucideIcon 
} from "lucide-react"
import type { StepStatus } from "./step-detection"

export interface QuickStartStep {
  id: string
  title: string
  description: string
  status: StepStatus
  isRequired: boolean
  weight: number // For progress calculation
  actionType: 'scroll' | 'modal' | 'external' | 'toggle' | 'none'
  actionTarget?: string
  actionLabel: string
  icon: LucideIcon
  category: 'critical' | 'recommended' | 'optional'
  order: number
}

// Step configuration - defines all 9 setup steps
export const STEP_DEFINITIONS: Omit<QuickStartStep, 'status'>[] = [
  // CRITICAL STEPS (Required for basic functionality)
  {
    id: 'cover-photo',
    title: 'Upload Cover Photo',
    description: 'Add a beautiful header image for your gallery',
    isRequired: true,
    weight: 20,
    actionType: 'scroll',
    actionTarget: 'gallery-cover-image',
    actionLabel: 'Upload Photo',
    icon: Camera,
    category: 'critical',
    order: 1,
  },
  {
    id: 'guest-count',
    title: 'Set Guest Count',
    description: 'Choose the right plan for your expected number of guests',
    isRequired: true,
    weight: 20,
    actionType: 'scroll',
    actionTarget: 'event-details',
    actionLabel: 'Set Guest Count',
    icon: Users,
    category: 'critical',
    order: 2,
  },
  {
    id: 'privacy-settings',
    title: 'Configure Privacy',
    description: 'Set who can view your gallery and approve uploads',
    isRequired: true,
    weight: 15,
    actionType: 'scroll',
    actionTarget: 'privacy-moderation',
    actionLabel: 'Review Settings',
    icon: Shield,
    category: 'critical',
    order: 3,
  },
  {
    id: 'publish-event',
    title: 'Set Date & Publish',
    description: 'Set your activation date and make your gallery live',
    isRequired: true,
    weight: 20,
    actionType: 'scroll',
    actionTarget: 'event-publication-status',
    actionLabel: 'Publish Gallery',
    icon: Globe,
    category: 'critical',
    order: 4,
  },

  // RECOMMENDED STEPS (Enhance the experience)
  {
    id: 'theme-selection',
    title: 'Choose Gallery Theme',
    description: 'Pick a beautiful theme that matches your event style',
    isRequired: false,
    weight: 10,
    actionType: 'scroll',
    actionTarget: 'gallery-theme-manager',
    actionLabel: 'Choose Theme',
    icon: Palette,
    category: 'recommended',
    order: 5,
  },
  {
    id: 'test-photos',
    title: 'Upload Test Photos',
    description: 'Add a few sample photos to test your gallery',
    isRequired: false,
    weight: 8,
    actionType: 'external',
    actionTarget: '/gallery/[slug]/upload',
    actionLabel: 'Upload Photos',
    icon: Image,
    category: 'recommended',
    order: 6,
  },
  {
    id: 'qr-download',
    title: 'Download QR Code',
    description: 'Get your QR code for printing cards and table displays',
    isRequired: false,
    weight: 5,
    actionType: 'scroll',
    actionTarget: 'qr-code-sharing',
    actionLabel: 'Download QR',
    icon: QrCode,
    category: 'recommended',
    order: 7,
  },
  {
    id: 'slideshow-test',
    title: 'Test Slideshow',
    description: 'Preview your slideshow to see how it looks',
    isRequired: false,
    weight: 2,
    actionType: 'external',
    actionTarget: '/gallery/[slug]/slideshow',
    actionLabel: 'Test Slideshow',
    icon: Play,
    category: 'recommended',
    order: 8,
  },

  // OPTIONAL STEPS (Nice to have)
  {
    id: 'collaborators',
    title: 'Add Collaborators',
    description: 'Invite others to help manage your gallery',
    isRequired: false,
    weight: 5,
    actionType: 'scroll',
    actionTarget: 'collaborators-section',
    actionLabel: 'Add Collaborators',
    icon: UserPlus,
    category: 'optional',
    order: 9,
  },
]

// Step categories with styling information
export const STEP_CATEGORIES = {
  critical: {
    label: 'Essential',
    color: 'red',
    description: 'Required to publish your gallery',
  },
  recommended: {
    label: 'Recommended',
    color: 'yellow',
    description: 'Enhance your gallery experience',
  },
  optional: {
    label: 'Optional',
    color: 'green',
    description: 'Additional features when you need them',
  },
} as const

// Helper function to get step by ID
export function getStepById(id: string): (Omit<QuickStartStep, 'status'>) | undefined {
  return STEP_DEFINITIONS.find(step => step.id === id)
}

// Helper function to get steps by category
export function getStepsByCategory(category: QuickStartStep['category']): (Omit<QuickStartStep, 'status'>)[] {
  return STEP_DEFINITIONS.filter(step => step.category === category)
}

// Helper function to get required steps
export function getRequiredSteps(): (Omit<QuickStartStep, 'status'>)[] {
  return STEP_DEFINITIONS.filter(step => step.isRequired)
}

// Helper function to get optional steps
export function getOptionalSteps(): (Omit<QuickStartStep, 'status'>)[] {
  return STEP_DEFINITIONS.filter(step => !step.isRequired)
}