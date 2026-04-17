import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { PredictionForm } from './components/Form/PredictionForm';
import { ResultCard } from './components/Result/ResultCard';
import { usePredictPrice } from './hooks/usePrediction';

const queryClient = new QueryClient();

const AppContent = () => {
  const { mutate: predictPrice, isPending } = usePredictPrice();
  const [predictionResult, setPredictionResult] = useState(null);

  const onSubmit = (data) => {
    // Transform back mapped names if needed. Zod already gives numbers
    predictPrice(data, {
      onSuccess: (resData) => {
        setPredictionResult(resData);
      },
      onError: (err) => {
        console.error("Prediction failed:", err);
        alert("Failed to get prediction: " + (err.response?.data?.error || err.message));
      }
    });
  };

  return (
    <Layout>
      <PredictionForm onSubmit={onSubmit} isLoading={isPending} />
      <ResultCard result={predictionResult} />
    </Layout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
