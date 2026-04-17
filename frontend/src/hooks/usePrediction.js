import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const usePredictPrice = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/predict', data);
      return response.data;
    },
  });
};
