import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { conversationService, ConversationFilters, SendMessageData } from '@/services/conversation.service';
import { toast } from 'sonner';

/**
 * Fetch all conversations with filters
 */
export function useConversations(filters?: ConversationFilters) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => conversationService.getAll(filters),
    staleTime: 0,          // Always treat data as stale so refetch fires on focus/mount
    refetchInterval: 15000, // Poll every 15 s as a fallback when WebSocket is unavailable
    refetchIntervalInBackground: false, // Only poll while the tab is active
  });
}

/**
 * Fetch conversations with infinite scroll
 */
export function useInfiniteConversations(filters?: ConversationFilters) {
  return useInfiniteQuery({
    queryKey: ['conversations', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      conversationService.getAll({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.pagination?.hasNext) {
        return pages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Fetch single conversation by ID
 */
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationService.getById(conversationId!),
    enabled: !!conversationId,
  });
}

/**
 * Fetch messages for a conversation
 */
export function useConversationMessages(conversationId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['conversation', conversationId, 'messages', page],
    queryFn: () => conversationService.getMessages(conversationId, page, limit),
    enabled: !!conversationId,
  });
}

/**
 * Get conversation statistics
 */
export function useConversationStats() {
  return useQuery({
    queryKey: ['conversations', 'stats'],
    queryFn: () => conversationService.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Search messages across conversations
 */
export function useSearchMessages(query: string, filters?: ConversationFilters) {
  return useQuery({
    queryKey: ['conversations', 'search', query, filters],
    queryFn: () => conversationService.searchMessages(query, filters),
    enabled: query.length > 2, // Only search if query is at least 3 characters
  });
}

/**
 * Send message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: SendMessageData }) =>
      conversationService.sendMessage(conversationId, data),
    onSuccess: (message, variables) => {
      // Invalidate conversation messages
      queryClient.invalidateQueries({
        queryKey: ['conversation', variables.conversationId, 'messages'],
      });
      
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
}

/**
 * Take control mutation
 */
export function useTakeControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => conversationService.takeControl(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      toast.success('Manual control activated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to take control');
    },
  });
}

/**
 * Release control mutation
 */
export function useReleaseControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => conversationService.releaseControl(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      toast.success('Manual control released');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to release control');
    },
  });
}

/**
 * Update conversation status mutation
 */
export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, status }: { conversationId: string; status: string }) =>
      conversationService.updateStatus(conversationId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}

/**
 * Assign operator mutation
 */
export function useAssignOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, operatorId }: { conversationId: string; operatorId: string }) =>
      conversationService.assignOperator(conversationId, operatorId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Operator assigned');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign operator');
    },
  });
}

/**
 * Update labels mutation
 */
export function useUpdateConversationLabels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      add,
      remove,
    }: {
      conversationId: string;
      add?: string[];
      remove?: string[];
    }) => conversationService.updateLabels(conversationId, add, remove),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Labels updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update labels');
    },
  });
}

/**
 * Move to folder mutation
 */
export function useMoveToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, folderId }: { conversationId: string; folderId: string | null }) =>
      conversationService.moveToFolder(conversationId, folderId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation moved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to move conversation');
    },
  });
}

/**
 * Delete conversation mutation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => conversationService.delete(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete conversation');
    },
  });
}

/**
 * Bulk delete conversations mutation
 */
export function useBulkDeleteConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationIds: string[]) => conversationService.bulkDelete(conversationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversations deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete conversations');
    },
  });
}

/**
 * Add note mutation
 */
export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, note }: { conversationId: string; note: string }) =>
      conversationService.addNote(conversationId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      toast.success('Note added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add note');
    },
  });
}

