import { calculateCostOfGoods, costOfGoodsConsumed } from '../cost-of-goods';
import {
  amortization,
  calculatePricing,
  DEFAULT_SALES_TAX_RATES,
  grossPrice,
  grossUpForIncomeTax,
  pricingCoefficient,
  salesTaxTotal,
  type PricingInput,
} from '../pricing';
import { calculateRecipeCosting } from '../recipe-costing';

describe('recipe-costing', () => {
  const input = {
    servings: 10,
    ingredients: [
      { name: 'Lomo', unit: 'kg', netQuantity: 1.8, wastePercentage: 30, unitPrice: 10_000 },
      { name: 'Papas', unit: 'kg', netQuantity: 2, wastePercentage: 20, unitPrice: 1_500 },
      { name: 'Manteca', unit: 'kg', netQuantity: 0.2, wastePercentage: 0, unitPrice: 8_000 },
    ],
  };

  it('computes gross quantity, cost and share per ingredient, recipe and portion cost', () => {
    const result = calculateRecipeCosting(input);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const [lomo, papas, manteca] = result.value.ingredients;
    expect(lomo?.grossQuantity).toBeCloseTo(2.571429, 6);
    expect(lomo?.cost).toBeCloseTo(25_714.29, 2);
    expect(papas?.wasteFactor).toBeCloseTo(1.25, 10);
    expect(papas?.cost).toBeCloseTo(3_750, 6);
    expect(manteca?.cost).toBeCloseTo(1_600, 6);
    expect(result.value.recipeCost).toBeCloseTo(31_064.29, 2);
    expect(result.value.portionCost).toBeCloseTo(3_106.43, 2);
    expect(result.value.ingredients.reduce((total, row) => total + row.share, 0)).toBeCloseTo(
      100,
      10,
    );
  });

  it('reports a zero share when every ingredient is free', () => {
    const result = calculateRecipeCosting({
      servings: 1,
      ingredients: [{ name: 'Agua', unit: 'l', netQuantity: 1, wastePercentage: 0, unitPrice: 0 }],
    });
    expect(result.ok && result.value.ingredients[0]?.share).toBe(0);
  });

  it('reports errors per ingredient row', () => {
    const result = calculateRecipeCosting({
      servings: 0,
      ingredients: [
        { name: 'X', unit: 'kg', netQuantity: null, wastePercentage: 100, unitPrice: -1 },
      ],
    });
    expect(result).toStrictEqual({
      ok: false,
      errors: [
        { field: 'servings', code: 'must-be-positive' },
        { field: 'ingredients.0.netQuantity', code: 'required' },
        { field: 'ingredients.0.wastePercentage', code: 'must-be-below-100' },
        { field: 'ingredients.0.unitPrice', code: 'must-be-non-negative' },
      ],
    });
  });

  it('requires at least one ingredient', () => {
    expect(calculateRecipeCosting({ servings: 4, ingredients: [] })).toStrictEqual({
      ok: false,
      errors: [{ field: 'ingredients', code: 'required' }],
    });
  });
});

describe('cost-of-goods (manual: 125.000 + 245.000 − 100.000)', () => {
  it('computes the cost of goods consumed', () => {
    const result = calculateCostOfGoods({
      openingInventory: 125_000,
      purchases: 245_000,
      closingInventory: 100_000,
    });
    expect(result.ok && result.value).toStrictEqual({
      availableForUse: 370_000,
      costOfGoodsConsumed: 270_000,
    });
    expect(costOfGoodsConsumed(10, 5, 3)).toBe(12);
  });

  it('rejects a closing inventory larger than what was available', () => {
    expect(
      calculateCostOfGoods({ openingInventory: 1, purchases: 1, closingInventory: 3 }),
    ).toStrictEqual({
      ok: false,
      errors: [{ field: 'closingInventory', code: 'must-not-exceed-gross' }],
    });
  });
});

describe('pricing (manual, Unidad 3)', () => {
  const manual: PricingInput = {
    salaries: 57_000,
    socialChargesRate: 48,
    rent: 41_000,
    services: 13_000,
    generalExpenses: 90_000,
    investment: 3_000_000,
    amortizationMonths: 36,
    annualReturnRate: 32,
    monthlyWithdrawal: 50_000,
    incomeTaxRate: 35,
    costOfGoodsConsumed: 270_000,
    unitCost: 12,
    vatRate: 21,
    grossIncomeTaxRate: 3,
    cardFeeRate: 5,
    safetyHygieneRate: 0.5,
    includeCardFee: true,
  };

  it('reproduces the costs, desired profit and coefficient of the manual', () => {
    const result = calculatePricing(manual);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.socialCharges).toBe(27_360);
    expect(result.value.amortization).toBeCloseTo(83_333.33, 2);
    expect(result.value.nonRawMaterialCosts).toBeCloseTo(311_693.33, 2);
    expect(result.value.monthlyReturn).toBeCloseTo(80_000, 6);
    expect(result.value.netProfit).toBeCloseTo(130_000, 6);
    expect(result.value.grossProfit).toBeCloseTo(200_000, 6);
    expect(result.value.coefficient).toBeCloseTo(2.895, 3);
    expect(result.value.netPrice).toBeCloseTo(34.74, 2); // Medialunas: $ 12 × 2,895
    expect(result.steps).toHaveLength(10);
  });

  it.each([
    ['Medialunas', 12, 34.74],
    ['Cookies', 10, 28.95],
    ['Pan de queso', 9, 26.06],
    ['Sachertorte', 42, 121.59],
    ['Mousse de chocolate', 41, 118.7],
    ['Lemon pie', 25, 72.38],
    ['Cheesecake Oreo', 39, 112.91],
  ])('net price of %s ($ %d) matches the manual table (%d)', (_name, unitCost, expected) => {
    const result = calculatePricing({ ...manual, unitCost });
    expect(result.ok && result.value.netPrice).toBeCloseTo(expected, 1);
  });

  it('shows the tax breakdown: 29,5 % with card fees, 24,5 % (the manual factor 1,245) without', () => {
    expect(salesTaxTotal(DEFAULT_SALES_TAX_RATES, true)).toBe(29.5);
    expect(salesTaxTotal(DEFAULT_SALES_TAX_RATES, false)).toBe(24.5);
    const withCards = calculatePricing(manual);
    const withoutCards = calculatePricing({ ...manual, includeCardFee: false });
    expect(withCards.ok && withCards.value.grossPrice).toBeCloseTo(44.99, 2);
    // Manual: $ 43,27 (it multiplies rounded intermediate values).
    expect(withoutCards.ok && withoutCards.value.grossPrice).toBeCloseTo(43.25, 2);
  });

  it('exposes the building blocks', () => {
    expect(amortization(3_600)).toBe(100);
    expect(grossUpForIncomeTax(130_000, 35)).toBeCloseTo(200_000, 6);
    expect(pricingCoefficient(100, 50, 150)).toBe(2);
    expect(grossPrice(100, 29.5)).toBeCloseTo(129.5, 10);
  });

  it('validates the inputs', () => {
    const result = calculatePricing({
      ...manual,
      costOfGoodsConsumed: 0,
      incomeTaxRate: 100,
      salaries: null,
    });
    expect(result).toStrictEqual({
      ok: false,
      errors: [
        { field: 'salaries', code: 'required' },
        { field: 'incomeTaxRate', code: 'must-be-below-100' },
        { field: 'costOfGoodsConsumed', code: 'must-be-positive' },
      ],
    });
  });
});
