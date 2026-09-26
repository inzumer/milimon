import {
  atMostHundred,
  failure,
  nonNegative,
  positive,
  success,
  validate,
} from '@utils/calculation';
import type { CalculationResult } from '@utils/calculation';

/**
 * Superficie del salón (manual, Unidad 7 — "El tamaño del salón").
 * m² por cliente: entre 1,10 y 1,50, más 10–20 % de circulación.
 * m² necesarios = m² por cliente × (1 + % circulación) × cantidad de clientes.
 * Inversa: el salón ocupa ~55 % del local → cubiertos = superficie × 55 % / m² por cliente con circulación.
 *
 * Nota: el manual redondea (27 m² para 26,4 m²; "45 m²" para el 55 % de 80 m², que son 44 m²).
 * La calculadora muestra el valor exacto y redondea hacia arriba la superficie y hacia abajo los cubiertos.
 */
export const DEFAULT_DINING_SHARE = 60;

export interface FloorAreaInput {
  areaPerCustomer: number | null;
  circulationPercentage: number | null;
  customers: number | null;
}

export interface FloorAreaOutput {
  areaPerCustomerWithCirculation: number;
  requiredArea: number;
  requiredAreaRounded: number;
}

export type FloorAreaField = keyof FloorAreaInput;

export const areaWithCirculation = (
  areaPerCustomer: number,
  circulationPercentage: number,
): number => areaPerCustomer * (1 + circulationPercentage / 100);

export const calculateFloorArea = (
  input: FloorAreaInput,
): CalculationResult<FloorAreaOutput, FloorAreaField> => {
  const { errors, values: v } = validate(input, {
    areaPerCustomer: [positive],
    circulationPercentage: [nonNegative, atMostHundred],
    customers: [positive],
  });
  if (errors.length > 0) {
    return failure(errors);
  }

  const perCustomer = areaWithCirculation(v.areaPerCustomer, v.circulationPercentage);
  const requiredArea = perCustomer * v.customers;
  const requiredAreaRounded = Math.ceil(Number(requiredArea.toFixed(9)));

  return success(
    { areaPerCustomerWithCirculation: perCustomer, requiredArea, requiredAreaRounded },
    [
      {
        id: 'area-per-customer',
        values: {
          areaPerCustomer: v.areaPerCustomer,
          circulationPercentage: v.circulationPercentage,
          areaPerCustomerWithCirculation: perCustomer,
        },
      },
      {
        id: 'required-area',
        values: {
          areaPerCustomerWithCirculation: perCustomer,
          customers: v.customers,
          requiredArea,
        },
      },
    ],
  );
};

export interface SeatingCapacityInput {
  premisesArea: number | null;
  diningSharePercentage: number | null;
  areaPerCustomerWithCirculation: number | null;
}

export interface SeatingCapacityOutput {
  diningArea: number;
  capacity: number;
  capacityRounded: number;
}

export type SeatingCapacityField = keyof SeatingCapacityInput;

export const calculateSeatingCapacity = (
  input: SeatingCapacityInput,
): CalculationResult<SeatingCapacityOutput, SeatingCapacityField> => {
  const { errors, values: v } = validate(input, {
    premisesArea: [positive],
    diningSharePercentage: [positive, atMostHundred],
    areaPerCustomerWithCirculation: [positive],
  });
  if (errors.length > 0) {
    return failure(errors);
  }

  const diningArea = (v.premisesArea * v.diningSharePercentage) / 100;
  const capacity = diningArea / v.areaPerCustomerWithCirculation;
  const capacityRounded = Math.floor(Number(capacity.toFixed(9)));

  return success({ diningArea, capacity, capacityRounded }, [
    {
      id: 'dining-area',
      values: {
        premisesArea: v.premisesArea,
        diningSharePercentage: v.diningSharePercentage,
        diningArea,
      },
    },
    {
      id: 'capacity',
      values: {
        diningArea,
        areaPerCustomerWithCirculation: v.areaPerCustomerWithCirculation,
        capacity,
      },
    },
  ]);
};
