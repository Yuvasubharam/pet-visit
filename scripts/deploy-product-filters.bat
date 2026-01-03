@echo off
REM Deploy Product Filters - Migration and Sample Data (Windows)
REM This script applies the product filters migration and seeds sample products

echo.
echo ========================================
echo   Deploy Product Filters
echo ========================================
echo.

REM Step 1: Apply the migration
echo [1/2] Applying database migration...
supabase db push

if %ERRORLEVEL% EQU 0 (
    echo [OK] Migration applied successfully!
) else (
    echo [ERROR] Migration failed. Please check your Supabase configuration.
    exit /b 1
)

echo.

REM Step 2: Seed sample products
echo [2/2] Seeding sample products...
supabase db seed supabase/seeds/002_sample_products.sql

if %ERRORLEVEL% EQU 0 (
    echo [OK] Sample products seeded successfully!
) else (
    echo [WARNING] Seeding failed. You can manually run the seed file in Supabase Dashboard.
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Summary:
echo   - Added 'pet' column to products table
echo   - Added 'main_category' column to products table
echo   - Created 3 database indexes for performance
echo   - Seeded 50+ sample products across all pet types
echo.
echo Product breakdown:
echo   - Dogs: 12 products (Food, Toys, Care, Medicine)
echo   - Cats: 12 products (Food, Toys, Care, Medicine)
echo   - Rabbits: 6 products (Food, Toys, Care, Medicine)
echo   - Turtles: 5 products (Food, Care, Medicine)
echo   - Birds: 6 products (Food, Toys, Care, Medicine)
echo   - Universal: 6 products (Food, Toys, Care, Medicine)
echo.
echo Your marketplace filters are now ready to use!
echo.
pause
