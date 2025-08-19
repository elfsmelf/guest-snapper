#!/bin/bash

# Stripe Local Webhook Testing Script for GuestSnapper
# This script sets up local webhook testing with Stripe CLI

echo "🚀 Setting up Stripe webhook testing for GuestSnapper..."
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed. Please install it first:"
    echo "   brew install stripe/stripe-cli/stripe"
    echo "   or visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if already logged in
echo "🔐 Checking Stripe CLI authentication..."
if stripe --version &> /dev/null; then
    echo "✅ Stripe CLI is available"
else 
    echo "❌ Stripe CLI not working properly"
    exit 1
fi

# Check login status
if stripe config --list &> /dev/null; then
    echo "✅ Already logged in to Stripe"
else
    echo "🔑 Please log in to Stripe:"
    stripe login
fi

echo ""
echo "🌐 Starting webhook forwarding..."
echo "This will forward Stripe webhooks to your local development server"
echo ""
echo "Make sure your Next.js dev server is running on http://localhost:3000"
echo "In another terminal, run: npm run dev"
echo ""

# Start webhook forwarding
echo "Starting webhook listener..."
echo "Press Ctrl+C to stop"
echo ""

stripe listen --forward-to localhost:3000/api/stripe/webhook --events checkout.session.completed,charge.dispute.created,charge.refunded,payment_intent.payment_failed