#!/usr/bin/env node

/**
 * Stripe Product & Price Setup Script for GuestSnapper
 * 
 * This script creates all the products and prices needed for the GuestSnapper payment system.
 * It will create 6 products (one for each plan) with 6 prices each (one for each currency).
 * 
 * Run: node scripts/setup-stripe-products.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Plan configurations matching your pricing.ts
const plans = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: '10 guests, 1 album, public gallery access, 3-month upload window',
    prices: { AUD: 2900, USD: 2000, GBP: 1500, EUR: 1800, CAD: 2600, NZD: 3100 }
  },
  {
    id: 'small',
    name: 'Small Plan', 
    description: '25 guests, 2 albums, 5 themes, public gallery access',
    prices: { AUD: 3900, USD: 2700, GBP: 2000, EUR: 2400, CAD: 3500, NZD: 4200 }
  },
  {
    id: 'medium',
    name: 'Medium Plan',
    description: '50 guests, 3 albums, 10 themes, 6-month upload, video guestbook',
    prices: { AUD: 5900, USD: 4100, GBP: 3100, EUR: 3700, CAD: 5300, NZD: 6300 }
  },
  {
    id: 'large',
    name: 'Large Plan',
    description: '100 guests, 5 albums, 15 themes, 12-month upload, premium features',
    prices: { AUD: 7900, USD: 5500, GBP: 4200, EUR: 5000, CAD: 7100, NZD: 8500 }
  },
  {
    id: 'xlarge',
    name: 'XLarge Plan',
    description: '200 guests, 10 albums, custom branding, priority support',
    prices: { AUD: 10900, USD: 7600, GBP: 5800, EUR: 6900, CAD: 9800, NZD: 11700 }
  },
  {
    id: 'unlimited',
    name: 'Unlimited Plan',
    description: 'Unlimited guests & albums, enterprise features, dedicated support',
    prices: { AUD: 14900, USD: 10400, GBP: 7900, EUR: 9400, CAD: 13400, NZD: 15900 }
  }
];

const currencies = ['AUD', 'USD', 'GBP', 'EUR', 'CAD', 'NZD'];

async function createProducts() {
  console.log('🚀 Setting up Stripe products and prices for GuestSnapper...\n');
  
  const results = {
    products: {},
    prices: {}
  };

  for (const plan of plans) {
    console.log(`📦 Creating product: ${plan.name}...`);
    
    try {
      // Create the product
      const product = await stripe.products.create({
        id: `guestsnapper_${plan.id}`,
        name: plan.name,
        description: plan.description,
        metadata: {
          plan: plan.id,
          app: 'guestsnapper'
        }
      });

      results.products[plan.id] = product.id;
      console.log(`✅ Product created: ${product.id}`);

      // Create prices for each currency
      results.prices[plan.id] = {};
      
      for (const currency of currencies) {
        const price = await stripe.prices.create({
          product: product.id,
          currency: currency.toLowerCase(),
          unit_amount: plan.prices[currency],
          metadata: {
            plan: plan.id,
            currency: currency,
            app: 'guestsnapper'
          }
        });

        results.prices[plan.id][currency] = price.id;
        console.log(`  💰 Price created: ${price.id} (${currency} ${plan.prices[currency] / 100})`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error creating product ${plan.name}:`, error.message);
      
      // If product already exists, try to get it
      if (error.code === 'resource_already_exists') {
        try {
          const existingProduct = await stripe.products.retrieve(`guestsnapper_${plan.id}`);
          results.products[plan.id] = existingProduct.id;
          console.log(`ℹ️  Using existing product: ${existingProduct.id}`);
          
          // Still need to create/get prices
          results.prices[plan.id] = {};
          const existingPrices = await stripe.prices.list({ product: existingProduct.id });
          
          for (const currency of currencies) {
            const existingPrice = existingPrices.data.find(p => 
              p.currency.toUpperCase() === currency && 
              p.unit_amount === plan.prices[currency]
            );
            
            if (existingPrice) {
              results.prices[plan.id][currency] = existingPrice.id;
              console.log(`  ♻️  Using existing price: ${existingPrice.id} (${currency})`);
            } else {
              // Create missing price
              const price = await stripe.prices.create({
                product: existingProduct.id,
                currency: currency.toLowerCase(),
                unit_amount: plan.prices[currency],
                metadata: {
                  plan: plan.id,
                  currency: currency,
                  app: 'guestsnapper'
                }
              });
              results.prices[plan.id][currency] = price.id;
              console.log(`  💰 New price created: ${price.id} (${currency})`);
            }
          }
        } catch (retrieveError) {
          console.error(`❌ Error handling existing product:`, retrieveError.message);
        }
      }
    }
  }

  return results;
}

async function generatePriceIdFile(results) {
  const priceIdCode = `// Generated by setup-stripe-products.js
// Do not edit manually - run the script again to regenerate

export const stripePriceIds = {
${Object.entries(results.prices).map(([plan, currencies]) => 
  `  ${plan}: {
${Object.entries(currencies).map(([currency, priceId]) => 
    `    ${currency}: "${priceId}",`
  ).join('\n')}
  },`
).join('\n')}
} as const;
`;

  // Write to a separate file so it can be imported into pricing.ts
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(__dirname, '..', 'src', 'lib', 'stripe-price-ids.ts');
  fs.writeFileSync(filePath, priceIdCode);
  
  console.log(`📝 Price IDs saved to: src/lib/stripe-price-ids.ts`);
  console.log('');
  console.log('🔧 Next steps:');
  console.log('1. Import the price IDs in your pricing.ts file');
  console.log('2. Replace the placeholder price IDs with the generated ones');
  console.log('3. Set up your webhook endpoint in Stripe Dashboard');
}

async function main() {
  try {
    const results = await createProducts();
    await generatePriceIdFile(results);
    
    console.log('🎉 Stripe setup complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`- Created ${Object.keys(results.products).length} products`);
    console.log(`- Created ${Object.values(results.prices).reduce((total, currencies) => total + Object.keys(currencies).length, 0)} prices`);
    console.log('');
    console.log('⚠️  Remember to:');
    console.log('1. Update your pricing.ts file with the generated price IDs');
    console.log('2. Set up webhooks in Stripe Dashboard pointing to /api/stripe/webhook');
    console.log('3. Test your payment flow with test card: 4242 4242 4242 4242');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();