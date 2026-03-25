

# Fix: CSV Import Fails — Encoding Issue

## Root Cause

The CSV file from Societe Generale uses ISO-8859-1 encoding (standard for French bank CSVs):
```
Date de l'opération;Libellé;Détail de l'écriture;Montant de l'opération;Devise
```

`FileReader.readAsText()` defaults to UTF-8. Accented bytes (`é` = 0xE9 in Latin-1) become replacement characters (`�`), so:
- `"Date de l'opération"` → `"Date de l'op�ration"` — no longer contains `"operation"`
- `"Libellé"` → `"Libell�"` — no longer contains `"libelle"`
- `"Montant de l'opération"` → `"Montant de l'op�ration"` — no longer contains `"montant"` ... wait, "montant" has no accents. Let me recheck.

Actually `"Montant"` has no accent, so AMOUNT detection works. But `dateCol` and `descCol` fail. Since `dateCol` defaults to 0 and `descCol` defaults to 1 (fallback logic), those actually work by fallback. The real issue may be more subtle — let me verify the actual data row parsing too.

Looking again at the data: amounts like `-16,49` with comma decimals. The `parseAmount` handles this. Dates like `24/03/2026` with `DD/MM/YYYY` format. The `parseDate` handles this.

Wait — the file has 5 columns per row. Column 3 (index 3) is `"Montant de l'opération"`. The keyword `"montant"` is in AMOUNT_KEYWORDS and has no accent. So `amountCol = 3` should be set correctly even with garbled encoding.

Let me re-trace more carefully with garbled headers:
- Header 0: `"Date de l'op\uFFFDration"` → normalized NFD: still contains `\uFFFD`. Does NOT match `"operation"` in DATE_KEYWORDS. `dateCol` stays -1.
- Header 1: `"Libell\uFFFD"` → does NOT match `"libelle"`. `descCol` stays -1.
- Header 2: `"D\uFFFDtail de l'\uFFFDcriture"` → no match.
- Header 3: `"Montant de l'op\uFFFDration"` → contains `"montant"` → matches AMOUNT_KEYWORDS? No wait — the `else if` chain first checks DATE_KEYWORDS. Does it contain `"operation"`? No (it's `"op\uFFFDration"`). DESC_KEYWORDS? Does it contain any desc keyword? "montant de l'op\uFFFDration" doesn't match desc keywords. DEBIT? No. CREDIT? No. AMOUNT? Contains "montant" → yes! `amountCol = 3`. 
- Header 4: `"Devise"` → no match.

Fallback: `dateCol = 0`, `descCol = 1` (since dateCol fallback is 0, descCol = 1). `amountCol = 3`. These are actually correct!

So column detection works via fallbacks. The data parsing should work too. Let me look deeper...

Actually, the file view showed 185 lines. Let me check if the issue might be that `readAsText` with UTF-8 encoding completely breaks on certain byte sequences, causing the entire text to be empty or mangled at certain lines.

No — UTF-8 `readAsText` replaces invalid bytes with U+FFFD but still produces output. The parsing should work.

Let me check if there's a state issue — maybe `delimiter` isn't applied because the state updates after `handleFile` runs. The `delimiterSetting` defaults to `defaultDelimiter || ';'` but `delimiter` is derived with `const delimiter = delimiterSetting === 'tab' ? '\t' : delimiterSetting`. If `defaultDelimiter` is passed as `','` from settings, that would break everything since the file uses `;`.

Looking at `Finance.tsx`, `financeSettings` passes `finance_csv_delimiter` which defaults to `','`. So the user's delimiter setting is probably `','` (comma), but the actual file uses `;` (semicolon). When the user picks the file, `delimiter` is `,` and all 5-column rows get parsed as 1-column rows → `cols.length < 2` → everything is skipped!

**This is the real bug**: the delimiter is set to `,` by default from settings, but French bank CSVs use `;`. Even though the UI shows the delimiter selector, the user must manually change it BEFORE selecting the file. If they select the file first, parsing uses the wrong delimiter.

## Fix

**File: `CsvImportModal.tsx`**

1. **Auto-detect delimiter**: Before parsing, scan the header line for the most likely delimiter (`;`, `,`, `\t`). Pick the one that produces the most columns.
2. **Re-parse on settings change**: When the user changes delimiter or date format after selecting a file, re-parse automatically instead of requiring a re-upload.
3. **Encoding fallback**: Try UTF-8 first, and if replacement characters are detected, retry with ISO-8859-1.

### Implementation

- Store the raw file text in state so re-parsing can happen when settings change
- Add an `autoDetectDelimiter()` function that tests `;`, `,`, `\t` on the header line
- Add a `useEffect` that re-runs parsing when `dateFormat` or `delimiterSetting` change (if raw text exists)
- Use `reader.readAsText(file, 'UTF-8')` then check for `\uFFFD`, and if found, retry with `reader.readAsText(file, 'ISO-8859-1')`

| File | Change |
|------|--------|
| `src/components/finance/transactions/CsvImportModal.tsx` | Auto-detect delimiter, encoding fallback, re-parse on settings change |

No database changes.

