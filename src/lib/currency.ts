/**
 * Format a monetary amount according to currency and locale
 * @param amount - The numeric amount to format
 * @param currency - Currency code ('eur' or 'usd')
 * @param locale - Optional locale override
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string {
  const currencyUpper = currency.toUpperCase();
  
  // Determine locale based on currency if not provided
  const defaultLocale = currencyUpper === 'EUR' ? 'fr-FR' : 'en-US';
  const finalLocale = locale || defaultLocale;

  return new Intl.NumberFormat(finalLocale, {
    style: 'currency',
    currency: currencyUpper === 'EUR' ? 'EUR' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get currency symbol only
 * @param currency - Currency code ('eur' or 'usd')
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const currencyUpper = currency.toUpperCase();
  return currencyUpper === 'EUR' ? '€' : '$';
}

/**
 * Get currency symbol position (prefix or suffix)
 * @param currency - Currency code ('eur' or 'usd')
 * @returns 'prefix' or 'suffix'
 */
export function getCurrencyPosition(currency: string): 'prefix' | 'suffix' {
  const currencyUpper = currency.toUpperCase();
  return currencyUpper === 'EUR' ? 'suffix' : 'prefix';
}
