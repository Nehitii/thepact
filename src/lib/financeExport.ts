import type { FinancialItem, MonthlyValidation, UserAccount, AccountTransfer, BankTransaction } from '@/types/finance';
import { format } from 'date-fns';

function escapeCsv(val: string | number | null | undefined): string {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportRecurringItems(
  expenses: FinancialItem[],
  income: FinancialItem[],
  currency: string,
) {
  const header = 'Type,Name,Amount,Category,Active\n';
  const rows = [
    ...expenses.map(e => `Expense,${escapeCsv(e.name)},${e.amount},${escapeCsv(e.category)},${e.is_active}`),
    ...income.map(i => `Income,${escapeCsv(i.name)},${i.amount},${escapeCsv(i.category)},${i.is_active}`),
  ].join('\n');

  downloadCsv(`finance-recurring-${format(new Date(), 'yyyy-MM-dd')}.csv`, header + rows);
}

export function exportMonthlyValidations(validations: MonthlyValidation[], currency: string) {
  const header = 'Month,Income,Expenses,Unplanned Income,Unplanned Expenses,Net,Validated\n';
  const rows = validations.map(v => {
    const net = (v.actual_total_income || 0) - (v.actual_total_expenses || 0);
    return `${v.month},${v.actual_total_income || 0},${v.actual_total_expenses || 0},${v.unplanned_income || 0},${v.unplanned_expenses || 0},${net},${v.validated_at ? 'Yes' : 'No'}`;
  }).join('\n');

  downloadCsv(`finance-monthly-${format(new Date(), 'yyyy-MM-dd')}.csv`, header + rows);
}

export function exportAccounts(accounts: UserAccount[], currency: string) {
  const header = 'Name,Bank,Type,Balance,Active\n';
  const rows = accounts.map(a =>
    `${escapeCsv(a.name)},${escapeCsv(a.bank_name)},${a.account_type},${a.balance},${a.is_active}`
  ).join('\n');

  downloadCsv(`finance-accounts-${format(new Date(), 'yyyy-MM-dd')}.csv`, header + rows);
}

export function exportTransfers(transfers: AccountTransfer[], accounts: UserAccount[]) {
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || id;
  const header = 'Date,From,To,Amount,Note\n';
  const rows = transfers.map(t =>
    `${t.transfer_date || t.created_at},${escapeCsv(getAccountName(t.from_account_id))},${escapeCsv(getAccountName(t.to_account_id))},${t.amount},${escapeCsv(t.note)}`
  ).join('\n');

  downloadCsv(`finance-transfers-${format(new Date(), 'yyyy-MM-dd')}.csv`, header + rows);
}

export function exportTransactions(transactions: BankTransaction[], accounts: UserAccount[]) {
  const getAccountName = (id: string | null) => {
    if (!id) return '';
    return accounts.find(a => a.id === id)?.name || id;
  };
  const header = 'Date,Description,Amount,Type,Category,Account,Note,Source\n';
  const rows = transactions.map(tx =>
    `${tx.transaction_date},${escapeCsv(tx.description)},${tx.amount},${tx.transaction_type},${escapeCsv(tx.category)},${escapeCsv(getAccountName(tx.account_id))},${escapeCsv(tx.note)},${tx.source}`
  ).join('\n');

  downloadCsv(`finance-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`, header + rows);
}

export function exportFullReport(
  expenses: FinancialItem[],
  income: FinancialItem[],
  validations: MonthlyValidation[],
  accounts: UserAccount[],
  currency: string,
  transactions?: BankTransaction[],
) {
  let content = '=== RECURRING ITEMS ===\n';
  content += 'Type,Name,Amount,Category,Active\n';
  expenses.forEach(e => { content += `Expense,${escapeCsv(e.name)},${e.amount},${escapeCsv(e.category)},${e.is_active}\n`; });
  income.forEach(i => { content += `Income,${escapeCsv(i.name)},${i.amount},${escapeCsv(i.category)},${i.is_active}\n`; });

  content += '\n=== MONTHLY HISTORY ===\n';
  content += 'Month,Income,Expenses,Net,Validated\n';
  validations.forEach(v => {
    const net = (v.actual_total_income || 0) - (v.actual_total_expenses || 0);
    content += `${v.month},${v.actual_total_income || 0},${v.actual_total_expenses || 0},${net},${v.validated_at ? 'Yes' : 'No'}\n`;
  });

  content += '\n=== ACCOUNTS ===\n';
  content += 'Name,Bank,Type,Balance\n';
  accounts.forEach(a => {
    content += `${escapeCsv(a.name)},${escapeCsv(a.bank_name)},${a.account_type},${a.balance}\n`;
  });

  if (transactions && transactions.length > 0) {
    content += '\n=== TRANSACTIONS ===\n';
    content += 'Date,Description,Amount,Type,Category,Note,Source\n';
    transactions.forEach(tx => {
      content += `${tx.transaction_date},${escapeCsv(tx.description)},${tx.amount},${tx.transaction_type},${escapeCsv(tx.category)},${escapeCsv(tx.note)},${tx.source}\n`;
    });
  }

  downloadCsv(`finance-full-report-${format(new Date(), 'yyyy-MM-dd')}.csv`, content);
}
