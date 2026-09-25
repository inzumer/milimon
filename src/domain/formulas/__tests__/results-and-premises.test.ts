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

describe('income-statement (manual, Unidad 4)', () => {
  const manual = {
    foodSales: 820_000,
    beverageSales: 298_000,
    foodCost: 200_000,
    beverageCost: 70_000,
    salaries: 57_000,
    socialCharges: 27_360,
    rent: 41_000,
    services: 13_000,
    generalExpenses: 90_000,
    amortization: 83_333,
    salesTaxes: 223_600,
    municipalFees: 2_284,
    incomeTaxRate: 35,
  };

  it('reproduces the manual statement', () => {
    const result = calculateIncomeStatement(manual);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.totalSales).toBe(1_118_000);
    expect(result.value.costOfSales).toBe(270_000);
    expect(result.value.operatingCosts).toBe(537_577);
    expect(result.value.fixedCosts).toBe(313_977);
    expect(result.value.resultBeforeIncomeTax).toBe(310_423);
    expect(result.value.incomeTax).toBeCloseTo(108_648.05, 2);
    expect(result.value.netResult).toBeCloseTo(201_774.95, 2);
  });

  it('charges no income tax on a loss', () => {
    const result = calculateIncomeStatement({ ...manual, foodSales: 100_000 });
    expect(result.ok && result.value.incomeTax).toBe(0);
    expect(result.ok && result.value.netResult).toBeLessThan(0);
  });

  it('validates the inputs', () => {
    expect(calculateIncomeStatement({ ...manual, rent: -1 }).ok).toBe(false);
  });
});

describe('break-even (manual, Unidad 4)', () => {
  const manual = {
    grossSales: 1_118_000,
    taxes: 332_248.05,
    variableCosts: 270_000,
    fixedCosts: 313_977,
    desiredProfitBeforeTax: 200_000,
  };

  it('computes the rates of the manual', () => {
    const result = calculateBreakEven(manual);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.netSales).toBeCloseTo(785_751.95, 2);
    expect(result.value.taxRate).toBeCloseTo(1.42, 2);
    expect(result.value.variableCostRate).toBeCloseTo(0.34, 2);
    expect(result.value.contributionRate).toBeCloseTo(0.66, 2);
  });

  it('uses full precision and the profit BEFORE income tax', () => {
    const result = calculateBreakEven(manual);
    if (!result.ok) {
      throw new Error('expected success');
    }
    expect(result.value.breakEvenNetSales).toBeCloseTo(478_346.31, 2);
    expect(result.value.targetNetSales).toBeCloseTo(783_047.8, 1);
    expect(result.value.targetGrossSales).toBeCloseTo(1_114_152.43, 2);
    expect(result.value.breakEvenGrossSales).toBeCloseTo(
      result.value.breakEvenNetSales * result.value.taxRate,
      6,
    );
  });

  it('reproduces the manual numbers when fed its rounded values (TC 0,66 and $ 130.000 net)', () => {
    expect(requiredNetSales(313_977, 0.66)).toBeCloseTo(475_722.73, 2);
    expect(requiredNetSales(313_977, 0.66, 130_000)).toBeCloseTo(672_692.42, 2);
    expect(requiredNetSales(313_977, 0.66, 130_000) * 1.42).toBeCloseTo(955_223.24, 2);
  });

  it('exposes the building blocks', () => {
    expect(taxRate(142, 100)).toBeCloseTo(1.42, 10);
    expect(variableCostRate(34, 100)).toBeCloseTo(0.34, 10);
    expect(contributionRate(0.34)).toBeCloseTo(0.66, 10);
  });

  it('rejects impossible inputs', () => {
    expect(calculateBreakEven({ ...manual, taxes: 1_118_000 })).toStrictEqual({
      ok: false,
      errors: [{ field: 'taxes', code: 'must-not-exceed-gross' }],
    });
    expect(calculateBreakEven({ ...manual, variableCosts: 800_000 })).toStrictEqual({
      ok: false,
      errors: [{ field: 'variableCosts', code: 'must-not-exceed-gross' }],
    });
    expect(calculateBreakEven({ ...manual, grossSales: null }).ok).toBe(false);
  });
});

describe('omnes-rules (manual: 16 tortas entre $ 40 y $ 115)', () => {
  const prices = [40, 50, 55, 65, 70, 72, 75, 78, 80, 85, 88, 90, 95, 100, 110, 115];

  it('computes zones of $ 25 with bounds 65 and 90, and a balanced 4 / 8 / 4 menu', () => {
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

  it('uses the manual ±10 % ticket thresholds (average $ 77,50 → 69,75 / 85,25)', () => {
    expect(ticketStatus(69, 77.5)).toBe('too-expensive');
    expect(ticketStatus(86, 77.5)).toBe('too-cheap');
    expect(ticketStatus(77.5, 77.5)).toBe('balanced');
  });

  it('classifies prices by zone and proportionality', () => {
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

  it('validates the inputs', () => {
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

describe('floor-area (manual, Unidad 7)', () => {
  it('computes 1,32 m² per customer and 26,4 m² (27 m²) for 20 covers', () => {
    const result = calculateFloorArea({
      areaPerCustomer: 1.1,
      circulationPercentage: 20,
      customers: 20,
    });
    expect(result.ok && result.value.areaPerCustomerWithCirculation).toBeCloseTo(1.32, 10);
    expect(result.ok && result.value.requiredArea).toBeCloseTo(26.4, 10);
    expect(result.ok && result.value.requiredAreaRounded).toBe(27);
  });

  it('computes seating capacity: 80 m² × 55 % = 44 m² → 33 covers at 1,30 m²', () => {
    const result = calculateSeatingCapacity({
      premisesArea: 80,
      diningSharePercentage: 55,
      areaPerCustomerWithCirculation: 1.3,
    });
    expect(result.ok && result.value.diningArea).toBeCloseTo(44, 10);
    expect(result.ok && result.value.capacity).toBeCloseTo(33.85, 2);
    expect(result.ok && result.value.capacityRounded).toBe(33);
  });

  it('validates the inputs', () => {
    expect(
      calculateFloorArea({ areaPerCustomer: 1.1, circulationPercentage: 120, customers: 0 }).ok,
    ).toBe(false);
    expect(
      calculateSeatingCapacity({
        premisesArea: 80,
        diningSharePercentage: 0,
        areaPerCustomerWithCirculation: 1.3,
      }).ok,
    ).toBe(false);
  });
});

describe('rent-check (manual: ≤ 10 %, óptimo 5 %)', () => {
  it('evaluates the rent share of net sales', () => {
    const result = calculateRentCheck({ rent: 41_000, netSales: 785_751.95 });
    expect(result.ok && result.value.rentShare).toBeCloseTo(5.22, 2);
    expect(result.ok && result.value.status).toBe('acceptable');
    expect(result.ok && result.value.salesForMaxShare).toBe(410_000);
    expect(result.ok && result.value.salesForOptimalShare).toBe(820_000);
  });

  it('classifies the share', () => {
    expect(rentStatus(5)).toBe('optimal');
    expect(rentStatus(10)).toBe('acceptable');
    expect(rentStatus(10.1)).toBe('too-high');
  });

  it('validates the inputs', () => {
    expect(calculateRentCheck({ rent: 1, netSales: 0 }).ok).toBe(false);
  });
});
