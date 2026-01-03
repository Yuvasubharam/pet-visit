/**
 * Script to setup grooming packages in the database
 * Run this with: npm run setup-grooming
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupGroomingPackages() {
  console.log('🚀 Setting up grooming packages...\n');

  try {
    // Check if grooming_packages table exists by trying to query it
    console.log('1️⃣ Checking if grooming_packages table exists...');
    const { data: existingPackages, error: checkError } = await supabase
      .from('grooming_packages')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ grooming_packages table does not exist!');
      console.error('   Error:', checkError.message);
      console.log('\n📋 Please run the migration first:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Run the migration file: supabase/migrations/003_create_grooming_bookings.sql');
      return;
    }

    console.log('✅ grooming_packages table exists\n');

    // Check current packages
    console.log('2️⃣ Checking existing packages...');
    const { data: packages, error: fetchError } = await supabase
      .from('grooming_packages')
      .select('*')
      .order('price', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError.message);
      return;
    }

    if (packages && packages.length > 0) {
      console.log(`✅ Found ${packages.length} existing packages:\n`);
      packages.forEach((pkg: any) => {
        console.log(`   📦 ${pkg.name} (${pkg.package_type})`);
        console.log(`      💰 Price: ₹${pkg.price}`);
        console.log(`      ⏱️  Duration: ${pkg.duration_minutes} minutes`);
        console.log(`      📝 ${pkg.description}\n`);
      });
    } else {
      console.log('⚠️  No packages found. Inserting default packages...\n');

      // Insert default packages
      const defaultPackages = [
        {
          name: 'Standard Bath',
          description: 'Deep cleaning, drying, nail clipping & ear hygiene.',
          price: 40.00,
          package_type: 'basic',
          duration_minutes: 45
        },
        {
          name: 'Full Styling',
          description: 'Bath + Professional haircut, trimming & scenting.',
          price: 65.00,
          package_type: 'full',
          duration_minutes: 90
        },
        {
          name: 'Spa Day',
          description: 'Full Styling + Paw massage, facial & organic treats.',
          price: 90.00,
          package_type: 'luxury',
          duration_minutes: 120
        }
      ];

      const { data: insertedPackages, error: insertError } = await supabase
        .from('grooming_packages')
        .insert(defaultPackages)
        .select();

      if (insertError) {
        console.error('❌ Error inserting packages:', insertError.message);
        return;
      }

      console.log('✅ Successfully inserted default packages:\n');
      insertedPackages?.forEach((pkg: any) => {
        console.log(`   📦 ${pkg.name} (${pkg.package_type}) - ₹${pkg.price}`);
      });
    }

    // Verify bookings table has grooming columns
    console.log('\n3️⃣ Checking bookings table for grooming columns...');
    const { data: sampleBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('package_type, contact_number, grooming_package_id')
      .limit(1);

    if (bookingError) {
      console.error('❌ Bookings table is missing grooming columns!');
      console.error('   Error:', bookingError.message);
      console.log('\n📋 Please run the migration to add grooming columns to bookings table');
    } else {
      console.log('✅ Bookings table has grooming columns\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Grooming setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the setup
setupGroomingPackages();
