/**
 * Wagon E-Commerce Database Seeder
 * 
 * Seeds products, colors, sizes, and variants into Supabase.
 * Usage: npm run seed
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...values] = trimmed.split('=');
        const val = values.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = val;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: EXPO_PUBLIC_SUPABASE_URL must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const sampleProducts = [
  {
    name: "Urban Oversized Heavyweight Cotton Hoodie",
    description: "Engineered from premium 420 GSM French Terry cotton, this boxy-fit heavyweight hoodie provides unmatched comfort and aesthetic streetwear drape. Features reinforced kangaroo pockets and double-layered hood.",
    price: 1499.00,
    discount: 15,
    rating: 4.9,
    salesCount: 342,
    categories: ["Men's Apparel", "Hoodies & Sweatshirts", "Streetwear"],
    materials: ["100% French Terry Cotton", "Ribbed Spandex Trims"],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=80"
    ],
    colors: [
      { color: "Washed Charcoal", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80" },
      { color: "Vintage Bone", image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80" },
      { color: "Forest Green", image: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&q=80" }
    ],
    sizes: [
      { size: "Small (S)", dimension: "Chest 38 in / Length 27 in" },
      { size: "Medium (M)", dimension: "Chest 41 in / Length 28 in" },
      { size: "Large (L)", dimension: "Chest 44 in / Length 29 in" },
      { size: "X-Large (XL)", dimension: "Chest 47 in / Length 30 in" }
    ],
    stockPerVariant: 20
  },
  {
    name: "Aesthetic Studio Pro Wireless ANC Headphones",
    description: "Immersive high-fidelity audio with active noise cancellation, transparency mode, and custom 40mm titanium drivers. Up to 45 hours battery life on a single fast charge.",
    price: 3499.00,
    discount: 20,
    rating: 4.8,
    salesCount: 520,
    categories: ["Electronics", "Audio & Headphones", "Gadgets"],
    materials: ["Anodized Aluminum", "Memory Foam", "Protein Leather"],
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80"
    ],
    colors: [
      { color: "Midnight Black", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80" },
      { color: "Silver Slate", image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80" },
      { color: "Desert Sand", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80" }
    ],
    sizes: [
      { size: "One Size", dimension: "Adjustable Headband" }
    ],
    stockPerVariant: 35
  },
  {
    name: "Minimalist Heavy Canvas Everyday Tote Bag",
    description: "Durable 16oz waxed canvas tote bag featuring an interior padded laptop compartment (up to 16-inch), magnetic snap closure, and reinforced webbing shoulder straps.",
    price: 649.00,
    discount: 10,
    rating: 4.7,
    salesCount: 215,
    categories: ["Bags & Accessories", "Tote Bags", "Women's Apparel"],
    materials: ["16oz Organic Waxed Canvas", "Brass Hardware", "YKK Zippers"],
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80"
    ],
    colors: [
      { color: "Natural Ecru", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80" },
      { color: "Pitch Black", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80" }
    ],
    sizes: [
      { size: "Standard (15L)", dimension: "16 x 14 x 5 inches" }
    ],
    stockPerVariant: 40
  },
  {
    name: "Retro Court Low-Top Leather Sneakers",
    description: "Iconic vintage court silhouette crafted with full-grain nappa leather, cushioned EVA midsole, and vulcanized gum outsole for all-day grip and comfort.",
    price: 2799.00,
    discount: 5,
    rating: 4.9,
    salesCount: 610,
    categories: ["Footwear", "Sneakers", "Men's Apparel"],
    materials: ["Full-Grain Nappa Leather", "Ortholite Insole", "Gum Rubber"],
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80"
    ],
    colors: [
      { color: "White / Forest Green", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80" },
      { color: "Mocha Brown", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80" },
      { color: "Triple White", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80" }
    ],
    sizes: [
      { size: "EU 40", dimension: "US 7.5 / 25.5cm" },
      { size: "EU 41", dimension: "US 8.5 / 26.5cm" },
      { size: "EU 42", dimension: "US 9.0 / 27.0cm" },
      { size: "EU 43", dimension: "US 10.0 / 28.0cm" },
      { size: "EU 44", dimension: "US 11.0 / 29.0cm" }
    ],
    stockPerVariant: 15
  },
  {
    name: "Ceramic Ultrasonic Aroma Oil Diffuser & Lamp",
    description: "Handcrafted matte ceramic diffuser featuring ambient warm LED illumination, whisper-quiet ultrasonic atomization, and automatic safety shut-off timer.",
    price: 1199.00,
    discount: 0,
    rating: 4.6,
    salesCount: 180,
    categories: ["Home & Living", "Home Fragrance", "Decor"],
    materials: ["Handcrafted Ceramic", "BPA-Free PP Resin"],
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
      "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&q=80"
    ],
    colors: [
      { color: "Matte White", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80" },
      { color: "Terracotta Earth", image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&q=80" }
    ],
    sizes: [
      { size: "500ml Reservoir", dimension: "180mm x 120mm" }
    ],
    stockPerVariant: 30
  },
  {
    name: "Sapphire Waterproof Chronograph Heritage Watch",
    description: "Precision Japanese Miyota quartz movement housed in a surgical-grade 316L stainless steel case. Features scratch-resistant sapphire crystal and 5 ATM water resistance.",
    price: 4299.00,
    discount: 25,
    rating: 4.9,
    salesCount: 95,
    categories: ["Accessories", "Watches", "Men's Apparel"],
    materials: ["316L Surgical Stainless Steel", "Sapphire Crystal", "Italian Calf Leather"],
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80"
    ],
    colors: [
      { color: "Emerald Silver", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80" },
      { color: "Stealth Black", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80" }
    ],
    sizes: [
      { size: "40mm Diameter", dimension: "Lug width 20mm" }
    ],
    stockPerVariant: 12
  }
];

async function seedDatabase() {
  console.log('🌱 Starting Wagon E-Commerce database seeding...\n');

  // Clean up any previously seeded sample products by name so we don't have duplicates or incomplete records
  const sampleNames = sampleProducts.map((p) => p.name);
  const { error: cleanError } = await supabase.from('products').delete().in('product_name', sampleNames);
  if (cleanError) {
    console.log('ℹ️ Previous records clean note:', cleanError.message);
  } else {
    console.log('🧹 Cleaned up any existing sample products.');
  }

  let totalProducts = 0;
  let totalColors = 0;
  let totalSizes = 0;
  let totalVariants = 0;
  let rlsFailed = false;

  for (const item of sampleProducts) {
    const productId = uuid();

    console.log(`📦 Inserting product: "${item.name}"...`);

    // 1. Insert Product
    const { error: productError } = await supabase.from('products').insert([
      {
        product_id: productId,
        product_name: item.name,
        product_description: item.description,
        product_price: item.price,
        product_discount: item.discount,
        product_rating: item.rating,
        sales_count: item.salesCount,
        product_image: item.images,
        product_category: item.categories,
        product_material: item.materials,
      }
    ]);

    if (productError) {
      console.error(`  ❌ Failed to insert product "${item.name}":`, productError.message);
      if (productError.message.includes('row-level security')) {
        rlsFailed = true;
      }
      continue;
    }
    totalProducts++;

    // 2. Insert Colors
    const colorIdMap = [];
    for (const c of item.colors) {
      const colorId = uuid();
      const { error: colorError } = await supabase.from('product_color').insert([
        {
          id: colorId,
          product_id: productId,
          color: c.color,
          image: c.image
        }
      ]);

      if (colorError) {
        console.error(`  ❌ Failed to insert color "${c.color}":`, colorError.message);
      } else {
        colorIdMap.push(colorId);
        totalColors++;
      }
    }

    // 3. Insert Sizes
    const sizeIdMap = [];
    for (const s of item.sizes) {
      const sizeId = uuid();
      const { error: sizeError } = await supabase.from('product_size').insert([
        {
          id: sizeId,
          product_id: productId,
          size: s.size,
          dimension: s.dimension
        }
      ]);

      if (sizeError) {
        console.error(`  ❌ Failed to insert size "${s.size}":`, sizeError.message);
      } else {
        sizeIdMap.push(sizeId);
        totalSizes++;
      }
    }

    // 4. Insert Combinations into product_variant (product_color_id and product_size_id)
    let variantsForThisProduct = 0;
    for (const cId of colorIdMap) {
      for (const sId of sizeIdMap) {
        const variantId = uuid();
        const { error: variantError } = await supabase.from('product_variant').insert([
          {
            variant_id: variantId,
            product_id: productId,
            product_color_id: cId,
            product_size_id: sId,
            product_quantity: item.stockPerVariant
          }
        ]);

        if (variantError) {
          console.error(`  ❌ Failed to insert variant:`, variantError.message);
        } else {
          totalVariants++;
          variantsForThisProduct++;
        }
      }
    }

    console.log(`  ✅ Successfully seeded "${item.name}" with ${colorIdMap.length} colors, ${sizeIdMap.length} sizes, and ${variantsForThisProduct} variants.\n`);
  }

  console.log('====================================');
  console.log('🎉 Seeding Result:');
  console.log(`- Products:  ${totalProducts}`);
  console.log(`- Colors:    ${totalColors}`);
  console.log(`- Sizes:     ${totalSizes}`);
  console.log(`- Variants:  ${totalVariants}`);
  console.log('====================================\n');

  if (rlsFailed) {
    console.log('💡 Note regarding Row-Level Security (RLS):');
    console.log('Your Supabase `products` table has Row Level Security (RLS) enabled for anonymous inserts.');
    console.log('You have two quick options to seed:');
    console.log('1. Option A (Instant via SQL): Run the generated `supabase/seed.sql` script directly in your Supabase Dashboard > SQL Editor.');
    console.log('2. Option B (CLI via Service Role): Add your `SUPABASE_SERVICE_ROLE_KEY` to `.env` and re-run `npm run seed`.\n');
  }
}

seedDatabase().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
