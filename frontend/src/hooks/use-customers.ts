import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CreateCustomerPayload } from '@/services/customer.service';
import { Customer } from '@/types';
import { toast } from 'sonner';

export function useCustomers(organizationId: string, page = 1, limit = 10) {
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customers', organizationId, page, limit],
    queryFn: () => customerService.getAll(organizationId, page, limit),
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customerService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
      toast.success('Customer added');
    },
  });

  const uploadCsvMutation = useMutation({
    mutationFn: ({ file, organizationId }: { file: File; organizationId: string }) =>
      customerService.uploadCsv(file, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers', organizationId] });
      toast.success(`Successfully imported ${data.imported} customers`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload CSV');
    },
  });

  return {
    customers: (customersQuery.data?.data || []) as Customer[],
    meta: customersQuery.data?.meta,
    isLoading: customersQuery.isLoading,
    createCustomer: createMutation.mutate,
    isCreating: createMutation.isPending,
    uploadCsv: uploadCsvMutation.mutate,
    isUploading: uploadCsvMutation.isPending,
  };
}
