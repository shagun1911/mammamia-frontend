import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeBaseService, CreateFAQData, CreateWebsiteData } from '@/services/knowledgeBase.service';
import { KnowledgeBaseItem } from '@/contexts/KnowledgeBaseContext';
import { toast } from 'sonner';

/**
 * Get all knowledge bases
 */
export function useKnowledgeBases() {
  return useQuery<KnowledgeBaseItem[]>({
    queryKey: ['knowledge-bases'],
    queryFn: async () => {
      console.log('🔄 [useKnowledgeBases] Fetching knowledge bases...');
      try {
        const result = await knowledgeBaseService.getAll();
        console.log('✅ [useKnowledgeBases] Fetched knowledge bases:', result);
        console.log('✅ [useKnowledgeBases] Result type:', typeof result);
        console.log('✅ [useKnowledgeBases] Is array:', Array.isArray(result));
        console.log('✅ [useKnowledgeBases] Length:', Array.isArray(result) ? result.length : 'N/A');
        return result || []; // Ensure we always return an array
      } catch (error: any) {
        console.error('❌ [useKnowledgeBases] Error fetching knowledge bases:', error);
        console.error('❌ [useKnowledgeBases] Error details:', error?.response?.data || error?.message);
        throw error; // Re-throw to let React Query handle it
      }
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache empty results (gcTime replaced cacheTime in React Query v5)
    retry: 1, // Retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });
}

/**
 * Get single knowledge base by ID
 */
export function useKnowledgeBase(id: string | null) {
  return useQuery({
    queryKey: ['knowledge-base', id],
    queryFn: () => knowledgeBaseService.getById(id!),
    enabled: !!id,
  });
}

// ============ FAQs ============

/**
 * Get all FAQs for a knowledge base
 */
export function useFAQs(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: ['faqs', knowledgeBaseId],
    queryFn: () => knowledgeBaseService.getFAQs(knowledgeBaseId!),
    enabled: !!knowledgeBaseId,
  });
}

/**
 * Create FAQ mutation
 */
export function useCreateFAQ(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFAQData) => knowledgeBaseService.createFAQ(knowledgeBaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', knowledgeBaseId] });
      toast.success('FAQ created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create FAQ');
    },
  });
}

/**
 * Update FAQ mutation
 */
export function useUpdateFAQ(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ faqId, data }: { faqId: string; data: Partial<CreateFAQData> }) =>
      knowledgeBaseService.updateFAQ(knowledgeBaseId, faqId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', knowledgeBaseId] });
      toast.success('FAQ updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update FAQ');
    },
  });
}

/**
 * Delete FAQ mutation
 */
export function useDeleteFAQ(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faqId: string) => knowledgeBaseService.deleteFAQ(knowledgeBaseId, faqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', knowledgeBaseId] });
      toast.success('FAQ deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete FAQ');
    },
  });
}

/**
 * Import FAQs from CSV
 */
export function useImportFAQs(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => knowledgeBaseService.importFAQs(knowledgeBaseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', knowledgeBaseId] });
      toast.success('FAQs imported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import FAQs');
    },
  });
}

// ============ Websites ============

/**
 * Get all websites for a knowledge base
 */
export function useWebsites(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: ['websites', knowledgeBaseId],
    queryFn: () => knowledgeBaseService.getWebsites(knowledgeBaseId!),
    enabled: !!knowledgeBaseId,
  });
}

/**
 * Add website mutation
 */
export function useAddWebsite(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWebsiteData) => knowledgeBaseService.addWebsite(knowledgeBaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites', knowledgeBaseId] });
      toast.success('Website added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add website');
    },
  });
}

/**
 * Remove website mutation
 */
export function useRemoveWebsite(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (websiteId: string) => knowledgeBaseService.removeWebsite(knowledgeBaseId, websiteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites', knowledgeBaseId] });
      toast.success('Website removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove website');
    },
  });
}

/**
 * Resync website mutation
 */
export function useResyncWebsite(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (websiteId: string) => knowledgeBaseService.resyncWebsite(knowledgeBaseId, websiteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites', knowledgeBaseId] });
      toast.success('Website resyncing...');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resync website');
    },
  });
}

// ============ Files ============

/**
 * Get all files for a knowledge base
 */
export function useFiles(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: ['files', knowledgeBaseId],
    queryFn: () => knowledgeBaseService.getFiles(knowledgeBaseId!),
    enabled: !!knowledgeBaseId,
  });
}

/**
 * Upload file mutation
 */
export function useUploadFile(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => knowledgeBaseService.uploadFile(knowledgeBaseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', knowledgeBaseId] });
      toast.success('File uploaded');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });
}

/**
 * Delete file mutation
 */
export function useDeleteFile(knowledgeBaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => knowledgeBaseService.deleteFile(knowledgeBaseId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', knowledgeBaseId] });
      toast.success('File deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });
}

