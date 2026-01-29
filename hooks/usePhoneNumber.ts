import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phoneNumberService, PhoneNumber, CreatePhoneNumberData } from '@/services/phoneNumber.service';
import { toast } from 'sonner';

/**
 * Get all phone numbers for organization (with pagination)
 */
export function usePhoneNumbers(cursor?: string, pageSize: number = 30) {
  return useQuery<{ phone_numbers: PhoneNumber[]; cursor: string | null }>({
    queryKey: ['phone-numbers', cursor, pageSize],
    queryFn: async () => {
      console.log('🔄 [usePhoneNumbers] Fetching phone numbers...');
      try {
        const result = await phoneNumberService.getAll(cursor, pageSize);
        console.log('✅ [usePhoneNumbers] Fetched phone numbers:', result);
        return result;
      } catch (error: any) {
        console.error('❌ [usePhoneNumbers] Error fetching phone numbers:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Get phone numbers list (simplified - returns just the array)
 */
export function usePhoneNumbersList() {
  const { data, ...rest } = usePhoneNumbers();
  return {
    ...rest,
    data: data?.phone_numbers || []
  };
}

/**
 * Get single phone number by ID
 */
export function usePhoneNumber(phoneNumberId: string | null) {
  return useQuery({
    queryKey: ['phone-number', phoneNumberId],
    queryFn: () => phoneNumberService.getById(phoneNumberId!),
    enabled: !!phoneNumberId,
  });
}

/**
 * Create phone number mutation
 */
export function useCreatePhoneNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePhoneNumberData) => phoneNumberService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
      toast.success('Phone number created successfully');
    },
    onError: (error: any) => {
      console.error('❌ [useCreatePhoneNumber] Error:', error);
      toast.error(error.message || 'Failed to create phone number');
    },
  });
}

/**
 * Delete phone number mutation
 */
export function useDeletePhoneNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phoneNumberId: string) => phoneNumberService.delete(phoneNumberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
      toast.success('Phone number deleted successfully');
    },
    onError: (error: any) => {
      console.error('❌ [useDeletePhoneNumber] Error:', error);
      toast.error(error.message || 'Failed to delete phone number');
    },
  });
}
