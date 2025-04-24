/*
  # Wallet Transactions System

  1. New Tables
    - `wallet_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - credit or debit
      - `amount` (numeric)
      - `description` (text)
      - `reference_type` (text) - water_delivery, wallet_topup, etc.
      - `reference_id` (uuid) - ID of the referenced entity
      - `created_at` (timestamptz)

  2. Functions
    - Record wallet transaction
    - Get user transactions

  3. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  reference_type text NOT NULL,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own transactions"
  ON wallet_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to record wallet transaction
CREATE OR REPLACE FUNCTION record_wallet_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference_type TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Validate inputs
  IF p_type NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_type;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    description,
    reference_type,
    reference_id
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    p_description,
    p_reference_type,
    p_reference_id
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- Function to get user transactions
CREATE OR REPLACE FUNCTION get_user_transactions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  amount NUMERIC,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wt.id,
    wt.type,
    wt.amount,
    wt.description,
    wt.reference_type,
    wt.reference_id,
    wt.created_at
  FROM wallet_transactions wt
  WHERE wt.user_id = p_user_id
  ORDER BY wt.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Update existing functions to record transactions

-- Update add_money_to_wallet function
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

  -- Start transaction
  BEGIN
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

    -- Record transaction
    PERFORM record_wallet_transaction(
      p_user_id,
      'credit',
      p_amount,
      'Added money to wallet',
      'wallet_topup'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$;