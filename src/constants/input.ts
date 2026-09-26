/**
 * Characters a numeric field keeps as the person types: digits and both decimal separators
 * (the parser accepts "2,4" and "2.4", and thousands grouping). Anything else is dropped.
 */
export const NUMERIC_INPUT_DISALLOWED = /[^0-9.,]/g;

/** Price lists (Omnes' rules) also keep the separators between prices: spaces, new lines, `;`. */
export const PRICE_LIST_INPUT_DISALLOWED = /[^0-9.,;\s]/g;
