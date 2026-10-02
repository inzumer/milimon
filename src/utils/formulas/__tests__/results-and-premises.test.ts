import {
  calculateBreakEven,
  contributionRate,
  requiredNetSales,
  taxRate,
  variableCostRate,
} from '../break-even';
import { calculateFloorArea, calculateSeatingCapacity } from '../floor-area';
import { calculateIncomeStatement } from '../income-statement';
import { calculateOmnesRules, priceZone, ticketStatus } from '../omnes-rules';
import { calculateRentCheck, rentStatus } from '../rent-check';

describe('income-statement (the café example)', () => {
  const cafe = {
    foodSales: 1_150_000,
    beverageSales: 420_000,
    foodCost: 330_000,
    beverageCost: 110_000,
    salaries: 95_000,
    socialCharges: 42_750,
    rent: 60_000,
    services: 22_000,
    generalExpenses: 70_000,
    amortization: 100_000,
    salesTaxes: 314_000,
    municipalFees: 3_100,
    incomeTaxRate: 35,
  };

  it('should build the statement', () => {
    const result = calculateIncomeStatement(cafe);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.totalSales).toBe(1_570_000);
    expect(result.value.costOfSales).toBe(440_000);
    expect(result.value.operatingCosts).toBe(706_850);
    expect(result.value.fixedCosts).toBe(392_850);
    expect(result.value.resultBeforeIncomeTax).toBe(423_150);
    expect(result.value.incomeTax).toBeCloseTo(148_102.5, 2);
    expect(result.value.netResult).toBeCloseTo(275_047.5, 2);
  });

  it('should charge no income tax on a loss', () => {
    const result = calculateIncomeStatement({ ...cafe, foodSales: 100_000 });
    expect(result.ok && result.value.incomeTax).toBe(0);
    expect(result.ok && result.value.netResult).toBeLessThan(0);
  });

  it('should validate the inputs', () => {
    expect(calculateIncomeStatement({ ...cafe, rent: -1 }).ok).toBe(false);
  });
});

describe('break-even (the café example)', () => {
  const cafe = {
    grossSales: 1_570_000,
    taxes: 462_102.5,
    variableCosts: 440_000,
    fixedCosts: 392_850,
    desiredProfitBeforeTax: 307_692.31,
  };

  it('should compute the rates', () => {
    const result = calculateBreakEven(cafe);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.netSales).toBeCloseTo(1_107_897.5, 2);
    expect(result.value.taxRate).toBeCloseTo(1.4171, 4);
    expect(result.value.variableCostRate).toBeCloseTo(0.3971, 4);
    expect(result.value.contributionRate).toBeCloseTo(0.6029, 4);
  });

  it('should use full precision and the profit BEFORE income tax', () => {
    const result = calculateBreakEven(cafe);
    if (!result.ok) {
      throw new Error('expected success');
    }

    expect(result.value.breakEvenNetSales).toBeCloseTo(651_653.18, 1);
    expect(result.value.targetNetSales).toBeCloseTo(1_162_048.18, 1);
    expect(result.value.targetGrossSales).toBeCloseTo(1_646_736.85, 1);
    expect(result.value.breakEvenGrossSales).toBeCloseTo(
      result.value.breakEvenNetSales * result.value.taxRate,
      6,
    );
  });

  it('should show how rounded rates change the result (contribution 0,60, tax rate 1,42)', () => {
    expect(requiredNetSales(392_850, 0.6)).toBeCloseTo(654_750, 2);
    expect(requiredNetSales(392_850, 0.6, 307_692.31)).toBeCloseTo(1_167_570.52, 2);
    expect(requiredNetSales(392_850, 0.6, 307_692.31) * 1.42).toBeCloseTo(1_657_950.13, 1);
  });

  it('should expose the building blocks', () => {
    expect(taxRate(142, 100)).toBeCloseTo(1.42, 10);
    expect(variableCostRate(34, 100)).toBeCloseTo(0.34, 10);
    expect(contributionRate(0.34)).toBeCloseTo(0.66, 10);
  });

  it('should reject impossible inputs', () => {
    expect(calculateBreakEven({ ...cafe, taxes: 1_570_000 })).toStrictEqual({
      ok: false,
      errors: [{ field: 'taxes', code: 'must-not-exceed-gross' }],
    });
    expect(calculateBreakEven({ ...cafe, variableCosts: 1_200_000 })).toStrictEqual({
      ok: false,
      errors: [{ field: 'variableCosts', code: 'must-not-exceed-gross' }],
    });
    expect(calculateBreakEven({ ...cafe, grossSales: null }).ok).toBe(false);
  });
});

describe('omnes-rules (16 cakes between $ 40 and $ 115)', () => {
  const prices = [40, 50, 55, 65, 70, 72, 75, 78, 80, 85, 88, 90, 95, 100, 110, 115];

  it('should compute zones of $ 25 with bounds 65 and 90, and a balanced 4 / 8 / 4 menu', () => {
    const result = calculateOmnesRules({ prices, averageTicket: 80, dailySpecialPrice: 75 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.zoneWidth).toBe(25);
    expect(result.value.lowZoneMax).toBe(65);
    expect(result.value.mediumZoneMax).toBe(90);
    expect(result.value.counts).toStrictEqual({ low: 4, medium: 8, high: 4 });
    expect(result.value.balancedDistribution).toBe(true);
    expect(result.value.priceRatio).toBeCloseTo(2.875, 10);
    expect(result.value.proportionality).toBe('acceptable');
    expect(result.value.ticket.status).toBe('balanced');
    expect(result.value.dailySpecialZone).toBe('medium');
  });

  it('should use ±10 % ticket thresholds (average $ 77,50 → 69,75 / 85,25)', () => {
    expect(ticketStatus(69, 77.5)).toBe('too-expensive');
    expect(ticketStatus(86, 77.5)).toBe('too-cheap');
    expect(ticketStatus(77.5, 77.5)).toBe('balanced');
  });

  it('should classify prices by zone and proportionality', () => {
    expect(priceZone(65, 65, 90)).toBe('low');
    expect(priceZone(65.01, 65, 90)).toBe('medium');
    expect(priceZone(90.01, 65, 90)).toBe('high');
    const ideal = calculateOmnesRules({ prices: [50, 90] });
    expect(ideal.ok && ideal.value.proportionality).toBe('ideal');
    expect(ideal.ok && ideal.value.ticket.status).toBeNull();
    expect(ideal.ok && ideal.value.dailySpecialZone).toBeNull();
    const wide = calculateOmnesRules({ prices: [10, 40] });
    expect(wide.ok && wide.value.proportionality).toBe('too-wide');
    expect(wide.ok && wide.value.balancedDistribution).toBe(false);
  });

  it('should validate the inputs', () => {
    expect(calculateOmnesRules({ prices: [10] })).toStrictEqual({
      ok: false,
      errors: [{ field: 'prices', code: 'needs-at-least-two' }],
    });
    expect(
      calculateOmnesRules({ prices: [10, 0], averageTicket: -1, dailySpecialPrice: 0 }),
    ).toStrictEqual({
      ok: false,
      errors: [
        { field: 'prices', code: 'must-be-positive' },
        { field: 'averageTicket', code: 'must-be-positive' },
        { field: 'dailySpecialPrice', code: 'must-be-positive' },
      ],
    });
  });
});

describe('floor-area (café with 32 covers)', () => {
  it('should compute 1,50 m² per customer and 48 m² for 32 covers', () => {
    const result = calculateFloorArea({
      areaPerCustomer: 1.25,
      circulationPercentage: 20,
      customers: 32,
    });
    expect(result.ok && result.value.areaPerCustomerWithCirculation).toBeCloseTo(1.5, 10);
    expect(result.ok && result.value.requiredArea).toBeCloseTo(48, 10);
    expect(result.ok && result.value.requiredAreaRounded).toBe(48);
  });

  it('should round the area up: 1,30 m² + 15 % for 25 covers = 37,375 m² → 38 m²', () => {
    const result = calculateFloorArea({
      areaPerCustomer: 1.3,
      circulationPercentage: 15,
      customers: 25,
    });
    expect(result.ok && result.value.requiredArea).toBeCloseTo(37.375, 10);
    expect(result.ok && result.value.requiredAreaRounded).toBe(38);
  });

  it('should compute seating capacity: 120 m² × 60 % = 72 m² → 48 covers at 1,50 m²', () => {
    const result = calculateSeatingCapacity({
      premisesArea: 120,
      diningSharePercentage: 60,
      areaPerCustomerWithCirculation: 1.5,
    });
    expect(result.ok && result.value.diningArea).toBeCloseTo(72, 10);
    expect(result.ok && result.value.capacityRounded).toBe(48);
  });

  it('should round the covers down: 100 m² × 50 % / 1,40 m² = 35,71 → 35', () => {
    const result = calculateSeatingCapacity({
      premisesArea: 100,
      diningSharePercentage: 50,
      areaPerCustomerWithCirculation: 1.4,
    });
    expect(result.ok && result.value.capacity).toBeCloseTo(35.71, 2);
    expect(result.ok && result.value.capacityRounded).toBe(35);
  });

  it('should validate the inputs', () => {
    expect(
      calculateFloorArea({ areaPerCustomer: 1.25, circulationPercentage: 120, customers: 0 }).ok,
    ).toBe(false);
    expect(
      calculateSeatingCapacity({
        premisesArea: 120,
        diningSharePercentage: 0,
        areaPerCustomerWithCirculation: 1.5,
      }).ok,
    ).toBe(false);
  });
});

describe('rent-check (≤ 10 %, optimal 5 %)', () => {
  it('should evaluate the rent share of net sales', () => {
    const result = calculateRentCheck({ rent: 60_000, netSales: 1_107_897.5 });
    expect(result.ok && result.value.rentShare).toBeCloseTo(5.42, 2);
    expect(result.ok && result.value.status).toBe('acceptable');
    expect(result.ok && result.value.salesForMaxShare).toBe(600_000);
    expect(result.ok && result.value.salesForOptimalShare).toBe(1_200_000);
  });

  it('should classify the share', () => {
    expect(rentStatus(5)).toBe('optimal');
    expect(rentStatus(10)).toBe('acceptable');
    expect(rentStatus(10.1)).toBe('too-high');
  });

  it('should validate the inputs', () => {
    expect(calculateRentCheck({ rent: 1, netSales: 0 }).ok).toBe(false);
  });
});
