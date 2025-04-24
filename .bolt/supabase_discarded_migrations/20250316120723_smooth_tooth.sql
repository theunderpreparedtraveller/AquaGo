/*
  # Sample Data Population

  This migration adds sample data to:
  1. Profiles
  2. User Wallets
  3. Payment Methods
  4. User Addresses
*/

-- Insert sample profiles
INSERT INTO profiles (id, email, name, phone, created_at)
VALUES
  ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'trevor.does.work@gmail.com', 'Trevor Smith', '+1234567890', now()),
  ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 'jane.doe@example.com', 'Jane Doe', '+1987654321', now());

-- Insert sample wallets
INSERT INTO user_wallets (user_id, balance)
VALUES
  ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 1500.00),
  ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 2500.00);

-- Insert sample payment methods
INSERT INTO payment_methods (user_id, type, title, details, is_default)
VALUES
  ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'card', 'Personal Card', '{"last4": "4242", "brand": "visa"}', true),
  ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'upi', 'UPI', '{"id": "user@upi"}', false),
  ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 'card', 'Work Card', '{"last4": "1234", "brand": "mastercard"}', true);

-- Insert sample addresses
INSERT INTO user_addresses (user_id, title, address, location, is_default)
VALUES
  ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'Home', '123 Main St, Bangalore', point(77.5946, 12.9716), true),
  ('d0d4dc14-4651-4aa3-a873-1e590dc27d21', 'Office', '456 Work Ave, Bangalore', point(77.5946, 12.9716), false),
  ('8f9c61a2-c5b7-4b3c-9523-4f0c9a3f7d5d', 'Home', '789 Park Rd, Bangalore', point(77.5946, 12.9716), true);