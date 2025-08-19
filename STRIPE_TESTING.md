# Stripe Local Testing Guide for GuestSnapper

This guide will walk you through testing your Stripe payment integration locally.

## Prerequisites

✅ Stripe CLI is installed  
✅ Stripe API keys are configured in `.env.local`  
✅ Stripe products and prices are created  
✅ Next.js dev server can run locally  

## Step-by-Step Testing Process

### 1. Start Your Development Server

```bash
npm run dev
```

Your app should be running on `http://localhost:3000`

### 2. Start Stripe Webhook Forwarding

In a **new terminal window**, run:

```bash
./scripts/test-stripe-webhooks.sh
```

Or manually:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You should see output like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
> Listening for events...
```

### 3. Update Your Webhook Secret (Important!)

Copy the webhook signing secret from the Stripe CLI output and update your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Restart your Next.js dev server** after updating the webhook secret.

### 4. Test the Payment Flow

1. **Create a new event** in your app
2. **Go to event settings** and click "Upgrade Plan" 
3. **Select a plan** and currency
4. **Click "Upgrade"** - this should redirect you to Stripe Checkout
5. **Use test card**: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - Name: Any name
6. **Complete the payment**

### 5. Watch the Webhook Events

In your Stripe CLI terminal, you should see:

```
2024-01-15 10:30:45  --> checkout.session.completed
2024-01-15 10:30:45  <--  200 POST /api/stripe/webhook
```

### 6. Verify the Payment Was Processed

1. Check your **event dashboard** - the plan should be upgraded
2. Check your **database** - the event should have the new plan and payment details
3. Check your **Stripe Dashboard** → Payments - you should see the test payment

## Test Card Numbers

| Scenario | Card Number | Description |
|----------|-------------|-------------|
| Success | `4242 4242 4242 4242` | Payment succeeds |
| Declined | `4000 0000 0000 0002` | Payment declined |
| Insufficient Funds | `4000 0000 0000 9995` | Insufficient funds |
| Expired Card | `4000 0000 0000 0069` | Expired card |

## Common Issues & Solutions

### Issue: Webhook secret not working
**Solution**: Make sure you copied the `whsec_` secret from Stripe CLI output and restarted your dev server.

### Issue: 401 Unauthorized in webhook
**Solution**: Check that your `STRIPE_SECRET_KEY` is correct and starts with `sk_test_`.

### Issue: Database not updating
**Solution**: Check your webhook endpoint logs and database connection.

### Issue: Stripe CLI not forwarding
**Solution**: Make sure you're logged in with `stripe login`.

## Monitoring Webhook Events

You can also monitor webhooks in the Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View **Recent deliveries** to see success/failure status

## Testing Different Scenarios

### Test Plan Upgrades
1. Create event with free plan
2. Upgrade to starter plan
3. Try upgrading to higher plans
4. Check feature gates work correctly

### Test Currency Changes  
1. Test payments in different currencies
2. Verify currency is locked after first payment

### Test Failed Payments
1. Use decline card `4000 0000 0000 0002`
2. Verify event plan doesn't change
3. Check user can retry payment

### Test Webhooks
1. Complete a successful payment
2. Check webhook logs show `checkout.session.completed`
3. Verify database is updated correctly

## Production Deployment

When deploying to production:

1. **Update webhook endpoint** in Stripe Dashboard to your production URL
2. **Use production API keys** (`sk_live_` and `pk_live_`)
3. **Set production webhook secret** from Stripe Dashboard
4. **Test with small real payments** before going live

## Debugging Tips

- **Check Next.js console** for API route errors
- **Check Stripe CLI output** for webhook delivery status  
- **Check Stripe Dashboard** → Events for all webhook events
- **Use Stripe Dashboard** → Logs for detailed API logs
- **Check your database** directly to verify updates

---

## Quick Start Commands

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start webhook forwarding  
./scripts/test-stripe-webhooks.sh

# Then test with card: 4242 4242 4242 4242
```