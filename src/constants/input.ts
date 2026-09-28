/** What a numeric field drops as it is typed: anything but digits and both separators. */
export const NUMERIC_INPUT_DISALLOWED = /[^0-9.,]/g;

/** Price lists (Omnes' rules) also keep the separators between prices: spaces, new lines, `;`. */
export const PRICE_LIST_INPUT_DISALLOWED = /[^0-9.,;\s]/g;
