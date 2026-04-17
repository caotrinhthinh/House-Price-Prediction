import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { predictionSchema } from '../../schemas/prediction.schema';
import { InputField } from './InputField';
import { Loader2 } from 'lucide-react';
import './PredictionForm.css';

const DEFAULT_VALUES = {
  OverallQual: 7,
  YearBuilt: 1999,
  YearRemodAdd: 2000,
  TotalBsmtSF: 856,
  '1stFlrSF': 856,
  '2ndFlrSF': 854,
  GrLivArea: 1710,
  FullBath: 2,
  TotRmsAbvGrd: 8,
  GarageCars: 2,
  GarageArea: 548,
};

export const PredictionForm = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(predictionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  return (
    <div className="glass-panel form-container animate-fade-in delay-1">
      <div className="form-header">
        <h2>Property Details</h2>
        <p>Enter the specifications of the house to get an AI-powered price estimate.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="form-grid">
          <InputField
            label="Overall Quality (1-10)"
            type="number"
            {...register('OverallQual')}
            error={errors.OverallQual}
          />
          <InputField
            label="Year Built"
            type="number"
            {...register('YearBuilt')}
            error={errors.YearBuilt}
          />
          <InputField
            label="Year Remodeled"
            type="number"
            {...register('YearRemodAdd')}
            error={errors.YearRemodAdd}
          />
          <InputField
            label="Total Basement (SqFt)"
            type="number"
            {...register('TotalBsmtSF')}
            error={errors.TotalBsmtSF}
          />
          <InputField
            label="1st Floor (SqFt)"
            type="number"
            {...register('1stFlrSF')}
            error={errors['1stFlrSF']}
          />
          <InputField
            label="2nd Floor (SqFt)"
            type="number"
            {...register('2ndFlrSF')}
            error={errors['2ndFlrSF']}
          />
          <InputField
            label="Above Grade Living Area"
            type="number"
            {...register('GrLivArea')}
            error={errors.GrLivArea}
          />
          <InputField
            label="Full Bathrooms"
            type="number"
            {...register('FullBath')}
            error={errors.FullBath}
          />
          <InputField
            label="Total Rooms Above Grade"
            type="number"
            {...register('TotRmsAbvGrd')}
            error={errors.TotRmsAbvGrd}
          />
          <InputField
            label="Garage Cars Capacity"
            type="number"
            {...register('GarageCars')}
            error={errors.GarageCars}
          />
          <InputField
            label="Garage Area (SqFt)"
            type="number"
            {...register('GarageArea')}
            error={errors.GarageArea}
          />
        </div>

        <div className="submit-area">
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLoading ? <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {isLoading ? 'Analyzing Data...' : 'Estimate Price'}
          </button>
        </div>
      </form>
    </div>
  );
};
