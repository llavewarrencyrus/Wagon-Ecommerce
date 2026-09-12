-- Wagon E-Commerce SQL Seed Script
-- Run this in your Supabase SQL Editor if you prefer seeding directly via SQL.

DO $$
DECLARE
  prod1_id UUID := gen_random_uuid();
  col1_1 UUID := gen_random_uuid();
  col1_2 UUID := gen_random_uuid();
  col1_3 UUID := gen_random_uuid();
  sz1_s UUID := gen_random_uuid();
  sz1_m UUID := gen_random_uuid();
  sz1_l UUID := gen_random_uuid();
  sz1_xl UUID := gen_random_uuid();

  prod2_id UUID := gen_random_uuid();
  col2_1 UUID := gen_random_uuid();
  col2_2 UUID := gen_random_uuid();
  col2_3 UUID := gen_random_uuid();
  sz2_one UUID := gen_random_uuid();

  prod3_id UUID := gen_random_uuid();
  col3_1 UUID := gen_random_uuid();
  col3_2 UUID := gen_random_uuid();
  sz3_std UUID := gen_random_uuid();

  prod4_id UUID := gen_random_uuid();
  col4_1 UUID := gen_random_uuid();
  col4_2 UUID := gen_random_uuid();
  col4_3 UUID := gen_random_uuid();
  sz4_40 UUID := gen_random_uuid();
  sz4_41 UUID := gen_random_uuid();
  sz4_42 UUID := gen_random_uuid();
  sz4_43 UUID := gen_random_uuid();
  sz4_44 UUID := gen_random_uuid();

  prod5_id UUID := gen_random_uuid();
  col5_1 UUID := gen_random_uuid();
  col5_2 UUID := gen_random_uuid();
  sz5_std UUID := gen_random_uuid();

  prod6_id UUID := gen_random_uuid();
  col6_1 UUID := gen_random_uuid();
  col6_2 UUID := gen_random_uuid();
  sz6_std UUID := gen_random_uuid();
BEGIN
  -- 1. Urban Oversized Heavyweight Cotton Hoodie
  INSERT INTO products (product_id, product_name, product_description, product_price, product_discount, product_rating, sales_count, product_image, product_category, product_material)
  VALUES (
    prod1_id,
    'Urban Oversized Heavyweight Cotton Hoodie',
    'Engineered from premium 420 GSM French Terry cotton, this boxy-fit heavyweight hoodie provides unmatched comfort and aesthetic streetwear drape. Features reinforced kangaroo pockets and double-layered hood.',
    1499.00,
    15,
    4.9,
    342,
    ARRAY['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80', 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=80'],
    ARRAY['Men''s Apparel', 'Hoodies & Sweatshirts', 'Streetwear'],
    ARRAY['100% French Terry Cotton', 'Ribbed Spandex Trims']
  );

  INSERT INTO product_color (id, product_id, color, image) VALUES
    (col1_1, prod1_id, 'Washed Charcoal', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80'),
    (col1_2, prod1_id, 'Vintage Bone', 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80'),
    (col1_3, prod1_id, 'Forest Green', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=80');

  INSERT INTO product_size (id, product_id, size, dimension) VALUES
    (sz1_s, prod1_id, 'Small (S)', 'Chest 38 in / Length 27 in'),
    (sz1_m, prod1_id, 'Medium (M)', 'Chest 41 in / Length 28 in'),
    (sz1_l, prod1_id, 'Large (L)', 'Chest 44 in / Length 29 in'),
    (sz1_xl, prod1_id, 'X-Large (XL)', 'Chest 47 in / Length 30 in');

  INSERT INTO product_variant (variant_id, product_id, product_color_id, product_size_id, product_quantity) VALUES
    (gen_random_uuid(), prod1_id, col1_1, sz1_s, 15),
    (gen_random_uuid(), prod1_id, col1_1, sz1_m, 25),
    (gen_random_uuid(), prod1_id, col1_1, sz1_l, 20),
    (gen_random_uuid(), prod1_id, col1_1, sz1_xl, 10),
    (gen_random_uuid(), prod1_id, col1_2, sz1_s, 12),
    (gen_random_uuid(), prod1_id, col1_2, sz1_m, 20),
    (gen_random_uuid(), prod1_id, col1_2, sz1_l, 18),
    (gen_random_uuid(), prod1_id, col1_2, sz1_xl, 8),
    (gen_random_uuid(), prod1_id, col1_3, sz1_s, 10),
    (gen_random_uuid(), prod1_id, col1_3, sz1_m, 15),
    (gen_random_uuid(), prod1_id, col1_3, sz1_l, 15),
    (gen_random_uuid(), prod1_id, col1_3, sz1_xl, 5);

  -- 2. Aesthetic Studio Pro Wireless ANC Headphones
  INSERT INTO products (product_id, product_name, product_description, product_price, product_discount, product_rating, sales_count, product_image, product_category, product_material)
  VALUES (
    prod2_id,
    'Aesthetic Studio Pro Wireless ANC Headphones',
    'Immersive high-fidelity audio with active noise cancellation, transparency mode, and custom 40mm titanium drivers. Up to 45 hours battery life on a single fast charge.',
    3499.00,
    20,
    4.8,
    520,
    ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'],
    ARRAY['Electronics', 'Audio & Headphones', 'Gadgets'],
    ARRAY['Anodized Aluminum', 'Memory Foam', 'Protein Leather']
  );

  INSERT INTO product_color (id, product_id, color, image) VALUES
    (col2_1, prod2_id, 'Midnight Black', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'),
    (col2_2, prod2_id, 'Silver Slate', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'),
    (col2_3, prod2_id, 'Desert Sand', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80');

  INSERT INTO product_size (id, product_id, size, dimension) VALUES
    (sz2_one, prod2_id, 'One Size', 'Adjustable Headband');

  INSERT INTO product_variant (variant_id, product_id, product_color_id, product_size_id, product_quantity) VALUES
    (gen_random_uuid(), prod2_id, col2_1, sz2_one, 30),
    (gen_random_uuid(), prod2_id, col2_2, sz2_one, 25),
    (gen_random_uuid(), prod2_id, col2_3, sz2_one, 20);

  -- 3. Minimalist Heavy Canvas Everyday Tote Bag
  INSERT INTO products (product_id, product_name, product_description, product_price, product_discount, product_rating, sales_count, product_image, product_category, product_material)
  VALUES (
    prod3_id,
    'Minimalist Heavy Canvas Everyday Tote Bag',
    'Durable 16oz waxed canvas tote bag featuring an interior padded laptop compartment (up to 16-inch), magnetic snap closure, and reinforced webbing shoulder straps.',
    649.00,
    10,
    4.7,
    215,
    ARRAY['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80'],
    ARRAY['Bags & Accessories', 'Tote Bags', 'Women''s Apparel'],
    ARRAY['16oz Organic Waxed Canvas', 'Brass Hardware', 'YKK Zippers']
  );

  INSERT INTO product_color (id, product_id, color, image) VALUES
    (col3_1, prod3_id, 'Natural Ecru', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80'),
    (col3_2, prod3_id, 'Pitch Black', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80');

  INSERT INTO product_size (id, product_id, size, dimension) VALUES
    (sz3_std, prod3_id, 'Standard (15L)', '16 x 14 x 5 inches');

  INSERT INTO product_variant (variant_id, product_id, product_color_id, product_size_id, product_quantity) VALUES
    (gen_random_uuid(), prod3_id, col3_1, sz3_std, 40),
    (gen_random_uuid(), prod3_id, col3_2, sz3_std, 35);

  -- 4. Retro Court Low-Top Leather Sneakers
  INSERT INTO products (product_id, product_name, product_description, product_price, product_discount, product_rating, sales_count, product_image, product_category, product_material)
  VALUES (
    prod4_id,
    'Retro Court Low-Top Leather Sneakers',
    'Iconic vintage court silhouette crafted with full-grain nappa leather, cushioned EVA midsole, and vulcanized gum outsole for all-day grip and comfort.',
    2799.00,
    5,
    4.9,
    610,
    ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80'],
    ARRAY['Footwear', 'Sneakers', 'Men''s Apparel'],
    ARRAY['Full-Grain Nappa Leather', 'Ortholite Insole', 'Gum Rubber']
  );

  INSERT INTO product_color (id, product_id, color, image) VALUES
    (col4_1, prod4_id, 'White / Forest Green', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80'),
    (col4_2, prod4_id, 'Mocha Brown', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80'),
    (col4_3, prod4_id, 'Triple White', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80');

  INSERT INTO product_size (id, product_id, size, dimension) VALUES
    (sz4_40, prod4_id, 'EU 40', 'US 7.5 / 25.5cm'),
    (sz4_41, prod4_id, 'EU 41', 'US 8.5 / 26.5cm'),
    (sz4_42, prod4_id, 'EU 42', 'US 9.0 / 27.0cm'),
    (sz4_43, prod4_id, 'EU 43', 'US 10.0 / 28.0cm'),
    (sz4_44, prod4_id, 'EU 44', 'US 11.0 / 29.0cm');

  INSERT INTO product_variant (variant_id, product_id, product_color_id, product_size_id, product_quantity) VALUES
    (gen_random_uuid(), prod4_id, col4_1, sz4_40, 10),
    (gen_random_uuid(), prod4_id, col4_1, sz4_41, 15),
    (gen_random_uuid(), prod4_id, col4_1, sz4_42, 20),
    (gen_random_uuid(), prod4_id, col4_1, sz4_43, 15),
    (gen_random_uuid(), prod4_id, col4_1, sz4_44, 10),
    (gen_random_uuid(), prod4_id, col4_2, sz4_40, 8),
    (gen_random_uuid(), prod4_id, col4_2, sz4_41, 12),
    (gen_random_uuid(), prod4_id, col4_2, sz4_42, 18),
    (gen_random_uuid(), prod4_id, col4_2, sz4_43, 14),
    (gen_random_uuid(), prod4_id, col4_2, sz4_44, 6),
    (gen_random_uuid(), prod4_id, col4_3, sz4_40, 10),
    (gen_random_uuid(), prod4_id, col4_3, sz4_41, 15),
    (gen_random_uuid(), prod4_id, col4_3, sz4_42, 25),
    (gen_random_uuid(), prod4_id, col4_3, sz4_43, 18),
    (gen_random_uuid(), prod4_id, col4_3, sz4_44, 12);

  -- 5. Ceramic Ultrasonic Aroma Oil Diffuser & Lamp
  INSERT INTO products (product_id, product_name, product_description, product_price, product_discount, product_rating, sales_count, product_image, product_category, product_material)
  VALUES (
    prod5_id,
    'Ceramic Ultrasonic Aroma Oil Diffuser & Lamp',
    'Handcrafted matte ceramic diffuser featuring ambient warm LED illumination, whisper-quiet ultrasonic atomization, and automatic safety shut-off timer.',
    1199.00,
    0,
    4.6,
    180,
    ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80', 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&q=80'],
    ARRAY['Home & Living', 'Home Fragrance', 'Decor'],
    ARRAY['Handcrafted Ceramic', 'BPA-Free PP Resin']
  );

  INSERT INTO product_color (id, product_id, color, image) VALUES
    (col5_1, prod5_id, 'Matte White', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80'),
    (col5_2, prod5_id, 'Terracotta Earth', 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&q=80');

  INSERT INTO product_size (id, product_id, size, dimension) VALUES
    (sz5_std, prod5_id, '500ml Reservoir', '180mm x 120mm');

  INSERT INTO product_variant (variant_id, product_id, product_color_id, product_size_id, product_quantity) VALUES
    (gen_random_uuid(), prod5_id, col5_1, sz5_std, 30),
    (gen_random_uuid(), prod5_id, col5_2, sz5_std, 25);

  -- 6. Sapphire Waterproof Chronograph Heritage Watch
  INSERT INTO products (product_id, product_name, product_description, product_price, product_discount, product_rating, sales_count, product_image, product_category, product_material)
  VALUES (
    prod6_id,
    'Sapphire Waterproof Chronograph Heritage Watch',
    'Precision Japanese Miyota quartz movement housed in a surgical-grade 316L stainless steel case. Features scratch-resistant sapphire crystal and 5 ATM water resistance.',
    4299.00,
    25,
    4.9,
    95,
    ARRAY['https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],
    ARRAY['Accessories', 'Watches', 'Men''s Apparel'],
    ARRAY['316L Surgical Stainless Steel', 'Sapphire Crystal', 'Italian Calf Leather']
  );

  INSERT INTO product_color (id, product_id, color, image) VALUES
    (col6_1, prod6_id, 'Emerald Silver', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80'),
    (col6_2, prod6_id, 'Stealth Black', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80');

  INSERT INTO product_size (id, product_id, size, dimension) VALUES
    (sz6_std, prod6_id, '40mm Diameter', 'Lug width 20mm');

  INSERT INTO product_variant (variant_id, product_id, product_color_id, product_size_id, product_quantity) VALUES
    (gen_random_uuid(), prod6_id, col6_1, sz6_std, 12),
    (gen_random_uuid(), prod6_id, col6_2, sz6_std, 8);

END $$;
