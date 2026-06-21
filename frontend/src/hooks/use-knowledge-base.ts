import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import { useAuth } from '@/hooks/useAuth';

export function useKnowledgeBase() {
  const { user } = useAuth();
  const orgId = user?.organizationId || '';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['knowledge-base', orgId],
    queryFn: async () => {
      const res = await api.get(`/knowledge-base?organizationId=${orgId}`);
      return res.data;
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/knowledge-base', { ...data, organizationId: orgId });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base', orgId] }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', orgId!);
      const res = await api.post('/knowledge-base/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base', orgId] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/knowledge-base/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base', orgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/knowledge-base/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base', orgId] }),
  });

  const testRAGMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await api.post('/knowledge-base/test-rag', { organizationId: orgId, question });
      return res.data; // { answer: string, sources: any[] }
    },
  });

  return {
    knowledgeItems: query.data || [],
    isLoading: query.isLoading,
    createItem: createMutation.mutateAsync,
    uploadFile: uploadMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    testRAG: testRAGMutation.mutateAsync,
    isTestingRAG: testRAGMutation.isPending,
  };
}
