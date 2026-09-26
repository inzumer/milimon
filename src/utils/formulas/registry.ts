import type { CalculationResult } from '@utils/calculation';
import { calculateBreakEven } from '@utils/formulas/break-even';
import { calculateCleanPrice } from '@utils/formulas/clean-price';
import { calculateCookingLoss } from '@utils/formulas/cooking-loss';
import { calculateCostOfGoods } from '@utils/formulas/cost-of-goods';
import {
  calculateFloorArea,
  calculateSeatingCapacity,
  DEFAULT_DINING_SHARE,
} from '@utils/formulas/floor-area';
import { calculateGrossQuantity } from '@utils/formulas/gross-quantity';
import { calculateIncomeStatement } from '@utils/formulas/income-statement';
import {
  calculatePricing,
  DEFAULT_AMORTIZATION_MONTHS,
  DEFAULT_ANNUAL_RETURN_RATE,
  DEFAULT_INCOME_TAX_RATE,
  DEFAULT_SALES_TAX_RATES,
  DEFAULT_SOCIAL_CHARGES_RATE,
} from '@utils/formulas/pricing';
import { calculateRentCheck } from '@utils/formulas/rent-check';
import { calculateWasteFactor } from '@utils/formulas/waste-factor';
import { calculateWastePercentage } from '@utils/formulas/waste-percentage';

/**
 * Single source of truth for every formula: drives the hamburger menu, the formula pages, the
 * calculator dropdown and the i18n checks. The id is kebab-case English and equals the route slug
 * and the translation folder (`src/i18n/formulas/<id>/`).
 */
export const FORMULA_IDS = [
  'waste-percentage',
  'waste-factor',
  'gross-quantity',
  'clean-price',
  'cooking-loss',
  'recipe-costing',
  'cost-of-goods',
  'pricing',
  'income-statement',
  'break-even',
  'omnes-rules',
  'floor-area',
  'seating-capacity',
  'rent-check',
] as const;

export type FormulaId = (typeof FORMULA_IDS)[number];

export const FORMULA_GROUPS = [
  'waste-and-loss',
  'recipes',
  'pricing',
  'results',
  'premises',
] as const;

export type FormulaGroup = (typeof FORMULA_GROUPS)[number];

export type ValueKind =
  'weight' | 'percentage' | 'currency' | 'count' | 'area' | 'factor' | 'rate' | 'months' | 'toggle';

export interface InputDefinition {
  key: string;
  kind: ValueKind;
  defaultValue?: number | boolean;
  optional?: boolean;
}

export interface OutputDefinition {
  key: string;
  kind: ValueKind | 'text';
  primary?: boolean;
}

export interface FormulaExample {
  id: string;
  values: Record<string, number | boolean>;
}

export type FormulaValues = Record<string, number | boolean | null>;

interface BaseDefinition {
  id: FormulaId;
  group: FormulaGroup;
  examples: FormulaExample[];
}

export interface StandardFormulaDefinition extends BaseDefinition {
  layout: 'standard';
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  stepValueKinds?: Record<string, ValueKind>;
  calculate: (values: FormulaValues) => CalculationResult<object>;
}

export interface CustomFormulaDefinition extends BaseDefinition {
  layout: 'custom';
}

export type FormulaDefinition = StandardFormulaDefinition | CustomFormulaDefinition;

const num = (values: FormulaValues, key: string): number | null => {
  const value = values[key];
  return typeof value === 'number' ? value : null;
};

const bool = (values: FormulaValues, key: string): boolean => values[key] === true;

/** Reads the listed numeric inputs; the key union is inferred, so each formula gets its exact input type. */
const pick = <K extends string>(
  values: FormulaValues,
  keys: readonly K[],
): Record<K, number | null> =>
  Object.fromEntries(keys.map((key) => [key, num(values, key)])) as Record<K, number | null>;

export const FORMULAS: Record<FormulaId, FormulaDefinition> = {
  'waste-percentage': {
    id: 'waste-percentage',
    group: 'waste-and-loss',
    layout: 'standard',
    inputs: [
      { key: 'grossWeight', kind: 'weight' },
      { key: 'netWeight', kind: 'weight' },
    ],
    outputs: [
      { key: 'wasteWeight', kind: 'weight' },
      { key: 'wastePercentage', kind: 'percentage', primary: true },
    ],
    calculate: (v) =>
      calculateWastePercentage({
        grossWeight: num(v, 'grossWeight'),
        netWeight: num(v, 'netWeight'),
      }),
    examples: [{ id: 'pumpkin-cleaning', values: { grossWeight: 2.8, netWeight: 1.96 } }],
  },
  'waste-factor': {
    id: 'waste-factor',
    group: 'waste-and-loss',
    layout: 'standard',
    inputs: [{ key: 'wastePercentage', kind: 'percentage' }],
    outputs: [
      { key: 'usablePercentage', kind: 'percentage' },
      { key: 'wasteFactor', kind: 'factor', primary: true },
    ],
    calculate: (v) => calculateWasteFactor({ wastePercentage: num(v, 'wastePercentage') }),
    examples: [{ id: 'whole-salmon', values: { wastePercentage: 25 } }],
  },
  'gross-quantity': {
    id: 'gross-quantity',
    group: 'waste-and-loss',
    layout: 'standard',
    inputs: [
      { key: 'servings', kind: 'count' },
      { key: 'netPortion', kind: 'weight' },
      { key: 'wastePercentage', kind: 'percentage' },
      { key: 'roundingStep', kind: 'weight', defaultValue: 1 },
    ],
    outputs: [
      { key: 'netRequired', kind: 'weight' },
      { key: 'wasteFactor', kind: 'factor' },
      { key: 'grossQuantity', kind: 'weight' },
      { key: 'purchaseQuantity', kind: 'weight', primary: true },
      { key: 'naiveQuantity', kind: 'weight' },
    ],
    calculate: (v) =>
      calculateGrossQuantity({
        servings: num(v, 'servings'),
        netPortion: num(v, 'netPortion'),
        wastePercentage: num(v, 'wastePercentage'),
        roundingStep: num(v, 'roundingStep'),
      }),
    examples: [
      {
        id: 'salmon-portions',
        values: { servings: 120, netPortion: 0.16, wastePercentage: 25, roundingStep: 1 },
      },
    ],
  },
  'clean-price': {
    id: 'clean-price',
    group: 'waste-and-loss',
    layout: 'standard',
    inputs: [
      { key: 'grossPrice', kind: 'currency' },
      { key: 'wastePercentage', kind: 'percentage' },
      { key: 'supplierCleanPrice', kind: 'currency' },
    ],
    outputs: [
      { key: 'wasteFactor', kind: 'factor' },
      { key: 'equivalentCleanPrice', kind: 'currency', primary: true },
      { key: 'difference', kind: 'currency' },
      { key: 'choice', kind: 'text' },
    ],
    calculate: (v) =>
      calculateCleanPrice({
        grossPrice: num(v, 'grossPrice'),
        wastePercentage: num(v, 'wastePercentage'),
        supplierCleanPrice: num(v, 'supplierCleanPrice'),
      }),
    examples: [
      {
        id: 'tenderloin-offer',
        values: { grossPrice: 10_000, wastePercentage: 30, supplierCleanPrice: 15_000 },
      },
    ],
  },
  'cooking-loss': {
    id: 'cooking-loss',
    group: 'waste-and-loss',
    layout: 'standard',
    inputs: [
      { key: 'netWeight', kind: 'weight' },
      { key: 'additionsWeight', kind: 'weight', defaultValue: 0 },
      { key: 'cookedWeight', kind: 'weight' },
    ],
    outputs: [
      { key: 'weightBeforeCooking', kind: 'weight' },
      { key: 'lossWeight', kind: 'weight' },
      { key: 'lossPercentage', kind: 'percentage', primary: true },
    ],
    calculate: (v) =>
      calculateCookingLoss({
        netWeight: num(v, 'netWeight'),
        additionsWeight: num(v, 'additionsWeight'),
        cookedWeight: num(v, 'cookedWeight'),
      }),
    examples: [
      {
        id: 'roast-with-marinade',
        values: { netWeight: 1.2, additionsWeight: 0.3, cookedWeight: 1.05 },
      },
    ],
  },
  'recipe-costing': {
    id: 'recipe-costing',
    group: 'recipes',
    layout: 'custom',
    examples: [{ id: 'tournedos-recipe', values: { servings: 10 } }],
  },
  'cost-of-goods': {
    id: 'cost-of-goods',
    group: 'recipes',
    layout: 'standard',
    inputs: [
      { key: 'openingInventory', kind: 'currency' },
      { key: 'purchases', kind: 'currency' },
      { key: 'closingInventory', kind: 'currency' },
    ],
    outputs: [
      { key: 'availableForUse', kind: 'currency' },
      { key: 'costOfGoodsConsumed', kind: 'currency', primary: true },
    ],
    calculate: (v) =>
      calculateCostOfGoods(pick(v, ['openingInventory', 'purchases', 'closingInventory'])),
    examples: [
      {
        id: 'cafe-month',
        values: { openingInventory: 180_000, purchases: 410_000, closingInventory: 150_000 },
      },
    ],
  },
  pricing: {
    id: 'pricing',
    group: 'pricing',
    layout: 'standard',
    stepValueKinds: {
      socialCharges: 'currency',
      amortization: 'currency',
      monthlyReturn: 'currency',
      netProfit: 'currency',
    },
    inputs: [
      { key: 'unitCost', kind: 'currency' },
      { key: 'costOfGoodsConsumed', kind: 'currency' },
      { key: 'salaries', kind: 'currency' },
      { key: 'socialChargesRate', kind: 'percentage', defaultValue: DEFAULT_SOCIAL_CHARGES_RATE },
      { key: 'rent', kind: 'currency' },
      { key: 'services', kind: 'currency' },
      { key: 'generalExpenses', kind: 'currency' },
      { key: 'investment', kind: 'currency' },
      { key: 'amortizationMonths', kind: 'months', defaultValue: DEFAULT_AMORTIZATION_MONTHS },
      { key: 'annualReturnRate', kind: 'percentage', defaultValue: DEFAULT_ANNUAL_RETURN_RATE },
      { key: 'monthlyWithdrawal', kind: 'currency' },
      { key: 'incomeTaxRate', kind: 'percentage', defaultValue: DEFAULT_INCOME_TAX_RATE },
      { key: 'vatRate', kind: 'percentage', defaultValue: DEFAULT_SALES_TAX_RATES.vat },
      {
        key: 'grossIncomeTaxRate',
        kind: 'percentage',
        defaultValue: DEFAULT_SALES_TAX_RATES.grossIncomeTax,
      },
      {
        key: 'safetyHygieneRate',
        kind: 'percentage',
        defaultValue: DEFAULT_SALES_TAX_RATES.safetyHygiene,
      },
      { key: 'includeCardFee', kind: 'toggle', defaultValue: true },
      { key: 'cardFeeRate', kind: 'percentage', defaultValue: DEFAULT_SALES_TAX_RATES.cardFee },
    ],
    outputs: [
      { key: 'nonRawMaterialCosts', kind: 'currency' },
      { key: 'grossProfit', kind: 'currency' },
      { key: 'coefficient', kind: 'factor' },
      { key: 'netPrice', kind: 'currency' },
      { key: 'salesTaxRate', kind: 'percentage' },
      { key: 'grossPrice', kind: 'currency', primary: true },
    ],
    calculate: (v) =>
      calculatePricing({
        ...pick(v, [
          'salaries',
          'socialChargesRate',
          'rent',
          'services',
          'generalExpenses',
          'investment',
          'amortizationMonths',
          'annualReturnRate',
          'monthlyWithdrawal',
          'incomeTaxRate',
          'costOfGoodsConsumed',
          'unitCost',
          'vatRate',
          'grossIncomeTaxRate',
          'cardFeeRate',
          'safetyHygieneRate',
        ]),
        includeCardFee: bool(v, 'includeCardFee'),
      }),
    examples: [
      {
        id: 'cafe-toastie',
        values: {
          unitCost: 20,
          costOfGoodsConsumed: 440_000,
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
          vatRate: 21,
          grossIncomeTaxRate: 3.5,
          safetyHygieneRate: 1,
          includeCardFee: false,
          cardFeeRate: 4,
        },
      },
    ],
  },
  'income-statement': {
    id: 'income-statement',
    group: 'results',
    layout: 'standard',
    stepValueKinds: { fixedCosts: 'currency' },
    inputs: [
      { key: 'foodSales', kind: 'currency' },
      { key: 'beverageSales', kind: 'currency' },
      { key: 'foodCost', kind: 'currency' },
      { key: 'beverageCost', kind: 'currency' },
      { key: 'salaries', kind: 'currency' },
      { key: 'socialCharges', kind: 'currency' },
      { key: 'rent', kind: 'currency' },
      { key: 'services', kind: 'currency' },
      { key: 'generalExpenses', kind: 'currency' },
      { key: 'amortization', kind: 'currency' },
      { key: 'salesTaxes', kind: 'currency' },
      { key: 'municipalFees', kind: 'currency' },
      { key: 'incomeTaxRate', kind: 'percentage', defaultValue: DEFAULT_INCOME_TAX_RATE },
    ],
    outputs: [
      { key: 'totalSales', kind: 'currency' },
      { key: 'costOfSales', kind: 'currency' },
      { key: 'operatingCosts', kind: 'currency' },
      { key: 'resultBeforeIncomeTax', kind: 'currency' },
      { key: 'incomeTax', kind: 'currency' },
      { key: 'netResult', kind: 'currency', primary: true },
    ],
    calculate: (v) =>
      calculateIncomeStatement(
        pick(v, [
          'foodSales',
          'beverageSales',
          'foodCost',
          'beverageCost',
          'salaries',
          'socialCharges',
          'rent',
          'services',
          'generalExpenses',
          'amortization',
          'salesTaxes',
          'municipalFees',
          'incomeTaxRate',
        ]),
      ),
    examples: [
      {
        id: 'cafe-statement',
        values: {
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
        },
      },
    ],
  },
  'break-even': {
    id: 'break-even',
    group: 'results',
    layout: 'standard',
    inputs: [
      { key: 'grossSales', kind: 'currency' },
      { key: 'taxes', kind: 'currency' },
      { key: 'variableCosts', kind: 'currency' },
      { key: 'fixedCosts', kind: 'currency' },
      { key: 'desiredProfitBeforeTax', kind: 'currency' },
    ],
    outputs: [
      { key: 'netSales', kind: 'currency' },
      { key: 'taxRate', kind: 'rate' },
      { key: 'variableCostRate', kind: 'rate' },
      { key: 'contributionRate', kind: 'rate' },
      { key: 'breakEvenNetSales', kind: 'currency', primary: true },
      { key: 'breakEvenGrossSales', kind: 'currency' },
      { key: 'targetNetSales', kind: 'currency' },
      { key: 'targetGrossSales', kind: 'currency', primary: true },
    ],
    calculate: (v) =>
      calculateBreakEven(
        pick(v, ['grossSales', 'taxes', 'variableCosts', 'fixedCosts', 'desiredProfitBeforeTax']),
      ),
    examples: [
      {
        id: 'cafe-break-even',
        values: {
          grossSales: 1_570_000,
          taxes: 462_102.5,
          variableCosts: 440_000,
          fixedCosts: 392_850,
          desiredProfitBeforeTax: 307_692.31,
        },
      },
    ],
  },
  'omnes-rules': {
    id: 'omnes-rules',
    group: 'pricing',
    layout: 'custom',
    examples: [
      {
        id: 'sixteen-cakes',
        values: { averageTicket: 80, dailySpecialPrice: 75 },
      },
    ],
  },
  'floor-area': {
    id: 'floor-area',
    group: 'premises',
    layout: 'standard',
    inputs: [
      { key: 'areaPerCustomer', kind: 'area' },
      { key: 'circulationPercentage', kind: 'percentage' },
      { key: 'customers', kind: 'count' },
    ],
    outputs: [
      { key: 'areaPerCustomerWithCirculation', kind: 'area' },
      { key: 'requiredArea', kind: 'area' },
      { key: 'requiredAreaRounded', kind: 'area', primary: true },
    ],
    calculate: (v) =>
      calculateFloorArea(pick(v, ['areaPerCustomer', 'circulationPercentage', 'customers'])),
    examples: [
      {
        id: 'cafe-32-covers',
        values: { areaPerCustomer: 1.2, circulationPercentage: 25, customers: 32 },
      },
    ],
  },
  'seating-capacity': {
    id: 'seating-capacity',
    group: 'premises',
    layout: 'standard',
    inputs: [
      { key: 'premisesArea', kind: 'area' },
      { key: 'diningSharePercentage', kind: 'percentage', defaultValue: DEFAULT_DINING_SHARE },
      { key: 'areaPerCustomerWithCirculation', kind: 'area' },
    ],
    outputs: [
      { key: 'diningArea', kind: 'area' },
      { key: 'capacity', kind: 'count' },
      { key: 'capacityRounded', kind: 'count', primary: true },
    ],
    calculate: (v) =>
      calculateSeatingCapacity(
        pick(v, ['premisesArea', 'diningSharePercentage', 'areaPerCustomerWithCirculation']),
      ),
    examples: [
      {
        id: 'premises-120-m2',
        values: {
          premisesArea: 120,
          diningSharePercentage: 60,
          areaPerCustomerWithCirculation: 1.5,
        },
      },
    ],
  },
  'rent-check': {
    id: 'rent-check',
    group: 'premises',
    layout: 'standard',
    stepValueKinds: { maxShare: 'percentage', optimalShare: 'percentage' },
    inputs: [
      { key: 'rent', kind: 'currency' },
      { key: 'netSales', kind: 'currency' },
    ],
    outputs: [
      { key: 'rentShare', kind: 'percentage', primary: true },
      { key: 'status', kind: 'text' },
      { key: 'salesForMaxShare', kind: 'currency' },
      { key: 'salesForOptimalShare', kind: 'currency' },
    ],
    calculate: (v) => calculateRentCheck({ rent: num(v, 'rent'), netSales: num(v, 'netSales') }),
    examples: [
      {
        id: 'cafe-rent',
        values: { rent: 60_000, netSales: 1_107_897.5 },
      },
    ],
  },
};

export const isFormulaId = (value: unknown): value is FormulaId =>
  typeof value === 'string' && (FORMULA_IDS as readonly string[]).includes(value);

export const getFormula = (id: FormulaId): FormulaDefinition => FORMULAS[id];

export const formulasByGroup = (): Record<FormulaGroup, FormulaDefinition[]> =>
  Object.fromEntries(
    FORMULA_GROUPS.map((group) => [
      group,
      FORMULA_IDS.map(getFormula).filter((formula) => formula.group === group),
    ]),
  ) as Record<FormulaGroup, FormulaDefinition[]>;

/** Initial form values: the defaults for parameters, `null` (empty) for data. */
export const initialValues = (formula: StandardFormulaDefinition): FormulaValues =>
  Object.fromEntries(formula.inputs.map((input) => [input.key, input.defaultValue ?? null]));

/** Kind of every value a formula can show (inputs, outputs and intermediate step values). */
export const valueKinds = (
  formula: StandardFormulaDefinition,
): Record<string, ValueKind | 'text'> => ({
  ...Object.fromEntries(formula.inputs.map((input) => [input.key, input.kind])),
  ...Object.fromEntries(formula.outputs.map((output) => [output.key, output.kind])),
  ...formula.stepValueKinds,
});
