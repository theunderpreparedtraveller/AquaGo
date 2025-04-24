/*
  # Payment Processing Functions

  1. New Functions
    - Process payments for different methods
    - Handle wallet transactions
    - Create and manage orders

  2. Updates
    - Better error handling
    - Transaction support
    - Payment validation
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
  -- Get current balance with row lock
  SELECT balance INTO v_balance
  FROM user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

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

-- Function to process payment
CREATE OR REPLACE FUNCTION process_payment(
  p_user_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_payment_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount: Amount must be greater than 0';
  END IF;

  -- Process payment based on method
  CASE p_payment_method
    WHEN 'wallet' THEN
      PERFORM process_wallet_payment(p_user_id, p_amount);
    WHEN 'upi' THEN
      -- Simulate UPI payment processing
      IF p_payment_details IS NULL OR p_payment_details->>'upi_id' IS NULL THEN
        RAISE EXCEPTION 'UPI ID is required';
      END IF;
      -- In real implementation, integrate with UPI payment gateway
      NULL;
    WHEN 'cash' THEN
      -- No processing needed for cash payments
      NULL;
    ELSE
      RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
  END CASE;

  RETURN TRUE;
END;
$$;

-- Function to create water delivery order
CREATE OR REPLACE FUNCTION create_water_delivery(
  p_user_id UUID,
  p_container_id UUID,
  p_volume NUMERIC,
  p_amount NUMERIC,
  p_delivery_address TEXT,
  p_delivery_location POINT,
  p_payment_method TEXT,
  p_payment_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- Process payment first
    PERFORM process_payment(p_user_id, p_amount, p_payment_method, p_payment_details);

    -- Create delivery order
    INSERT INTO water_deliveries (
      user_id,
      volume,
      amount,
      delivery_address,
      delivery_location,
      scheduled_for,
      status
    ) VALUES (
      p_user_id,
      p_volume,
      p_amount,
      p_delivery_address,
      p_delivery_location,
      NOW(),
      CASE p_payment_method
        WHEN 'cash' THEN 'pending'::delivery_status
        ELSE 'confirmed'::delivery_status
      END
    ) RETURNING id INTO v_order_id;

    -- Update container volume
    UPDATE water_containers
    SET 
      available_volume = available_volume - p_volume,
      updated_at = NOW()
    WHERE id = p_container_id;

    RETURN v_order_id;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    RAISE;
  END;
END;
$$;

-- Function to cancel order
CREATE OR REPLACE FUNCTION cancel_water_delivery(
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order water_deliveries;
BEGIN
  -- Get order with lock
  SELECT * INTO v_order
  FROM water_deliveries
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Order is already cancelled';
  END IF;

  IF v_order.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot cancel completed order';
  END IF;

  -- Calculate time difference
  IF EXTRACT(EPOCH FROM (NOW() - v_order.created_at)) > 60 THEN
    RAISE EXCEPTION 'Cannot cancel order after 60 seconds';
  END IF;

  -- Start transaction
  BEGIN
    -- Update order status
    UPDATE water_deliveries
    SET 
      status = 'cancelled',
      updated_at = NOW()
    WHERE id = p_order_id;

    -- Refund payment if not cash
    IF v_order.status != 'pending' THEN
      UPDATE user_wallets
      SET 
        balance = balance + v_order.amount,
        updated_at = NOW()
      WHERE user_id = v_order.user_id;
    END IF;

    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$;