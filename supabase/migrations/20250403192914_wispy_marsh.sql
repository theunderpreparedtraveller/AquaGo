/*
  # Improve Order Process Functions

  1. Updates
    - Add better validation for order creation
    - Improve error handling
    - Add transaction support for wallet operations
    - Add volume availability check

  2. Changes
    - Update create_water_delivery function with better validation
    - Add function to check water availability
*/

-- Function to check if water volume is available
CREATE OR REPLACE FUNCTION check_water_availability(
  p_container_id UUID,
  p_volume NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_volume NUMERIC;
BEGIN
  -- Get available volume
  SELECT available_volume INTO v_available_volume
  FROM water_containers
  WHERE id = p_container_id;

  -- Check if container exists and has enough volume
  IF v_available_volume IS NULL THEN
    RAISE EXCEPTION 'Container not found';
  END IF;

  IF v_available_volume < p_volume THEN
    RAISE EXCEPTION 'Insufficient water volume. Available: %, Requested: %', v_available_volume, p_volume;
  END IF;

  RETURN TRUE;
END;
$$;

-- Update create_water_delivery function with better validation
CREATE OR REPLACE FUNCTION create_water_delivery(
  p_user_id UUID,
  p_container_id UUID,
  p_volume NUMERIC,
  p_delivery_address TEXT,
  p_delivery_location POINT,
  p_scheduled_for TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount NUMERIC;
  v_wallet_balance NUMERIC;
  v_delivery_id UUID;
  v_container_rates JSONB;
BEGIN
  -- Input validation
  IF p_volume <= 0 THEN
    RAISE EXCEPTION 'Invalid volume: Volume must be greater than 0';
  END IF;

  IF p_volume < 1000 THEN
    RAISE EXCEPTION 'Minimum order volume is 1000 liters';
  END IF;

  -- Check water availability
  PERFORM check_water_availability(p_container_id, p_volume);

  -- Get container rates
  SELECT rates INTO v_container_rates
  FROM water_containers
  WHERE id = p_container_id;

  IF v_container_rates IS NULL THEN
    RAISE EXCEPTION 'Container rates not found';
  END IF;

  -- Calculate amount based on volume and rates
  SELECT (rate->>'price')::NUMERIC INTO v_amount
  FROM jsonb_array_elements(v_container_rates) AS rate
  WHERE (rate->>'volume')::NUMERIC = p_volume;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Invalid volume: No rate found for % liters', p_volume;
  END IF;

  -- Check wallet balance
  SELECT balance INTO v_wallet_balance
  FROM user_wallets
  WHERE user_id = p_user_id;

  IF v_wallet_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Required: ₹%, Available: ₹%', v_amount, v_wallet_balance;
  END IF;

  -- Start transaction
  BEGIN
    -- Create delivery order
    INSERT INTO water_deliveries (
      user_id,
      volume,
      amount,
      delivery_address,
      delivery_location,
      scheduled_for
    ) VALUES (
      p_user_id,
      p_volume,
      v_amount,
      p_delivery_address,
      p_delivery_location,
      p_scheduled_for
    ) RETURNING id INTO v_delivery_id;

    -- Update wallet balance
    UPDATE user_wallets
    SET balance = balance - v_amount
    WHERE user_id = p_user_id;

    -- Update container volume
    UPDATE water_containers
    SET available_volume = available_volume - p_volume
    WHERE id = p_container_id;

    -- Commit transaction
    RETURN v_delivery_id;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    RAISE;
  END;
END;
$$;