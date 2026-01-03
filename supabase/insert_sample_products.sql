-- Insert sample products with pet_type and main_category filters
-- This demonstrates the new filtering system for the marketplace

-- DOG PRODUCTS

-- Dog Food Products
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Premium Dry Dog Food', 'Pedigree', 'Complete nutrition for adult dogs with real chicken and vegetables', 899.00, 'Dry Food', 'https://picsum.photos/seed/dogfood1/400/400', 50, 4.5, 'dog', 'Food'),
  ('Puppy Starter Pack', 'Royal Canin', 'Specially formulated for puppies aged 2-12 months', 1299.00, 'Dry Food', 'https://picsum.photos/seed/dogfood2/400/400', 30, 4.8, 'dog', 'Food'),
  ('Wet Dog Food Variety', 'Drools', 'Pack of 12 cans with chicken, lamb, and beef flavors', 649.00, 'Wet Food', 'https://picsum.photos/seed/dogfood3/400/400', 40, 4.3, 'dog', 'Food')
ON CONFLICT DO NOTHING;

-- Dog Toys
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Chew Rope Toy', 'PetSafe', 'Durable rope toy for aggressive chewers', 299.00, 'Interactive', 'https://picsum.photos/seed/dogtoy1/400/400', 100, 4.6, 'dog', 'Toys'),
  ('Tennis Ball Pack', 'Kong', 'Pack of 6 premium tennis balls for fetch', 399.00, 'Balls', 'https://picsum.photos/seed/dogtoy2/400/400', 80, 4.7, 'dog', 'Toys'),
  ('Squeaky Plush Dog', 'Petmate', 'Soft plush toy with squeaker inside', 249.00, 'Plush', 'https://picsum.photos/seed/dogtoy3/400/400', 60, 4.4, 'dog', 'Toys')
ON CONFLICT DO NOTHING;

-- Dog Care Products
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Dog Shampoo & Conditioner', 'Himalaya', 'Natural ingredients for healthy coat and skin', 349.00, 'Grooming', 'https://picsum.photos/seed/dogcare1/400/400', 70, 4.5, 'dog', 'Care'),
  ('Dental Care Kit', 'TropiClean', 'Complete dental hygiene kit with toothbrush and paste', 499.00, 'Dental', 'https://picsum.photos/seed/dogcare2/400/400', 45, 4.6, 'dog', 'Care'),
  ('Nail Clippers Pro', 'Safari', 'Professional-grade nail clippers with safety guard', 279.00, 'Grooming', 'https://picsum.photos/seed/dogcare3/400/400', 90, 4.8, 'dog', 'Care')
ON CONFLICT DO NOTHING;

-- Dog Medicine
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Deworming Tablets', 'Cipla', 'Broad-spectrum dewormer for all dog breeds', 199.00, 'Dewormer', 'https://picsum.photos/seed/dogmed1/400/400', 120, 4.7, 'dog', 'Medicine'),
  ('Flea & Tick Spray', 'Bayer', 'Effective flea and tick prevention spray', 599.00, 'Parasite Control', 'https://picsum.photos/seed/dogmed2/400/400', 55, 4.5, 'dog', 'Medicine'),
  ('Joint Support Tablets', 'Naturvet', 'Glucosamine and chondroitin for joint health', 899.00, 'Supplements', 'https://picsum.photos/seed/dogmed3/400/400', 35, 4.9, 'dog', 'Medicine')
ON CONFLICT DO NOTHING;

-- CAT PRODUCTS

-- Cat Food Products
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Premium Cat Kibble', 'Whiskas', 'Complete nutrition for adult cats with tuna flavor', 699.00, 'Dry Food', 'https://picsum.photos/seed/catfood1/400/400', 60, 4.6, 'cat', 'Food'),
  ('Kitten Formula', 'Me-O', 'Special formula for growing kittens 0-12 months', 799.00, 'Dry Food', 'https://picsum.photos/seed/catfood2/400/400', 40, 4.7, 'cat', 'Food'),
  ('Cat Treat Mix', 'Temptations', 'Crunchy treats in multiple flavors', 299.00, 'Treats', 'https://picsum.photos/seed/catfood3/400/400', 100, 4.8, 'cat', 'Food')
ON CONFLICT DO NOTHING;

-- Cat Toys
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Feather Wand Toy', 'Cat Dancer', 'Interactive feather toy on extendable wand', 199.00, 'Interactive', 'https://picsum.photos/seed/cattoy1/400/400', 85, 4.5, 'cat', 'Toys'),
  ('Laser Pointer', 'PetSafe', 'Automatic laser toy with random patterns', 449.00, 'Electronic', 'https://picsum.photos/seed/cattoy2/400/400', 50, 4.6, 'cat', 'Toys'),
  ('Catnip Mouse Set', 'Petlinks', 'Pack of 3 catnip-filled mice', 249.00, 'Plush', 'https://picsum.photos/seed/cattoy3/400/400', 75, 4.4, 'cat', 'Toys')
ON CONFLICT DO NOTHING;

-- Cat Care Products
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Cat Litter Premium', 'Whiskas', 'Clumping litter with odor control - 5kg', 499.00, 'Litter', 'https://picsum.photos/seed/catcare1/400/400', 40, 4.7, 'cat', 'Care'),
  ('Grooming Brush', 'FURminator', 'Professional deshedding tool for cats', 699.00, 'Grooming', 'https://picsum.photos/seed/catcare2/400/400', 60, 4.9, 'cat', 'Care'),
  ('Cat Shampoo', 'Himalaya', 'Gentle shampoo for sensitive cat skin', 329.00, 'Grooming', 'https://picsum.photos/seed/catcare3/400/400', 55, 4.5, 'cat', 'Care')
ON CONFLICT DO NOTHING;

-- SMALL PETS (Rabbits, Birds, Turtles, Other)

-- Rabbit Products
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Rabbit Pellets', 'Oxbow', 'Timothy-based pellets for adult rabbits', 599.00, 'Food', 'https://picsum.photos/seed/rabbit1/400/400', 35, 4.6, 'rabbits', 'Food'),
  ('Hay Feeder', 'Living World', 'Wall-mounted hay feeder for rabbits', 399.00, 'Accessories', 'https://picsum.photos/seed/rabbit2/400/400', 45, 4.5, 'rabbits', 'Care'),
  ('Rabbit Chew Toys', 'Kaytee', 'Natural wood chew toys for dental health', 249.00, 'Toys', 'https://picsum.photos/seed/rabbit3/400/400', 60, 4.4, 'rabbits', 'Toys')
ON CONFLICT DO NOTHING;

-- Bird Products
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Bird Seed Mix', 'Vitakraft', 'Premium seed mix for parrots and parakeets', 449.00, 'Food', 'https://picsum.photos/seed/bird1/400/400', 50, 4.7, 'birds', 'Food'),
  ('Bird Swing Toy', 'Prevue', 'Colorful swing with bells for entertainment', 299.00, 'Toys', 'https://picsum.photos/seed/bird2/400/400', 70, 4.6, 'birds', 'Toys'),
  ('Bird Bath', 'JW Pet', 'Clip-on bird bath for cage', 349.00, 'Accessories', 'https://picsum.photos/seed/bird3/400/400', 40, 4.5, 'birds', 'Care')
ON CONFLICT DO NOTHING;

-- Turtle Products
INSERT INTO products (name, brand, description, price, category, image, stock, rating, pet_type, main_category)
VALUES
  ('Turtle Pellets', 'Tetra', 'Complete nutrition pellets for turtles', 399.00, 'Food', 'https://picsum.photos/seed/turtle1/400/400', 30, 4.5, 'turtles', 'Food'),
  ('UV Basking Lamp', 'Zoo Med', 'UVB lamp for turtle health and shell growth', 899.00, 'Lighting', 'https://picsum.photos/seed/turtle2/400/400', 25, 4.8, 'turtles', 'Care'),
  ('Turtle Platform', 'Fluker', 'Floating basking platform with ramp', 699.00, 'Accessories', 'https://picsum.photos/seed/turtle3/400/400', 35, 4.6, 'turtles', 'Care')
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT
    pet_type,
    main_category,
    COUNT(*) as product_count,
    AVG(price) as avg_price
FROM products
GROUP BY pet_type, main_category
ORDER BY pet_type, main_category;

-- Display all products with filters
SELECT
    id,
    name,
    brand,
    pet_type,
    main_category,
    price,
    stock
FROM products
ORDER BY pet_type, main_category, price;
