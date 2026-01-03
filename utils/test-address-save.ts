/**
 * Test script to verify address saving functionality
 * This helps diagnose RLS and authentication issues
 *
 * To use this, temporarily add it to your app and call testAddressSave()
 */

import { supabase } from '../lib/supabase';
import { addressService } from '../services/api';
import type { Address } from '../types';

export async function testAddressSave() {
  console.log('=== Address Save Test ===');

  // Step 1: Check authentication
  console.log('\n1. Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('❌ Auth Error:', authError);
    return { success: false, error: 'Authentication failed', details: authError };
  }

  if (!user) {
    console.error('❌ No user logged in');
    return { success: false, error: 'No user logged in' };
  }

  console.log('✅ User authenticated:', {
    id: user.id,
    email: user.email,
    phone: user.phone
  });

  // Step 2: Test direct Supabase insert (bypasses our service layer)
  console.log('\n2. Testing direct Supabase insert...');
  const testAddress = {
    user_id: user.id,
    type: 'Home',
    flat_number: 'Test-123',
    street: 'Test Street',
    landmark: 'Test Landmark',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    latitude: null,
    longitude: null,
    full_address: 'Test-123, Test Street, Test City, Test State - 123456'
  };

  console.log('Inserting test data:', testAddress);

  const { data: directData, error: directError } = await supabase
    .from('addresses')
    .insert(testAddress)
    .select()
    .single();

  if (directError) {
    console.error('❌ Direct insert failed:', directError);
    console.error('Error code:', directError.code);
    console.error('Error message:', directError.message);
    console.error('Error details:', directError.details);

    if (directError.code === '42501' || directError.message.includes('policy')) {
      console.error('\n🔒 RLS POLICY ISSUE DETECTED!');
      console.error('The addresses table has Row Level Security enabled but missing INSERT policy.');
      console.error('Solution: Apply the RLS policies from supabase/migrations/fix_addresses_rls.sql');
    }

    return { success: false, error: 'Direct insert failed', details: directError };
  }

  console.log('✅ Direct insert successful:', directData);

  // Step 3: Test our service layer
  console.log('\n3. Testing addressService.addAddress...');
  const serviceTestAddress: Omit<Address, 'id'> = {
    type: 'Office',
    flatNumber: 'Service-Test-456',
    street: 'Service Test Street',
    landmark: 'Service Test Landmark',
    city: 'Service Test City',
    state: 'Service Test State',
    pincode: '654321',
    latitude: 17.6868,
    longitude: 83.2185,
    fullAddress: 'Service-Test-456, Service Test Street, Service Test City, Service Test State - 654321'
  };

  try {
    const serviceData = await addressService.addAddress(user.id, serviceTestAddress);
    console.log('✅ Service layer insert successful:', serviceData);
  } catch (serviceError: any) {
    console.error('❌ Service layer insert failed:', serviceError);
    return { success: false, error: 'Service layer failed', details: serviceError };
  }

  // Step 4: Verify we can read the addresses back
  console.log('\n4. Testing address retrieval...');
  const { data: addresses, error: selectError } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id);

  if (selectError) {
    console.error('❌ Failed to retrieve addresses:', selectError);
    return { success: false, error: 'Failed to retrieve addresses', details: selectError };
  }

  console.log(`✅ Successfully retrieved ${addresses?.length || 0} addresses`);
  console.log('Addresses:', addresses);

  // Step 5: Clean up test data
  console.log('\n5. Cleaning up test data...');
  if (directData?.id) {
    await supabase.from('addresses').delete().eq('id', directData.id);
    console.log('✅ Cleaned up direct insert test data');
  }

  console.log('\n=== Test Complete ===');
  console.log('✅ All tests passed! Address saving is working correctly.');

  return {
    success: true,
    user,
    addressCount: addresses?.length || 0
  };
}

/**
 * Quick check function to verify RLS policies
 */
export async function checkRLSPolicies() {
  console.log('=== Checking RLS Policies ===');

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ No user logged in. Please log in first.');
    return;
  }

  // Try to insert without proper data
  const { error } = await supabase
    .from('addresses')
    .insert({
      user_id: user.id,
      type: 'Home',
      flat_number: 'RLS-Test',
      street: 'RLS Test Street',
      landmark: '',
      city: 'RLS City',
      state: 'RLS State',
      pincode: '000000',
    });

  if (error) {
    if (error.code === '42501' || error.message.includes('policy')) {
      console.error('❌ RLS Policy Issue:');
      console.error('Row Level Security is enabled but INSERT policy is missing or misconfigured.');
      console.error('\nTo fix this:');
      console.error('1. Open Supabase Dashboard → SQL Editor');
      console.error('2. Run the SQL from: supabase/migrations/fix_addresses_rls.sql');
    } else {
      console.error('❌ Other error:', error);
    }
  } else {
    console.log('✅ RLS policies are correctly configured!');
  }
}
