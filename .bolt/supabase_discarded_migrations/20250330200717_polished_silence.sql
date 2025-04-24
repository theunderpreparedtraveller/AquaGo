/*
  # Water Delivery System

  1. New Tables
    - `water_deliveries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `volume` (numeric) - Water volume in liters
      - `amount` (numeric) - Total amount charged
      - `status` (text) - pending, confirmed, completed, cancelled
      - `delivery_address` (text)
      - `delivery_location` (point)
      - `scheduled_for` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Functions
    - Create water delivery order
    - Process payment from wallet
    - Get delivery price calculation

  3. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create enum for delivery status
CREATE TYPE delivery_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

-- Create water_deliveries table
CREATE TABLE IF NOT EXISTS water_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  volume numeric NOT NULL CHECK (volume >= 1000),
  amount numeric NOT NULL CHECK (amount >= 0),
  status delivery_status DEFAULT 'pending' NOT NULL,
  delivery_address text NOT NULL,
  delivery_location point NOT NULL,
  scheduled_for timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE water_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own deliveries"
  ON water_deliveries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create deliveries"
  ON water_deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate delivery price
CREATE OR REPLACE FUNCTION calculate_delivery_price(p_volume numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_rate numeric := 0.45; -- Rate per liter
  minimum_volume numeric := 1000; -- Minimum volume in liters
BEGIN
  IF p_volume < minimum_volume THEN
    RAISE EXCEPTION 'Minimum water volume is % liters', minimum_volume;
  END IF;
  
  RETURN ROUND(p_volume * base_rate, 2);
END;
$$;

-- Function to create water delivery order
CREATE OR REPLACE FUNCTION create_water_delivery(
  p_user_id uuid,
  p_volume numeric,
  p_delivery_address text,
  p_delivery_location point,
  p_scheduled_for timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount numeric;
  v_wallet_balance numeric;
  v_delivery_id uuid;
BEGIN
  -- Calculate delivery amount
  v_amount := calculate_delivery_price(p_volume);
  
  -- Check wallet balance
  SELECT balance INTO v_wallet_balance
  FROM user_wallets
  WHERE user_id = p_user_id;
  
  IF v_wallet_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Required: ₹%, Available: ₹%', v_amount, v_wallet_balance;
  END IF;
  
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
  
  -- Deduct amount from wallet
  UPDATE user_wallets
  SET balance = balance - v_amount
  WHERE user_id = p_user_id;
  
  RETURN v_delivery_id;
END;
$$;