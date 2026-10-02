import { failure, positive, success, sum } from '@utils/calculation';
import type { CalculationResult, FieldError } from '@utils/calculation';

/** Reglas de Omnes: proporcionalidad, zonas 25/50/25, adecuación ±10 % y sugerencia en la zona media. */
export const MAX_PRICE_RATIO = 3;
export const IDEAL_PRICE_RATIO = 2;
export const TICKET_TOLERANCE = 0.1;

export interface OmnesInput {
  prices: number[];
  averageTicket?: number | null;
  dailySpecialPrice?: number | null;
}

export type PriceZone = 'low' | 'medium' | 'high';
export type ProportionalityStatus = 'ideal' | 'acceptable' | 'too-wide';
export type TicketStatus = 'balanced' | 'too-expensive' | 'too-cheap';

export interface OmnesOutput {
  minPrice: number;
  maxPrice: number;
  priceRatio: number;
  proportionality: ProportionalityStatus;
  zoneWidth: number;
  lowZoneMax: number;
  mediumZoneMax: number;
  counts: Record<PriceZone, number>;
  balancedDistribution: boolean;
  averagePrice: number;
  ticket: { lowerBound: number; upperBound: number; status: TicketStatus | null };
  dailySpecialZone: PriceZone | null;
}

export type OmnesField = 'prices' | 'averageTicket' | 'dailySpecialPrice';

export const priceZone = (price: number, lowZoneMax: number, mediumZoneMax: number): PriceZone => {
  if (price <= lowZoneMax) {
    return 'low';
  }

  return price <= mediumZoneMax ? 'medium' : 'high';
};

export const ticketStatus = (averageTicket: number, averagePrice: number): TicketStatus => {
  if (averageTicket < averagePrice * (1 - TICKET_TOLERANCE)) {
    return 'too-expensive';
  }

  if (averageTicket > averagePrice * (1 + TICKET_TOLERANCE)) {
    return 'too-cheap';
  }

  return 'balanced';
};

export const calculateOmnesRules = (
  input: OmnesInput,
): CalculationResult<OmnesOutput, OmnesField> => {
  const errors: FieldError<OmnesField>[] = [];
  if (input.prices.length < 2) {
    errors.push({ field: 'prices', code: 'needs-at-least-two' });
  } else if (input.prices.some((price) => positive(price) !== null)) {
    errors.push({ field: 'prices', code: 'must-be-positive' });
  }

  const { averageTicket, dailySpecialPrice } = input;
  if (averageTicket !== null && averageTicket !== undefined && !(averageTicket > 0)) {
    errors.push({ field: 'averageTicket', code: 'must-be-positive' });
  }

  if (dailySpecialPrice !== null && dailySpecialPrice !== undefined && !(dailySpecialPrice > 0)) {
    errors.push({ field: 'dailySpecialPrice', code: 'must-be-positive' });
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const minPrice = Math.min(...input.prices);
  const maxPrice = Math.max(...input.prices);
  const priceRatio = maxPrice / minPrice;
  const proportionality: ProportionalityStatus =
    priceRatio <= IDEAL_PRICE_RATIO
      ? 'ideal'
      : priceRatio <= MAX_PRICE_RATIO
        ? 'acceptable'
        : 'too-wide';
  const zoneWidth = (maxPrice - minPrice) / 3;
  const lowZoneMax = minPrice + zoneWidth;
  const mediumZoneMax = lowZoneMax + zoneWidth;
  const counts: Record<PriceZone, number> = { low: 0, medium: 0, high: 0 };
  for (const price of input.prices) {
    counts[priceZone(price, lowZoneMax, mediumZoneMax)] += 1;
  }
  const balancedDistribution =
    counts.medium === counts.low + counts.high && counts.low === counts.high;
  const averagePrice = sum(input.prices) / input.prices.length;
  const ticket = {
    lowerBound: averagePrice * (1 - TICKET_TOLERANCE),
    upperBound: averagePrice * (1 + TICKET_TOLERANCE),
    status: averageTicket ? ticketStatus(averageTicket, averagePrice) : null,
  };
  const dailySpecialZone = dailySpecialPrice
    ? priceZone(dailySpecialPrice, lowZoneMax, mediumZoneMax)
    : null;

  return success(
    {
      minPrice,
      maxPrice,
      priceRatio,
      proportionality,
      zoneWidth,
      lowZoneMax,
      mediumZoneMax,
      counts,
      balancedDistribution,
      averagePrice,
      ticket,
      dailySpecialZone,
    },
    [
      { id: 'price-ratio', values: { maxPrice, minPrice, priceRatio } },
      { id: 'zone-width', values: { maxPrice, minPrice, zoneWidth } },
      { id: 'zones', values: { minPrice, lowZoneMax, mediumZoneMax, maxPrice } },
      { id: 'distribution', values: { low: counts.low, medium: counts.medium, high: counts.high } },
      {
        id: 'average-price',
        values: { total: sum(input.prices), count: input.prices.length, averagePrice },
      },
      {
        id: 'ticket-range',
        values: { averagePrice, lowerBound: ticket.lowerBound, upperBound: ticket.upperBound },
      },
    ],
  );
};
