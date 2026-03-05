-- Migration: Add platform fee columns and platform_settings table
-- This migration adds the necessary columns for individual platform fee management

-- 1. Create platform_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add platform_fee_percentage to grooming_stores if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'grooming_stores' AND column_name = 'platform_fee_percentage'
    ) THEN
        ALTER TABLE grooming_stores ADD COLUMN platform_fee_percentage NUMERIC(5,2) DEFAULT 0;
    END IF;
END $$;

-- 3. Add platform fee columns to doctors table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'platform_fee_online'
    ) THEN
        ALTER TABLE doctors ADD COLUMN platform_fee_online NUMERIC(5,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'platform_fee_home'
    ) THEN
        ALTER TABLE doctors ADD COLUMN platform_fee_home NUMERIC(5,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'platform_fee_clinic'
    ) THEN
        ALTER TABLE doctors ADD COLUMN platform_fee_clinic NUMERIC(5,2) DEFAULT 0;
    END IF;
END $$;

-- 4. Add margin_percentage to grooming_stores if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'grooming_stores' AND column_name = 'margin_percentage'
    ) THEN
        ALTER TABLE grooming_stores ADD COLUMN margin_percentage NUMERIC(5,2) DEFAULT 0;
    END IF;
END $$;

-- 5. Add margin_percentage to doctors if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'margin_percentage'
    ) THEN
        ALTER TABLE doctors ADD COLUMN margin_percentage NUMERIC(5,2) DEFAULT 0;
    END IF;
END $$;

-- 6. Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value)
VALUES
    ('default_grooming_fee', '{"percentage": 0}'),
    ('default_doctor_fee_online', '{"percentage": 0}'),
    ('default_doctor_fee_home', '{"percentage": 0}'),
    ('default_doctor_fee_clinic', '{"percentage": 0}'),
    ('default_shop_margin', '{"percentage": 0}')
ON CONFLICT (setting_key) DO NOTHING;

-- 7. Enable RLS on platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for platform_settings
-- Allow authenticated users to read platform_settings
DROP POLICY IF EXISTS "Allow authenticated users to read platform_settings" ON platform_settings;
CREATE POLICY "Allow authenticated users to read platform_settings"
    ON platform_settings FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins to update platform_settings (assuming admin check via profiles table)
DROP POLICY IF EXISTS "Allow admins to manage platform_settings" ON platform_settings;
CREATE POLICY "Allow admins to manage platform_settings"
    ON platform_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 9. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

-- 10. Add updated_at trigger for platform_settings
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS platform_settings_updated_at ON platform_settings;
CREATE TRIGGER platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_settings_updated_at();
