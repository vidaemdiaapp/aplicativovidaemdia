INSERT INTO public.categories (id, name, type, icon, color, is_system)
VALUES
  ('food', 'Alimentação', 'expense', 'utensils', '#ef4444', true),
  ('transport', 'Transporte', 'expense', 'car', '#f59e0b', true),
  ('market', 'Mercado', 'expense', 'shopping-cart', '#84cc16', true),
  ('health', 'Saúde', 'expense', 'heart-pulse', '#ef4444', true),
  ('home', 'Casa', 'expense', 'home', '#6366f1', true),
  ('leisure', 'Lazer', 'expense', 'party-popper', '#8b5cf6', true),
  ('shopping', 'Compras', 'expense', 'shopping-bag', '#ec4899', true),
  ('debts', 'Dívidas', 'expense', 'credit-card', '#dc2626', true),
  ('salary', 'Salário', 'income', 'wallet', '#22c55e', true),
  ('other', 'Outros', 'expense', 'circle-off', '#64748b', true)
ON CONFLICT (id) DO NOTHING;
