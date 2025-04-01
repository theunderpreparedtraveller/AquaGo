/*
  # Water Container System

  1. New Tables
    - `water_containers`
      - `id` (uuid, primary key)
      - `name` (text) - Container name/identifier
      - `location` (point) - Geographic location
      - `address` (text) - Human readable address
      - `capacity` (numeric) - Total capacity in liters
      - `available_volume` (numeric) - Currently available water volume
      - `is_online` (boolean) - Online status
      - `rates` (jsonb) - Price rates for different volumes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public read access
*/

-- Create water_containers table
CREATE TABLE IF NOT EXISTS water_containers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location point NOT NULL,
  address text NOT NULL,
  capacity numeric NOT NULL CHECK (capacity > 0),
  available_volume numeric NOT NULL CHECK (available_volume >= 0),
  is_online boolean DEFAULT true,
  rates jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE water_containers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON water_containers
  FOR SELECT
  TO public
  USING (true);

-- Insert sample containers
INSERT INTO water_containers (name, location, address, capacity, available_volume, is_online, rates) VALUES
(
  'Metro Water Tank 1',
  point(77.5946, 12.9716),
  'HSR Layout, Bengaluru',
  50000,
  45000,
  true,
  '[
    {"volume": 1000, "price": 450},
    {"volume": 2000, "price": 800},
    {"volume": 5000, "price": 1800}
  ]'::jsonb
),
(
  'City Supply Station 2',
  point(77.6033, 12.9762),
  'Koramangala, Bengaluru',
  75000,
  60000,
  true,
  '[
    {"volume": 1000, "price": 500},
    {"volume": 2000, "price": 900},
    {"volume": 5000, "price": 2000}
  ]'::jsonb
),
(
  'Lake View Container 3',
  point(77.5671, 12.9352),
  'JP Nagar, Bengaluru',
  40000,
  35000,
  true,
  '[
    {"volume": 1000, "price": 400},
    {"volume": 2000, "price": 750},
    {"volume": 5000, "price": 1700}
  ]'::jsonb
),
(
  'Urban Water Hub 4',
  point(77.6369, 12.9799),
  'Indiranagar, Bengaluru',
  60000,
  20000,
  false,
  '[
    {"volume": 1000, "price": 475},
    {"volume": 2000, "price": 850},
    {"volume": 5000, "price": 1900}
  ]'::jsonb
),
(
  'Central Storage 5',
  point(77.5876, 12.9716),
  'BTM Layout, Bengaluru',
  55000,
  50000,
  true,
  '[
    {"volume": 1000, "price": 425},
    {"volume": 2000, "price": 775},
    {"volume": 5000, "price": 1750}
  ]'::jsonb
);