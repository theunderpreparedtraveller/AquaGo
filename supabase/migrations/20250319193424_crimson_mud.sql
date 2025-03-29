/*
  # Sample Data Population

  This migration adds sample data to:
  1. Profiles
  2. User Wallets
  3. Payment Methods
  4. User Addresses

  Note: Using DO blocks to safely handle existing data
*/

-- Insert sample profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'd0d4dc14-4651-4aa3-a873-1e590dc27d21') THEN
    INSERT INTO profiles (id, email, name, phone, created_at)
    VALUES ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'trevor.does.work@gmail.com', 'Trevor Smith', '+1234567890', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d') THEN
    INSERT INTO profiles (id, email, name, phone, created_at)
    VALUES ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 'jane.doe@example.com', 'Jane Doe', '+1987654321', now());
  END IF;
END $$;

-- Insert sample wallets if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_wallets WHERE user_id = 'd0d4dc14-4651-4aa3-a873-1e590dc27d21') THEN
    INSERT INTO user_wallets (user_id, balance)
    VALUES ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 1500.00);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_wallets WHERE user_id = '8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d') THEN
    INSERT INTO user_wallets (user_id, balance)
    VALUES ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 2500.00);
  END IF;
END $$;

-- Insert sample payment methods if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = 'd0d4dc14-4651-4aa3-a873-1e590dc27d21' AND type = 'card') THEN
    INSERT INTO payment_methods (user_id, type, title, details, is_default)
    VALUES ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'card', 'Personal Card', '{"last4": "4242", "brand": "visa"}', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = 'd0d4dc14-4651-4aa3-a873-1e590dc27d21' AND type = 'upi') THEN
    INSERT INTO payment_methods (user_id, type, title, details, is_default)
    VALUES ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'upi', 'UPI', '{"id": "user@upi"}', false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = '8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d' AND type = 'card') THEN
    INSERT INTO payment_methods (user_id, type, title, details, is_default)
    VALUES ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 'card', 'Work Card', '{"last4": "1234", "brand": "mastercard"}', true);
  END IF;
END $$;

-- Insert sample addresses if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_addresses WHERE user_id = 'd0d4dc14-4651-4aa3-a873-1e590dc27d21' AND title = 'Home') THEN
    INSERT INTO user_addresses (user_id, title, address, location, is_default)
    VALUES ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'Home', '123 Main St, Bangalore', point(77.5946, 12.9716), true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_addresses WHERE user_id = 'd0d4dc14-4651-4aa3-a873-1e590dc27d21' AND title = 'Office') THEN
    INSERT INTO user_addresses (user_id, title, address, location, is_default)
    VALUES ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'Office', '456 Work Ave, Bangalore', point(77.5946, 12.9716), false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_addresses WHERE user_id = '8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d' AND title = 'Home') THEN
    INSERT INTO user_addresses (user_id, title, address, location, is_default)
    VALUES ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 'Home', '789 Park Rd, Bangalore', point(77.5946, 12.9716), true);
  END IF;
END $$;