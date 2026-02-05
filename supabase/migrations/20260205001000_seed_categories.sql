INSERT INTO public.categories (id, label, icon, color)
VALUES
  ('food', 'Alimentação', 'Utensils', '#ef4444'),
  ('transport', 'Transporte', 'Car', '#f59e0b'),
  ('market', 'Mercado', 'ShoppingCart', '#84cc16'),
  ('health', 'Saúde', 'Heart', '#ef4444'),
  ('home', 'Casa', 'Home', '#6366f1'),
  ('leisure', 'Lazer', 'PartyPopper', '#8b5cf6'),
  ('shopping', 'Compras', 'ShoppingBag', '#ec4899'),
  ('debts', 'Dívidas', 'CreditCard', '#dc2626'),
  ('salary', 'Salário', 'Wallet', '#22c55e'),
  ('other', 'Outros', 'CircleOff', '#64748b')
ON CONFLICT (id) DO UPDATE 
SET label = EXCLUDED.label, 
    icon = EXCLUDED.icon, 
    color = EXCLUDED.color;
