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
    /* Un montant rond se lit mieux sans centimes : « 300 € », pas
       « 300,00 € ». Mais minimumFractionDigits a zero donnait aussi
       « 268,5 € » et « 13 916,5 € » — un montant a un seul chiffre
       apres la virgule, ce qui n existe pas en monnaie. Des qu il y
       a des centimes, on en montre deux. */
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
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
