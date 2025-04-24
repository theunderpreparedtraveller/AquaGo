/*
  # Payment and Order System Improvements

  1. New Functions
    - Process wallet payment
    - Add new address
    - Get order history
    - Get wallet balance

  2. Updates
    - Better error handling
    - Transaction support
    - Status tracking
*/

-- Function to process wallet payment
CREATE OR REPLACE FUNCTION process_wallet_payment(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT balance INTO v_balance
  FROM user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;  -- Lock row for update

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Required: ₹%, Available: ₹%', p_amount, v_balance;
  END IF;

  -- Update balance
  UPDATE user_wallets
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to add new address
CREATE OR REPLACE FUNCTION add_user_address(
  p_user_id UUID,
  p_title TEXT,
  p_address TEXT,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_is_default BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_address_id UUID;
BEGIN
  -- Validate inputs
  IF p_title IS NULL OR p_address IS NULL THEN
    RAISE EXCEPTION 'Title and address are required';
  END IF;

  -- Create point from coordinates
  INSERT INTO user_addresses (
    user_id,
    title,
    address,
    location,
    is_default
  ) VALUES (
    p_user_id,
    p_title,
    p_address,
    point(p_longitude, p_latitude),
    p_is_default
  ) RETURNING id INTO v_address_id;

  RETURN v_address_id;
END;
$$;

-- Function to get order history
CREATE OR REPLACE FUNCTION get_user_order_history(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  volume NUMERIC,
  amount NUMERIC,
  status delivery_status,
  delivery_address TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wd.id,
    wd.volume,
    wd.amount,
    wd.status,
    wd.delivery_address,
    wd.scheduled_for,
    wd.created_at
  FROM water_deliveries wd
  WHERE wd.user_id = p_user_id
  ORDER BY wd.created_at DESC;
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

  IF v_balance IS NULL THEN
    -- Create wallet if it doesn't exist
    INSERT INTO user_wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING balance INTO v_balance;
  END IF;

  RETURN v_balance;
END;
$$;