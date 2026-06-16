import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService } from '@/services/contact.service';

export function useContacts(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactService.getAll(params),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactService.getById(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; phone: string; subject: string; message: string }) =>
      contactService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useAssignAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      contactService.assignAgent(id, agentId),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: ['contact', id] }),
  });
}

export function useTriggerCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      contactService.triggerCall(id, agentId),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: ['contact', id] }),
  });
}

export function useUpdateResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      contactService.updateResponse(id, response),
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: ['contact', id] }),
  });
}
