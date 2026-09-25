import type { CalculationResult } from '@domain/shared';
import { calculateBreakEven } from './formulas/break-even';
import { calculateCleanPrice } from './formulas/clean-price';
import { calculateCookingLoss } from './formulas/cooking-loss';
import { calculateCostOfGoods } from './formulas/cost-of-goods';
import {
  calculateFloorArea,
  calculateSeatingCapacity,
  DEFAULT_DINING_SHARE,
} from './formulas/floor-area';
import { calculateGrossQuantity } from './formulas/gross-quantity';
import { calculateIncomeStatement } from './formulas/income-statement';
import {
  calculatePricing,
  DEFAULT_AMORTIZATION_MONTHS,
  DEFAULT_ANNUAL_RETURN_RATE,
  DEFAULT_INCOME_TAX_RATE,
  DEFAULT_SALES_TAX_RATES,
  DEFAULT_SOCIAL_CHARGES_RATE,
} from './formulas/pricing';
import { calculateRentCheck } from './formulas/rent-check';
import { calculateWasteFactor } from './formulas/waste-factor';
import { calculateWastePercentage } from './formulas/waste-percentage';

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

/** Drives the unit shown next to an input/result and how it is formatted. */
export type ValueKind =
  'weight' | 'percentage' | 'currency' | 'count' | 'area' | 'factor' | 'rate' | 'months' | 'toggle';

export interface InputDefinition {
  key: string;
  kind: ValueKind;
  /** Pre-filled value. Only for parameters the manual gives (tax rates, 36 months…), never for data. */
  defaultValue?: number | boolean;
  /** Optional inputs can be left empty. */
  optional?: boolean;
}

export interface OutputDefinition {
  key: string;
  kind: ValueKind | 'text';
  /** Main result, highlighted in the UI. */
  primary?: boolean;
}

export type ExampleSource = 'manual' | 'illustrative';

export interface FormulaExample {
  id: string;
  /** `manual`: numbers taken from the manual; `illustrative`: our own numbers where it has none. */
  source: ExampleSource;
  values: Record<string, number | boolean>;
}

export type FormulaValues = Record<string, number | boolean | null>;

interface BaseDefinition {
  id: FormulaId;
  group: FormulaGroup;
  examples: FormulaExample[];
}

/** Rendered by the generic calculator form: flat numeric (or toggle) inputs. */
export interface StandardFormulaDefinition extends BaseDefinition {
  layout: 'standard';
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  /** Kinds of intermediate values that appear in the worked steps but aren't inputs or outputs. */
  stepValueKinds?: Record<string, ValueKind>;
  calculate: (values: FormulaValues) => CalculationResult<object>;
}

/** Needs a dedicated calculator (lists of ingredients or prices). */
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
    examples: [
      { id: 'manual-cleaning', source: 'manual', values: { grossWeight: 2.4, netWeight: 1.7 } },
    ],
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
    examples: [{ id: 'manual-tenderloin', source: 'manual', values: { wastePercentage: 30 } }],
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
        id: 'manual-tournedos',
        source: 'manual',
        values: { servings: 200, netPortion: 0.18, wastePercentage: 30, roundingStep: 1 },
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
        source: 'illustrative',
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
        source: 'illustrative',
        values: { netWeight: 1.2, additionsWeight: 0.3, cookedWeight: 1.05 },
      },
    ],
  },
  'recipe-costing': {
    id: 'recipe-costing',
    group: 'recipes',
    layout: 'custom',
    examples: [{ id: 'tournedos-recipe', source: 'illustrative', values: { servings: 10 } }],
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
        id: 'manual-month',
        source: 'manual',
        values: { openingInventory: 125_000, purchases: 245_000, closingInventory: 100_000 },
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
        id: 'manual-croissants',
        source: 'manual',
        values: {
          unitCost: 12,
          costOfGoodsConsumed: 270_000,
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
          vatRate: 21,
          grossIncomeTaxRate: 3,
          safetyHygieneRate: 0.5,
          includeCardFee: false,
          cardFeeRate: 5,
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
        id: 'manual-statement',
        source: 'manual',
        values: {
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
        id: 'manual-break-even',
        source: 'manual',
        values: {
          grossSales: 1_118_000,
          taxes: 332_248.05,
          variableCosts: 270_000,
          fixedCosts: 313_977,
          desiredProfitBeforeTax: 200_000,
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
        source: 'illustrative',
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
        id: 'manual-tea-house',
        source: 'manual',
        values: { areaPerCustomer: 1.1, circulationPercentage: 20, customers: 20 },
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
        id: 'manual-80-m2',
        source: 'manual',
        values: {
          premisesArea: 80,
          diningSharePercentage: 55,
          areaPerCustomerWithCirculation: 1.3,
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
        id: 'manual-statement-rent',
        source: 'manual',
        values: { rent: 41_000, netSales: 785_751.95 },
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

/** Initial form values: the manual defaults for parameters, `null` (empty) for data. */
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
