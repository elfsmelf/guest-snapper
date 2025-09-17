"use client"

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MARKETING_CATEGORIES, type MarketingCategory } from '@/lib/r2/client'

interface MarketingAsset {
  key: string
  fileName: string
  url: string
  size: number
  lastModified: string | null
  category: string
}

interface MarketingContent {
  categories: string[]
  content: Record<string, MarketingAsset[]>
  totalObjects: number
}

// Fetch marketing content
async function fetchMarketingContent(category?: string): Promise<MarketingContent> {
  const url = category ? `/api/marketing/list?category=${category}` : '/api/marketing/list'
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch marketing content')
  }

  return response.json()
}

// Upload marketing asset
async function uploadMarketingAsset(file: File, category: MarketingCategory): Promise<string> {
  // Step 1: Get presigned URL
  const uploadResponse = await fetch('/api/marketing/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      category
    })
  })

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json()
    throw new Error(error.error || 'Failed to get upload URL')
  }

  const { uploadUrl, key } = await uploadResponse.json()

  // Step 2: Upload file to R2
  const uploadFileResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    }
  })

  if (!uploadFileResponse.ok) {
    throw new Error('Failed to upload file')
  }

  return key
}

// Delete marketing asset
async function deleteMarketingAsset(key: string): Promise<void> {
  const response = await fetch('/api/marketing/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete asset')
  }
}

// Hook for marketing content management
export function useMarketingContent(category?: string) {
  const queryClient = useQueryClient()

  // Query for fetching content
  const {
    data: content,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['marketing-content', category],
    queryFn: () => fetchMarketingContent(category),
    staleTime: 30000, // 30 seconds
  })

  // Mutation for uploading assets
  const uploadMutation = useMutation({
    mutationFn: ({ file, category }: { file: File; category: MarketingCategory }) =>
      uploadMarketingAsset(file, category),
    onSuccess: () => {
      toast.success('Marketing asset uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['marketing-content'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload marketing asset')
    }
  })

  // Mutation for deleting assets
  const deleteMutation = useMutation({
    mutationFn: deleteMarketingAsset,
    onSuccess: () => {
      toast.success('Marketing asset deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['marketing-content'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete marketing asset')
    }
  })

  const uploadAsset = useCallback((file: File, category: MarketingCategory) => {
    uploadMutation.mutate({ file, category })
  }, [uploadMutation])

  const deleteAsset = useCallback((key: string) => {
    if (window.confirm('Are you sure you want to delete this marketing asset?')) {
      deleteMutation.mutate(key)
    }
  }, [deleteMutation])

  return {
    content,
    isLoading,
    error,
    refetch,
    uploadAsset,
    deleteAsset,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    categories: Object.values(MARKETING_CATEGORIES) as MarketingCategory[]
  }
}