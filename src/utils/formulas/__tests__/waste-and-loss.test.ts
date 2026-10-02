import { calculateCleanPrice, equivalentCleanPrice } from '../clean-price';
import { calculateCookingLoss } from '../cooking-loss';
import { calculateGrossQuantity, grossByRuleOfThree, grossFromNet } from '../gross-quantity';
import {
  calculateWasteFactor,
  wasteFactorFromPercentage,
  wasteFactorFromWeights,
} from '../waste-factor';
import { calculateWastePercentage, wastePercentage } from '../waste-percentage';

describe('waste-percentage (pumpkin: 2,800 kg bruto → 1,960 kg neto)', () => {
  it('should compute the waste weight and percentage', () => {
    const result = calculateWastePercentage({ grossWeight: 2.8, netWeight: 1.96 });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.wasteWeight).toBeCloseTo(0.84, 10);
    expect(result.value.wastePercentage).toBeCloseTo(30, 10);
    expect(result.steps.map((step) => step.id)).toStrictEqual(['waste-weight', 'waste-percentage']);
  });

  it('should be 0 % when nothing is discarded', () => {
    expect(wastePercentage(3, 3)).toBe(0);
  });

  it('should validate the inputs', () => {
    expect(calculateWastePercentage({ grossWeight: null, netWeight: -1 })).toStrictEqual({
      ok: false,
      errors: [
        { field: 'grossWeight', code: 'required' },
        { field: 'netWeight', code: 'must-be-non-negative' },
      ],
    });
    expect(calculateWastePercentage({ grossWeight: 1, netWeight: 2 })).toStrictEqual({
      ok: false,
      errors: [{ field: 'netWeight', code: 'must-not-exceed-gross' }],
    });
  });
});

describe('waste-factor (whole salmon: 25 % → 1,333)', () => {
  it('should compute the factor with the first formula', () => {
    const result = calculateWasteFactor({ wastePercentage: 25 });
    expect(result.ok && result.value.usablePercentage).toBe(75);
    expect(result.ok && result.value.wasteFactor).toBeCloseTo(1.333333, 6);
  });

  it('should match the second formula (bruto / neto)', () => {
    expect(wasteFactorFromWeights(2.9, 2.1)).toBeCloseTo(
      wasteFactorFromPercentage(wastePercentage(2.9, 2.1)),
      10,
    );
  });

  it('should be 1 with no waste and reject 100 %', () => {
    expect(wasteFactorFromPercentage(0)).toBe(1);
    expect(calculateWasteFactor({ wastePercentage: 100 })).toStrictEqual({
      ok: false,
      errors: [{ field: 'wastePercentage', code: 'must-be-below-100' }],
    });
  });
});

describe('gross-quantity (salmon for 120 covers, 0,160 kg, 25 %)', () => {
  const input = { servings: 120, netPortion: 0.16, wastePercentage: 25, roundingStep: 1 };

  it('should compute net, gross and the rounded-up purchase', () => {
    const result = calculateGrossQuantity(input);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.netRequired).toBeCloseTo(19.2, 10);
    expect(result.value.grossQuantity).toBeCloseTo(25.6, 10);
    expect(result.value.purchaseQuantity).toBe(26);
    expect(result.steps).toHaveLength(5);
  });

  it('should show why adding the waste % is not enough', () => {
    const result = calculateGrossQuantity(input);
    expect(result.ok && result.value.naiveQuantity).toBeCloseTo(24, 10);
    expect(24 * 0.75).toBeLessThan(19.2);
  });

  it('should give the same result with the factor and the rule of three', () => {
    expect(grossFromNet(19.2, wasteFactorFromPercentage(25))).toBeCloseTo(
      grossByRuleOfThree(19.2, 25),
      10,
    );
  });

  it('should validate the inputs', () => {
    const result = calculateGrossQuantity({ ...input, servings: 0, roundingStep: null });
    expect(result).toStrictEqual({
      ok: false,
      errors: [
        { field: 'servings', code: 'must-be-positive' },
        { field: 'roundingStep', code: 'required' },
      ],
    });
  });
});

describe('clean-price', () => {
  it('should compute the equivalent clean price (bruto × factor)', () => {
    expect(equivalentCleanPrice(10_000, wasteFactorFromPercentage(30))).toBeCloseTo(14_285.71, 2);
  });

  it('should recommend buying gross when the supplier clean price is higher', () => {
    const result = calculateCleanPrice({
      grossPrice: 10_000,
      wastePercentage: 30,
      supplierCleanPrice: 15_000,
    });
    expect(result.ok && result.value.choice).toBe('buy-gross');
    expect(result.ok && result.value.difference).toBeCloseTo(714.29, 2);
  });

  it('should recommend buying clean when it is cheaper, or report a tie', () => {
    const cheaper = calculateCleanPrice({
      grossPrice: 10_000,
      wastePercentage: 30,
      supplierCleanPrice: 14_000,
    });
    expect(cheaper.ok && cheaper.value.choice).toBe('buy-clean');
    const same = calculateCleanPrice({
      grossPrice: 7_000,
      wastePercentage: 30,
      supplierCleanPrice: 10_000,
    });
    expect(same.ok && same.value.choice).toBe('same');
  });

  it('should validate the inputs', () => {
    expect(
      calculateCleanPrice({ grossPrice: 0, wastePercentage: 30, supplierCleanPrice: 1 }).ok,
    ).toBe(false);
  });
});

describe('cooking-loss', () => {
  it('should compute the loss including inseparable additions', () => {
    const result = calculateCookingLoss({
      netWeight: 1.2,
      additionsWeight: 0.3,
      cookedWeight: 1.05,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.weightBeforeCooking).toBeCloseTo(1.5, 10);
    expect(result.value.lossWeight).toBeCloseTo(0.45, 10);
    expect(result.value.lossPercentage).toBeCloseTo(30, 10);
    expect(result.value.cookedYield).toBeCloseTo(0.7, 10);
  });

  it('should reject a cooked weight above the weight before cooking', () => {
    expect(
      calculateCookingLoss({ netWeight: 1, additionsWeight: 0, cookedWeight: 1.1 }),
    ).toStrictEqual({
      ok: false,
      errors: [{ field: 'cookedWeight', code: 'must-not-exceed-gross' }],
    });
  });

  it('should require every value', () => {
    const result = calculateCookingLoss({
      netWeight: null,
      additionsWeight: null,
      cookedWeight: null,
    });
    expect(result.ok ? [] : result.errors).toHaveLength(3);
  });
});
