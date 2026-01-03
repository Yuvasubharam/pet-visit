# Browser Console Quick Test

If you want to quickly test the address save functionality without modifying your code, you can run this in your browser console (F12 → Console tab):

## Quick RLS Policy Check

```javascript
// Check if user is authenticated
const { data: { user } } = await window.supabase.auth.getUser();
console.log('User:', user);

if (!user) {
  console.error('❌ Not logged in!');
} else {
  console.log('✅ User authenticated:', user.id);

  // Try to insert a test address
  const testAddress = {
    user_id: user.id,
    type: 'Home',
    flat_number: 'Console-Test-1',
    street: 'Console Test Street',
    landmark: 'Near Console',
    city: 'Console City',
    state: 'Console State',
    pincode: '999999',
    latitude: null,
    longitude: null,
    full_address: 'Console Test Address'
  };

  const { data, error } = await window.supabase
    .from('addresses')
    .insert(testAddress)
    .select();

  if (error) {
    console.error('❌ Failed to insert address:', error);

    if (error.code === '42501' || error.message.includes('policy')) {
      console.error('\n🔒 RLS POLICY ISSUE!');
      console.error('Run the SQL from supabase/migrations/fix_addresses_rls.sql');
    }
  } else {
    console.log('✅ Address inserted successfully!', data);

    // Clean up
    await window.supabase.from('addresses').delete().eq('id', data[0].id);
    console.log('✅ Test cleanup complete');
  }
}
```

## Check Existing Addresses

```javascript
const { data: { user } } = await window.supabase.auth.getUser();

if (user) {
  const { data: addresses, error } = await window.supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${addresses.length} addresses:`, addresses);
  }
} else {
  console.error('Not logged in');
}
```

## Test the Address Service Directly

```javascript
// Make sure you're on a page where addressService is imported
// For example, the Cart or ShopCheckout page

const { data: { user } } = await window.supabase.auth.getUser();

if (user) {
  const testAddress = {
    type: 'Home',
    flatNumber: 'Service-999',
    street: 'Service Test',
    landmark: 'Test Landmark',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    fullAddress: 'Service-999, Service Test, Test City, Test State - 123456'
  };

  try {
    // You'll need to access addressService - this depends on your component structure
    // If available globally or through window, use it
    console.log('Testing address service...');

    // Alternative: just use supabase directly
    const { data, error } = await window.supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        type: testAddress.type,
        flat_number: testAddress.flatNumber,
        street: testAddress.street,
        landmark: testAddress.landmark,
        city: testAddress.city,
        state: testAddress.state,
        pincode: testAddress.pincode,
        full_address: testAddress.fullAddress,
        latitude: null,
        longitude: null
      })
      .select();

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
} else {
  console.error('Not logged in');
}
```

## Expected Results

### If RLS Policies are Missing:
```
❌ Failed to insert address: {
  code: "42501",
  message: "new row violates row-level security policy for table \"addresses\""
}
🔒 RLS POLICY ISSUE!
Run the SQL from supabase/migrations/fix_addresses_rls.sql
```

### If Everything Works:
```
✅ User authenticated: abc-123-def-456
✅ Address inserted successfully! [{...}]
✅ Test cleanup complete
```

### If Not Logged In:
```
❌ Not logged in!
```
