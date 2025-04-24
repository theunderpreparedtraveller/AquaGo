/*
  # Add Contact and Chat Features

  1. Updates
    - Add contact_number to water_containers
    - Create chat_messages table
    - Add functions for chat operations

  2. Security
    - Enable RLS
    - Add policies for chat access
*/

-- Add contact_number to water_containers
ALTER TABLE water_containers 
ADD COLUMN contact_number text NOT NULL DEFAULT '+1234567890';

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES water_deliveries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_supplier boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
CREATE POLICY "Users can view messages for their deliveries"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    delivery_id IN (
      SELECT id FROM water_deliveries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to send chat message
CREATE OR REPLACE FUNCTION send_chat_message(
  p_delivery_id UUID,
  p_message TEXT,
  p_is_supplier BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Validate delivery exists and user has access
  IF NOT EXISTS (
    SELECT 1 FROM water_deliveries 
    WHERE id = p_delivery_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Delivery not found or access denied';
  END IF;

  -- Insert message
  INSERT INTO chat_messages (
    delivery_id,
    user_id,
    message,
    is_supplier
  ) VALUES (
    p_delivery_id,
    auth.uid(),
    p_message,
    p_is_supplier
  ) RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

-- Function to get chat messages
CREATE OR REPLACE FUNCTION get_chat_messages(
  p_delivery_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  message TEXT,
  is_supplier BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate delivery exists and user has access
  IF NOT EXISTS (
    SELECT 1 FROM water_deliveries 
    WHERE id = p_delivery_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Delivery not found or access denied';
  END IF;

  RETURN QUERY
  SELECT 
    cm.id,
    cm.message,
    cm.is_supplier,
    cm.created_at
  FROM chat_messages cm
  WHERE cm.delivery_id = p_delivery_id
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
END;
$$;