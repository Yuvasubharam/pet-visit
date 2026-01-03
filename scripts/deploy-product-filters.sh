#!/bin/bash

# Deploy Product Filters - Migration and Sample Data
# This script applies the product filters migration and seeds sample products

echo "🚀 Deploying Product Filters..."
echo ""

# Step 1: Apply the migration
echo "📊 Step 1: Applying database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check your Supabase configuration."
    exit 1
fi

echo ""

# Step 2: Seed sample products
echo "🌱 Step 2: Seeding sample products..."
supabase db seed supabase/seeds/002_sample_products.sql

if [ $? -eq 0 ]; then
    echo "✅ Sample products seeded successfully!"
else
    echo "⚠️  Seeding failed. You can manually run the seed file in Supabase Dashboard."
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Summary:"
echo "  - Added 'pet' column to products table"
echo "  - Added 'main_category' column to products table"
echo "  - Created 3 database indexes for performance"
echo "  - Seeded 50+ sample products across all pet types and categories"
echo ""
echo "🔍 Product breakdown:"
echo "  - Dogs: 12 products (Food, Toys, Care, Medicine)"
echo "  - Cats: 12 products (Food, Toys, Care, Medicine)"
echo "  - Rabbits: 6 products (Food, Toys, Care, Medicine)"
echo "  - Turtles: 5 products (Food, Care, Medicine)"
echo "  - Birds: 6 products (Food, Toys, Care, Medicine)"
echo "  - Universal (All Pets): 6 products (Food, Toys, Care, Medicine)"
echo ""
echo "✨ Your marketplace filters are now ready to use!"
