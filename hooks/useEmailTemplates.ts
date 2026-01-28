import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailTemplateService, EmailTemplate, CreateEmailTemplateData } from '@/services/emailTemplate.service';
import { toast } from 'sonner';

export function useEmailTemplates() {
  return useQuery<EmailTemplate[]>({
    queryKey: ['emailTemplates'],
    queryFn: () => emailTemplateService.getAll(),
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation<EmailTemplate, Error, CreateEmailTemplateData>({
    mutationFn: (newTemplate: CreateEmailTemplateData) => emailTemplateService.create(newTemplate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('Email template created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create email template: ${error.message}`);
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (templateId: string) => emailTemplateService.delete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('Email template deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete email template: ${error.message}`);
    },
  });
}

