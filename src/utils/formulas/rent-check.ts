import { failure, nonNegative, percentage, positive, success, validate } from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

/**
 * Alquiler vs facturación (manual, Unidad 3 — "El alquiler").
 * El alquiler no debería superar el 10 % de la facturación neta; 5 % es la situación óptima.
 */
export const OPTIMAL_RENT_SHARE = 5;
export const MAX_RENT_SHARE = 10;

export type RentStatus = 'optimal' | 'acceptable' | 'too-high';

export interface RentCheckInput {
  rent: number | null;
  netSales: number | null;
}

export interface RentCheckOutput {
  rentShare: number;
  status: RentStatus;
  salesForMaxShare: number;
  salesForOptimalShare: number;
}

export type RentCheckField = keyof RentCheckInput;

export const rentStatus = (rentShare: number): RentStatus => {
  if (rentShare <= OPTIMAL_RENT_SHARE) {
    return 'optimal';
  }
  return rentShare <= MAX_RENT_SHARE ? 'acceptable' : 'too-high';
};

export const calculateRentCheck = (
  input: RentCheckInput,
): CalculationResult<RentCheckOutput, RentCheckField> => {
  const { errors, values: v } = validate(input, { rent: [nonNegative], netSales: [positive] });
  if (errors.length > 0) {
    return failure(errors);
  }

  const rentShare = percentage(v.rent, v.netSales);
  const salesForMaxShare = (v.rent * 100) / MAX_RENT_SHARE;
  const salesForOptimalShare = (v.rent * 100) / OPTIMAL_RENT_SHARE;

  return success(
    { rentShare, status: rentStatus(rentShare), salesForMaxShare, salesForOptimalShare },
    [
      { id: 'rent-share', values: { rent: v.rent, netSales: v.netSales, rentShare } },
      {
        id: 'sales-for-max-share',
        values: { rent: v.rent, maxShare: MAX_RENT_SHARE, salesForMaxShare },
      },
      {
        id: 'sales-for-optimal-share',
        values: { rent: v.rent, optimalShare: OPTIMAL_RENT_SHARE, salesForOptimalShare },
      },
    ],
  );
};
