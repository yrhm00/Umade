-- Fonction atomique pour créditer un utilisateur
-- Remplace le pattern read-then-update qui cause des race conditions
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id   UUID,
  p_amount    NUMERIC,
  p_type      TEXT,
  p_description TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, lifetime_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = user_credits.balance + p_amount,
        lifetime_earned = user_credits.lifetime_earned + p_amount,
        updated_at      = now();

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);
END;
$$;
