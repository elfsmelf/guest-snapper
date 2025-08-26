"use client"

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useOptimizedEvent, useOptimizedUploadCount } from '@/lib/react-query-optimizations'
import { 
  getOnboardingState,
  updateOnboardingProgress,
  completeOnboardingStep,
  skipOnboardingStep,
  completeOnboarding,
  skipOnboarding,
  resumeOnboarding,
  updateOnboardingStep
} from '@/app/actions/onboarding'
import type { OnboardingState } from '@/types/onboarding'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Base query options for all onboarding queries (matches layout)
const baseQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh during wizard
  gcTime: 30 * 60 * 1000, // 30 minutes - cache persists for entire session
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  placeholderData: keepPreviousData, // Show previous data while loading
}

// Query key factory
export const onboardingKeys = {
  all: ['onboarding'] as const,
  state: (eventId: string) => [...onboardingKeys.all, 'state', eventId] as const,
}

// Additional query keys for prefetched data
export const eventKeys = {
  all: ['event'] as const,
  detail: (eventId: string) => [...eventKeys.all, eventId] as const,
}

export const albumKeys = {
  all: ['albums'] as const,
  list: (eventId: string) => [...albumKeys.all, eventId] as const,
}

export const uploadKeys = {
  all: ['uploads'] as const,
  count: (eventId: string) => [...uploadKeys.all, 'count', eventId] as const,
}

export const collaboratorKeys = {
  all: ['collaborators'] as const,
  organization: (eventId: string) => [...collaboratorKeys.all, 'organization', eventId] as const,
}

// Hook to get onboarding state
export function useOnboardingState(eventId: string) {
  return useQuery({
    queryKey: onboardingKeys.state(eventId),
    queryFn: async () => {
      console.log('🔍 useOnboardingState queryFn called with eventId:', eventId)
      
      try {
        const result = await getOnboardingState(eventId)
        console.log('🔍 useOnboardingState - query result:', result)
        console.log('🔍 useOnboardingState - result type:', typeof result)
        console.log('🔍 useOnboardingState - result keys:', result ? Object.keys(result) : 'no keys')
        
        // Absolute safety check - should never happen but just in case
        if (result === undefined || result === null) {
          console.error('🔍 getOnboardingState returned null/undefined, creating fallback')
          const fallback = {
            onboardingActive: true,
            onboardingComplete: false,
            onboardingSkipped: false,
            onboardingStartedAt: new Date().toISOString(),
            currentStep: 1,
            lastActiveStep: 1,
            completedSteps: [],
            skippedSteps: [],
            testImagesUploaded: false,
            testImageCount: 0,
            coverPhotoUploaded: false,
            coverPhotoSet: false,
            privacyConfigured: false,
            themeSelected: false,
            guestCountSet: false,
            paymentCompleted: false,
            eventPublished: false,
            albumsCreated: 0,
            albumIds: [],
            qrDownloaded: false,
            slideshowTested: false,
            collaboratorsInvited: 0,
            collaboratorEmails: [],
            lastUpdated: new Date().toISOString()
          }
          console.log('🔍 Returning fallback state:', fallback)
          return fallback
        }
        
        console.log('🔍 Returning actual result:', result)
        return result
      } catch (error) {
        console.error('🔍 useOnboardingState queryFn error:', error)
        throw error
      }
    },
    ...baseQueryOptions,
    retry: 3,
    retryDelay: 1000,
  })
}

// Hook to update onboarding progress with optimistic updates
export function useUpdateOnboardingProgress(eventId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (updates: Partial<OnboardingState>) => 
      updateOnboardingProgress(eventId, updates),
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: onboardingKeys.state(eventId) })
      
      // Snapshot the previous value
      const previousState = queryClient.getQueryData<OnboardingState>(
        onboardingKeys.state(eventId)
      )
      
      // Optimistically update to the new value
      if (previousState) {
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          { ...previousState, ...updates, lastUpdated: new Date().toISOString() }
        )
      }
      
      // Return a context object with the snapshotted value
      return { previousState }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousState) {
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          context.previousState
        )
      }
      toast.error('Failed to update progress')
    },
    onSuccess: (data) => {
      if (data.success && data.state) {
        queryClient.setQueryData(onboardingKeys.state(eventId), data.state)
      } else if (!data.success) {
        toast.error(data.error || 'Failed to update progress')
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    },
  })
}

// Hook to complete a step
export function useCompleteOnboardingStep(eventId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (stepId: string) => completeOnboardingStep(eventId, stepId),
    onMutate: async (stepId) => {
      await queryClient.cancelQueries({ queryKey: onboardingKeys.state(eventId) })
      
      const previousState = queryClient.getQueryData<OnboardingState>(
        onboardingKeys.state(eventId)
      )
      
      if (previousState) {
        const completedSteps = previousState.completedSteps.includes(stepId) 
          ? previousState.completedSteps 
          : [...previousState.completedSteps, stepId]
        const skippedSteps = previousState.skippedSteps.filter(id => id !== stepId)
        
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          { 
            ...previousState, 
            completedSteps,
            skippedSteps,
            lastUpdated: new Date().toISOString() 
          }
        )
      }
      
      return { previousState }
    },
    onError: (err, variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          context.previousState
        )
      }
      toast.error('Failed to complete step')
    },
    onSuccess: (data) => {
      if (data.success && data.state) {
        queryClient.setQueryData(onboardingKeys.state(eventId), data.state)
        toast.success('Step completed!')
      } else if (!data.success) {
        toast.error(data.error || 'Failed to complete step')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    },
  })
}

// Hook to skip a step
export function useSkipOnboardingStep(eventId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (stepId: string) => skipOnboardingStep(eventId, stepId),
    onMutate: async (stepId) => {
      await queryClient.cancelQueries({ queryKey: onboardingKeys.state(eventId) })
      
      const previousState = queryClient.getQueryData<OnboardingState>(
        onboardingKeys.state(eventId)
      )
      
      if (previousState) {
        const skippedSteps = previousState.skippedSteps.includes(stepId) 
          ? previousState.skippedSteps 
          : [...previousState.skippedSteps, stepId]
        
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          { 
            ...previousState, 
            skippedSteps,
            lastUpdated: new Date().toISOString() 
          }
        )
      }
      
      return { previousState }
    },
    onError: (err, variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          context.previousState
        )
      }
      toast.error('Failed to skip step')
    },
    onSuccess: (data) => {
      if (data.success && data.state) {
        queryClient.setQueryData(onboardingKeys.state(eventId), data.state)
        toast.success('Step skipped')
      } else if (!data.success) {
        toast.error(data.error || 'Failed to skip step')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    },
  })
}

// Hook to update current step (navigation)
export function useUpdateOnboardingStep(eventId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (step: number) => updateOnboardingStep(eventId, step),
    onMutate: async (step) => {
      await queryClient.cancelQueries({ queryKey: onboardingKeys.state(eventId) })
      
      const previousState = queryClient.getQueryData<OnboardingState>(
        onboardingKeys.state(eventId)
      )
      
      if (previousState) {
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          { 
            ...previousState, 
            currentStep: step,
            lastActiveStep: step,
            lastUpdated: new Date().toISOString() 
          }
        )
      }
      
      return { previousState }
    },
    onError: (err, variables, context) => {
      if (context?.previousState) {
        queryClient.setQueryData(
          onboardingKeys.state(eventId),
          context.previousState
        )
      }
    },
    onSuccess: (data) => {
      if (data.success && data.state) {
        queryClient.setQueryData(onboardingKeys.state(eventId), data.state)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    },
  })
}

// Hook to complete onboarding
export function useCompleteOnboarding(eventId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: () => completeOnboarding(eventId),
    onSuccess: (data) => {
      if (data.success && data.state) {
        queryClient.setQueryData(onboardingKeys.state(eventId), data.state)
        toast.success('Onboarding completed! 🎉')
        router.push(`/dashboard/events/${eventId}`)
      } else if (!data.success) {
        toast.error(data.error || 'Failed to complete onboarding')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    },
  })
}

// Hook to skip onboarding
export function useSkipOnboarding(eventId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: (permanent: boolean = false) => skipOnboarding(eventId, permanent),
    onSuccess: (data) => {
      if (data.success && data.state) {
        queryClient.setQueryData(onboardingKeys.state(eventId), data.state)
        toast.success('Onboarding skipped')
        router.push(`/dashboard/events/${eventId}`)
      } else if (!data.success) {
        toast.error(data.error || 'Failed to skip onboarding')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    },
  })
}

// Hook to resume onboarding
export function useResumeOnboarding(eventId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => resumeOnboarding(eventId),
    onSuccess: (data) => {
      if (data.success && data.state) {
        queryClient.setQueryData(onboardingKeys.state(eventId), data.state)
        toast.success('Onboarding resumed')
      } else if (!data.success) {
        toast.error(data.error || 'Failed to resume onboarding')
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    },
  })
}

// Hook to get event data
export function useEventData(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch event data')
      return response.json()
    },
    ...baseQueryOptions,
  })
}

// Hook to get albums data
export function useAlbumsData(eventId: string) {
  return useQuery({
    queryKey: albumKeys.list(eventId),
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/albums`)
      if (!response.ok) throw new Error('Failed to fetch albums')
      return response.json()
    },
    ...baseQueryOptions,
  })
}

// Hook to prefetch data for onboarding steps
export function usePrefetchOnboardingData(eventId: string) {
  const queryClient = useQueryClient()
  
  const prefetchEventData = () => {
    queryClient.prefetchQuery({
      queryKey: eventKeys.detail(eventId),
      queryFn: async () => {
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) throw new Error('Failed to fetch event data')
        return response.json()
      },
      ...baseQueryOptions,
    })
  }
  
  const prefetchAlbumsData = () => {
    queryClient.prefetchQuery({
      queryKey: albumKeys.list(eventId),
      queryFn: async () => {
        const response = await fetch(`/api/events/${eventId}/albums`)
        if (!response.ok) throw new Error('Failed to fetch albums')
        return response.json()
      },
      ...baseQueryOptions,
    })
  }
  
  return {
    prefetchEventData,
    prefetchAlbumsData,
  }
}

// Hook to get upload count
export function useUploadCount(eventId: string) {
  return useQuery({
    queryKey: uploadKeys.count(eventId),
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/uploads/count`)
      if (!response.ok) throw new Error('Failed to fetch upload count')
      return response.json()
    },
    ...baseQueryOptions,
    staleTime: 2 * 60 * 1000, // 2 minutes for upload count (more frequent updates)
  })
}

// Utility to prefetch next step data
export function usePrefetchNextStep() {
  const queryClient = useQueryClient()
  
  return {
    prefetchEventData: (eventId: string) => {
      queryClient.prefetchQuery({
        queryKey: eventKeys.detail(eventId),
        queryFn: async () => {
          const response = await fetch(`/api/events/${eventId}`)
          if (!response.ok) throw new Error('Failed to fetch event data')
          return response.json()
        },
        ...baseQueryOptions,
      })
    },
    prefetchAlbums: (eventId: string) => {
      queryClient.prefetchQuery({
        queryKey: albumKeys.list(eventId),
        queryFn: async () => {
          const response = await fetch(`/api/events/${eventId}/albums`)
          if (!response.ok) throw new Error('Failed to fetch albums')
          return response.json()
        },
        ...baseQueryOptions,
      })
    },
    prefetchUploadCount: (eventId: string) => {
      queryClient.prefetchQuery({
        queryKey: uploadKeys.count(eventId),
        queryFn: async () => {
          const response = await fetch(`/api/events/${eventId}/uploads/count`)
          if (!response.ok) throw new Error('Failed to fetch upload count')
          return response.json()
        },
        ...baseQueryOptions,
      })
    }
  }
}

// Hook to create album with optimistic updates
export function useCreateAlbum(eventId: string, onAlbumsChange?: (albums: any[]) => void) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (albumData: { name: string; description?: string }) => {
      const response = await fetch(`/api/events/${eventId}/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle plan limit errors
        if (data.requiresUpgrade) {
          const error = new Error(data.error || 'Failed to create album') as any
          error.requiresUpgrade = true
          error.suggestedPlan = data.suggestedPlan
          error.currentLimit = data.currentLimit
          throw error
        }
        throw new Error(data.error || 'Failed to create album')
      }
      
      return data.album
    },
    onMutate: async (albumData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: albumKeys.list(eventId) })
      
      // Snapshot the previous value
      const previousAlbums = queryClient.getQueryData<{ albums: any[] }>(
        albumKeys.list(eventId)
      )
      
      // Optimistically update to the new value
      if (previousAlbums) {
        const optimisticAlbum = {
          id: `temp-${Date.now()}`, // Temporary ID
          name: albumData.name,
          description: albumData.description || null,
          isDefault: false,
          sortOrder: previousAlbums.albums.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true // Mark as optimistic
        }
        
        const updatedAlbums = {
          ...previousAlbums,
          albums: [...previousAlbums.albums, optimisticAlbum].sort((a, b) => a.sortOrder - b.sortOrder)
        }
        
        queryClient.setQueryData(albumKeys.list(eventId), updatedAlbums)
        
        // Notify callback of optimistic change for immediate UI update
        if (onAlbumsChange) {
          onAlbumsChange(updatedAlbums.albums)
        }
      }
      
      return { previousAlbums }
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousAlbums) {
        queryClient.setQueryData(albumKeys.list(eventId), context.previousAlbums)
        
        // Revert callback change
        if (onAlbumsChange) {
          onAlbumsChange(context.previousAlbums.albums)
        }
      }
      
      // Don't show generic error toast for plan limit errors
      if (!(err as any).requiresUpgrade) {
        toast.error('Failed to create album')
      }
    },
    onSuccess: (newAlbum) => {
      // Replace optimistic entry with real data
      const currentData = queryClient.getQueryData<{ albums: any[] }>(
        albumKeys.list(eventId)
      )
      
      if (currentData) {
        const updatedAlbums = {
          ...currentData,
          albums: currentData.albums
            .filter(album => !album._isOptimistic) // Remove optimistic entries
            .concat(newAlbum) // Add real album
            .sort((a, b) => a.sortOrder - b.sortOrder)
        }
        
        queryClient.setQueryData(albumKeys.list(eventId), updatedAlbums)
        
        // Notify callback of the change
        if (onAlbumsChange) {
          onAlbumsChange(updatedAlbums.albums)
        }
      }
      
      toast.success('Album created successfully!')
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: albumKeys.list(eventId) })
    },
  })
}

// Hook to get collaborators data (prefetched)
export function useCollaboratorsData(eventId: string) {
  return useQuery({
    queryKey: collaboratorKeys.organization(eventId),
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/organization`)
      if (!response.ok) throw new Error('Failed to fetch collaborators data')
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook to track collaborator changes and update onboarding progress
export function useCollaboratorProgress(eventId: string) {
  const queryClient = useQueryClient()
  const updateProgress = useUpdateOnboardingProgress(eventId)
  
  return useMutation({
    mutationFn: async () => {
      // Get current collaborator data to calculate progress
      const collaboratorsData = queryClient.getQueryData<any>(
        collaboratorKeys.organization(eventId)
      )
      
      if (collaboratorsData?.success) {
        const memberCount = collaboratorsData.members?.length || 0
        const invitationCount = collaboratorsData.invitations?.length || 0
        const totalCollaborators = memberCount + invitationCount
        
        // Update onboarding progress if collaborators were added
        if (totalCollaborators > 1) {
          return updateProgress.mutateAsync({ collaboratorsInvited: totalCollaborators - 1 })
        }
      }
      
      return Promise.resolve()
    },
    onSuccess: () => {
      // Refetch collaborators data to ensure consistency
      queryClient.invalidateQueries({ queryKey: collaboratorKeys.organization(eventId) })
    }
  })
}

// Hook to update test image progress when uploads complete
export function useTestImageProgress(eventId: string) {
  const queryClient = useQueryClient()
  const updateProgress = useUpdateOnboardingProgress(eventId)
  
  return useMutation({
    mutationFn: async (uploadCount: number) => {
      await updateProgress.mutateAsync({
        testImagesUploaded: true,
        testImageCount: uploadCount
      })
      
      // Invalidate onboarding state to trigger completion check
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state(eventId) })
    }
  })
}