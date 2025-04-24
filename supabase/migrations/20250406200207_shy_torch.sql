/*
  # Order Transactions and History System

  1. Updates
    - Add transaction recording for orders
    - Add transaction recording for order cancellations
    - Improve activity history tracking

  2. Changes
    - Update create_water_delivery function to record transactions
    - Update cancel_water_delivery function to handle refunds and transactions
    - Add functions for activity history
*/

-- Update create_water_delivery function to record transaction
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

    -- Record wallet transaction if not cash payment
    IF p_payment_method != 'cash' THEN
      PERFORM record_wallet_transaction(
        p_user_id,
        'debit',
        p_amount,
        'Water delivery payment',
        'water_delivery',
        v_order_id
      );
    END IF;

    RETURN v_order_id;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    RAISE;
  END;
END;
$$;

-- Update cancel_water_delivery function to handle refunds and transactions
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
      -- Add money back to wallet
      UPDATE user_wallets
      SET 
        balance = balance + v_order.amount,
        updated_at = NOW()
      WHERE user_id = v_order.user_id;

      -- Record refund transaction
      PERFORM record_wallet_transaction(
        v_order.user_id,
        'credit',
        v_order.amount,
        'Refund for cancelled water delivery',
        'order_refund',
        v_order.id
      );
    END IF;

    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$;

-- Function to get user's activity history
CREATE OR REPLACE FUNCTION get_user_activity_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  description TEXT,
  amount NUMERIC,
  status delivery_status,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wd.id,
    'delivery'::TEXT as type,
    CASE wd.status
      WHEN 'completed' THEN 'Water Delivery Completed'
      WHEN 'confirmed' THEN 'Water Delivery in Progress'
      WHEN 'pending' THEN 'Water Delivery Pending'
      WHEN 'cancelled' THEN 'Water Delivery Cancelled'
    END as title,
    wd.volume || 'L water delivery to ' || 
    CASE 
      WHEN wd.delivery_address LIKE '%Home%' THEN 'Home'
      WHEN wd.delivery_address LIKE '%Office%' THEN 'Office'
      ELSE 'Custom Address'
    END as description,
    wd.amount,
    wd.status,
    wd.created_at
  FROM water_deliveries wd
  WHERE wd.user_id = p_user_id
  ORDER BY wd.created_at DESC
  LIMIT p_limit;
END;
$$;