#!/bin/bash

# GuestSnapper Stripe Products & Prices Creation Script
# Run this after installing Stripe CLI and logging in: `stripe login`

echo "🚀 Creating Stripe products and prices for GuestSnapper..."
echo "📝 Make sure to copy the price IDs and update src/lib/pricing.ts"
echo ""

# Array of plans with their details
declare -A plans=(
  ["Starter"]="starter"
  ["Small"]="small" 
  ["Medium"]="medium"
  ["Large"]="large"
  ["XLarge"]="xlarge"
  ["Unlimited"]="unlimited"
)

# Pricing matrix (amounts in cents)
declare -A pricing=(
  ["starter_aud"]="2900" ["starter_usd"]="2000" ["starter_gbp"]="1500" 
  ["starter_eur"]="1800" ["starter_cad"]="2600" ["starter_nzd"]="3100"
  
  ["small_aud"]="3900" ["small_usd"]="2700" ["small_gbp"]="2000"
  ["small_eur"]="2400" ["small_cad"]="3500" ["small_nzd"]="4200"
  
  ["medium_aud"]="5900" ["medium_usd"]="4100" ["medium_gbp"]="3100"
  ["medium_eur"]="3700" ["medium_cad"]="5300" ["medium_nzd"]="6300"
  
  ["large_aud"]="7900" ["large_usd"]="5500" ["large_gbp"]="4200"
  ["large_eur"]="5000" ["large_cad"]="7100" ["large_nzd"]="8500"
  
  ["xlarge_aud"]="10900" ["xlarge_usd"]="7600" ["xlarge_gbp"]="5800"
  ["xlarge_eur"]="6900" ["xlarge_cad"]="9800" ["xlarge_nzd"]="11700"
  
  ["unlimited_aud"]="14900" ["unlimited_usd"]="10400" ["unlimited_gbp"]="7900"
  ["unlimited_eur"]="9400" ["unlimited_cad"]="13400" ["unlimited_nzd"]="15900"
)

# Currencies
currencies=("aud" "usd" "gbp" "eur" "cad" "nzd")

echo "Creating products..."
echo "===================="

# Create products and store their IDs
declare -A product_ids

for plan_name in "${!plans[@]}"; do
  plan_code=${plans[$plan_name]}
  echo "📦 Creating product: $plan_name"
  
  product_output=$(stripe products create --name "$plan_name Plan" --description "GuestSnapper $plan_name Plan for event galleries")
  product_id=$(echo "$product_output" | grep "^id " | awk '{print $2}')
  
  if [ -z "$product_id" ]; then
    echo "❌ Failed to create product $plan_name"
    continue
  fi
  
  product_ids[$plan_code]=$product_id
  echo "✅ Created product $plan_name: $product_id"
  echo ""
done

echo "Creating prices..."
echo "=================="

# Generate the pricing configuration output
echo "// Copy this into src/lib/pricing.ts to replace stripePriceIds"
echo "export const stripePriceIds: Record<Plan, Record<Currency, string>> = {"

for plan_name in "${!plans[@]}"; do
  plan_code=${plans[$plan_name]}
  product_id=${product_ids[$plan_code]}
  
  if [ -z "$product_id" ]; then
    continue
  fi
  
  echo "  $plan_code: {"
  
  for currency in "${currencies[@]}"; do
    price_key="${plan_code}_${currency}"
    amount=${pricing[$price_key]}
    
    echo "    💰 Creating price for $plan_name in ${currency^^}: \$$(($amount/100))"
    
    price_output=$(stripe prices create \
      --product "$product_id" \
      --currency "$currency" \
      --unit-amount "$amount")
    
    price_id=$(echo "$price_output" | grep "^id " | awk '{print $2}')
    
    if [ -z "$price_id" ]; then
      echo "    ❌ Failed to create price for $plan_name in ${currency^^}"
      echo "    ${currency^^}: \"FAILED_TO_CREATE\","
    else
      echo "    ✅ Created price: $price_id"
      echo "    ${currency^^}: \"$price_id\","
    fi
  done
  
  echo "  },"
done

echo "};"
echo ""
echo "🎉 Stripe setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the generated stripePriceIds object above"
echo "2. Replace the stripePriceIds in src/lib/pricing.ts"
echo "3. Set up webhook endpoint: stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo "4. Add the webhook secret to your .env.local file"
echo "5. Test the payment flow!"