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

  it('should compute gross quantity, cost and share per ingredient, recipe and portion cost', () => {
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

  it('should report a zero share when every ingredient is free', () => {
    const result = calculateRecipeCosting({
      servings: 1,
      ingredients: [{ name: 'Agua', unit: 'l', netQuantity: 1, wastePercentage: 0, unitPrice: 0 }],
    });
    expect(result.ok && result.value.ingredients[0]?.share).toBe(0);
  });

  it('should report errors per ingredient row', () => {
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

  it('should require at least one ingredient', () => {
    expect(calculateRecipeCosting({ servings: 4, ingredients: [] })).toStrictEqual({
      ok: false,
      errors: [{ field: 'ingredients', code: 'required' }],
    });
  });
});

describe('cost-of-goods (café month: 180.000 + 410.000 − 150.000)', () => {
  it('should compute the cost of goods consumed', () => {
    const result = calculateCostOfGoods({
      openingInventory: 180_000,
      purchases: 410_000,
      closingInventory: 150_000,
    });
    expect(result.ok && result.value).toStrictEqual({
      availableForUse: 590_000,
      costOfGoodsConsumed: 440_000,
    });
    expect(costOfGoodsConsumed(10, 5, 3)).toBe(12);
  });

  it('should reject a closing inventory larger than what was available', () => {
    expect(
      calculateCostOfGoods({ openingInventory: 1, purchases: 1, closingInventory: 3 }),
    ).toStrictEqual({
      ok: false,
      errors: [{ field: 'closingInventory', code: 'must-not-exceed-gross' }],
    });
  });
});

describe('pricing (the café example)', () => {
  const cafe: PricingInput = {
    salaries: 95_000,
    socialChargesRate: 45,
    rent: 60_000,
    services: 22_000,
    generalExpenses: 70_000,
    investment: 4_800_000,
    amortizationMonths: 48,
    annualReturnRate: 30,
    monthlyWithdrawal: 80_000,
    incomeTaxRate: 35,
    costOfGoodsConsumed: 440_000,
    unitCost: 20,
    vatRate: 21,
    grossIncomeTaxRate: 3.5,
    cardFeeRate: 4,
    safetyHygieneRate: 1,
    includeCardFee: true,
  };

  it('should compute the costs, desired profit and coefficient', () => {
    const result = calculatePricing(cafe);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.socialCharges).toBe(42_750);
    expect(result.value.amortization).toBe(100_000);
    expect(result.value.nonRawMaterialCosts).toBe(389_750);
    expect(result.value.monthlyReturn).toBeCloseTo(120_000, 6);
    expect(result.value.netProfit).toBeCloseTo(200_000, 6);
    expect(result.value.grossProfit).toBeCloseTo(307_692.31, 2);
    expect(result.value.coefficient).toBeCloseTo(2.5851, 4);
    expect(result.value.netPrice).toBeCloseTo(51.7, 2);
    expect(result.steps).toHaveLength(10);
  });

  it.each([
    ['Café con leche', 8, 20.68],
    ['Scon de queso', 12, 31.02],
    ['Licuado', 15, 38.78],
    ['Tostado', 20, 51.7],
    ['Budín de limón', 35, 90.48],
    ['Tarta de frutillas', 45, 116.33],
  ])('should price %s ($ %d → %d net)', (_name, unitCost, expected) => {
    const result = calculatePricing({ ...cafe, unitCost });
    expect(result.ok && result.value.netPrice).toBeCloseTo(expected, 1);
  });

  it('should show the tax breakdown: 29,5 % with card fees, 25,5 % without', () => {
    expect(salesTaxTotal(DEFAULT_SALES_TAX_RATES, true)).toBe(29.5);
    expect(salesTaxTotal(DEFAULT_SALES_TAX_RATES, false)).toBe(25.5);
    const withCards = calculatePricing(cafe);
    const withoutCards = calculatePricing({ ...cafe, includeCardFee: false });
    expect(withCards.ok && withCards.value.grossPrice).toBeCloseTo(66.95, 2);
    expect(withoutCards.ok && withoutCards.value.grossPrice).toBeCloseTo(64.89, 2);
  });

  it('should expose the building blocks', () => {
    expect(amortization(4_800)).toBe(100);
    expect(grossUpForIncomeTax(200_000, 35)).toBeCloseTo(307_692.31, 2);
    expect(pricingCoefficient(100, 50, 150)).toBe(2);
    expect(grossPrice(100, 29.5)).toBeCloseTo(129.5, 10);
  });

  it('should validate the inputs', () => {
    const result = calculatePricing({
      ...cafe,
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
