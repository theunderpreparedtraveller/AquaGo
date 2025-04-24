/*
  # Add Wallet Functions

  This migration adds stored procedures for wallet operations:
  1. Function to add money to wallet
  2. Function to check wallet balance
  3. Function to update wallet balance

  Security:
    - Functions are executed with security definer
    - Proper validation and error handling
*/

-- Function to add money to wallet
CREATE OR REPLACE FUNCTION add_money_to_wallet(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount: Amount must be greater than 0';
  END IF;

  IF p_amount > 50000 THEN
    RAISE EXCEPTION 'Invalid amount: Maximum amount allowed is 50000';
  END IF;

  -- Update wallet balance
  UPDATE user_wallets
  SET 
    balance = balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no wallet exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_wallets (user_id, balance)
    VALUES (p_user_id, p_amount);
  END IF;
END;
$$;

-- Function to get wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance
  FROM user_wallets
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_balance, 0);
END;
$$;