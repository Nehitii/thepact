import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { UserAccount } from '@/types/finance';

interface AccountCardProps {
  account: UserAccount;
  currency: string;
  onEdit: (account: UserAccount) => void;
  onDelete: (id: string) => void;
  onSelect?: (account: UserAccount) => void;
  computedBalance?: number;
  txCount?: number;
}

export function AccountCard({ account, currency, onEdit, onDelete, onSelect, computedBalance, txCount }: AccountCardProps) {
  const { t } = useTranslation();
  const displayBalance = computedBalance ?? account.balance;
  const isPositive = displayBalance >= 0;

  const renderIcon = () => {
    if (account.icon_url) {
      return (
        <img
          src={account.icon_url}
          alt={account.name}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }
    return <span className="text-xl">{account.icon_emoji || '🏦'}</span>;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`neu-card p-5 relative overflow-hidden group ${onSelect ? 'cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all' : ''}`}
      onClick={() => onSelect?.(account)}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: account.color || 'hsl(var(--primary))' }}
      />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ backgroundColor: account.icon_url ? undefined : `${account.color}15` }}
          >
            {renderIcon()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{account.name}</h3>
            {account.bank_name && (
              <p className="text-xs text-muted-foreground">{account.bank_name}</p>
            )}
          </div>
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border rounded-xl" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(account); }} className="text-foreground">
              <Edit2 className="w-3.5 h-3.5 mr-2" />{t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(account.id); }} className="text-rose-400">
              <Trash2 className="w-3.5 h-3.5 mr-2" />{t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
          {t(`finance.accounts.types.${account.account_type}`)}
        </p>
        <p className={`text-2xl font-bold tabular-nums ${isPositive ? 'text-foreground' : 'text-rose-400'}`}>
          {formatCurrency(displayBalance, currency)}
        </p>
        {txCount != null && txCount > 0 && (
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {t('finance.accounts.linkedTransactions', { count: txCount })}
          </p>
        )}
      </div>

      {!account.is_active && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-[20px]">
          <span className="text-xs text-muted-foreground font-medium">{t('finance.accounts.inactive')}</span>
        </div>
      )}
    </motion.div>
  );
}
