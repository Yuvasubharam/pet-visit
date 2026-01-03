# Supabase Setup Guide for Pet Visit

This guide will help you set up the Supabase backend for the Pet Visit application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Supabase project URL and anon key (already configured in `.env`)

## Database Setup

### Step 1: Run the Migration Script

1. Go to your Supabase Dashboard
2. Navigate to the **SQL Editor** section
3. Create a new query
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste it into the SQL editor and click **Run**

This will create all the necessary tables:
- `users` - User profiles
- `pets` - User pets
- `addresses` - User addresses
- `bookings` - Appointment bookings
- `products` - Marketplace products
- `orders` - Customer orders
- `order_items` - Order line items
- `cart_items` - Shopping cart

### Step 2: Seed Sample Data (Optional)

To add sample products to your marketplace:

1. In the SQL Editor, create another new query
2. Copy the contents of `supabase/seeds/002_sample_products.sql`
3. Paste and run it

### Step 3: Configure Authentication

The app uses Supabase Auth with phone OTP. To enable this:

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Phone** authentication
3. Configure your SMS provider (Twilio, MessageBird, etc.)
4. Add your provider credentials

**Note:** For development/testing, you can use Supabase's built-in test phone numbers.

## Database Schema Overview

### Users Table
Stores user profile information linked to Supabase Auth.

### Pets Table
Each pet belongs to a user. Supports dogs and cats with custom images.

### Addresses Table
Users can have multiple addresses for home visits and deliveries.

### Bookings Table
Tracks appointments for online consultations, home visits, and clinic visits.

### Products Table
Marketplace items (food, toys, accessories). Public read access.

### Orders & Order Items
Complete e-commerce order tracking with items and payment status.

### Cart Items
Temporary shopping cart for users.

## Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- View/edit their own data
- View products (read-only)
- Not access other users' information

## API Service Layer

The app includes a complete API service layer in `services/api.ts`:

- **authService** - Authentication and user profile
- **petService** - Pet management (CRUD)
- **addressService** - Address management
- **bookingService** - Appointment booking
- **productService** - Product catalog
- **cartService** - Shopping cart
- **orderService** - Order management

## Environment Variables

Already configured in `.env`:

```env
VITE_SUPABASE_URL=https://kfnsqbgwqltbltngwbdh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_zqFshtXMaaQ3r8U7oL_uCw_YYOKq0HI
```

## MCP Server Configuration

The MCP server is configured in `.mcp.json` to interact with your Supabase database:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=kfnsqbgwqltbltngwbdh"
    }
  }
}
```

## Testing the Setup

1. Run the migration script (Step 1 above)
2. Start your development server: `npm run dev`
3. Try logging in with a test phone number
4. Add a pet
5. Browse the marketplace (after seeding products)

## Troubleshooting

### Authentication Issues
- Ensure phone authentication is enabled in Supabase dashboard
- Check SMS provider configuration
- For testing, use Supabase's test phone numbers

### Database Errors
- Verify migration script ran successfully
- Check RLS policies are enabled
- Ensure user is authenticated before making requests

### Connection Issues
- Verify environment variables are correct
- Check Supabase project is active
- Ensure anon key has correct permissions

## Next Steps

- Customize the database schema as needed
- Add more sample products
- Configure storage buckets for pet images
- Set up real-time subscriptions for live updates
- Configure email templates for notifications

## Support

For issues with:
- Supabase setup: [Supabase Documentation](https://supabase.com/docs)
- Application code: Check the `services/api.ts` file
- Database queries: Use Supabase SQL Editor for debugging
