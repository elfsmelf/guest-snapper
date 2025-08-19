# GuestSnapper Stripe Integration Implementation Plan

## Overview
Implement one-time event-based payments using Stripe + Better Auth Stripe plugin, supporting 6 pricing tiers across 6 currencies with immediate feature unlock after webhook confirmation.

## Phase 1: Environment & Dependencies Setup (30 minutes)

### Install Dependencies
```bash
pnpm add stripe @stripe/stripe-js @better-auth/stripe
```

### Environment Variables
```env
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="" # Will be set after webhook setup
```

## Phase 2: Stripe Product & Price Setup (45 minutes)

### Create Products via Stripe CLI
One product per plan tier:
- Starter (10 guests) 
- Small (25 guests)
- Medium (50 guests)
- Large (100 guests)
- XLarge (200 guests)
- Unlimited (unlimited guests)

### Create One-Time Prices
For each product, create 6 currency prices using existing pricing matrix:
- **Starter**: AUD$29, USD$20, GBP£15, EUR€18, CAD$26, NZD$31
- **Small**: AUD$39, USD$27, GBP£20, EUR€24, CAD$35, NZD$42
- **Medium**: AUD$59, USD$41, GBP£31, EUR€37, CAD$53, NZD$63
- **Large**: AUD$79, USD$55, GBP£42, EUR€50, CAD$71, NZD$85
- **XLarge**: AUD$109, USD$76, GBP£58, EUR€69, CAD$98, NZD$117
- **Unlimited**: AUD$149, USD$104, GBP£79, EUR€94, CAD$134, NZD$159

### CLI Script Template
```bash
stripe products create --name "Starter"
stripe prices create --product prod_XXXX --currency aud --unit-amount 2900
# Repeat for all 6 currencies × 6 plans
```

## Phase 3: Database Schema Extension (20 minutes) - Using Drizzle

### Add Payment Fields to Events Table
Extend the existing events schema in `src/database/schema.ts`:
```typescript
// Add new payment-related fields to events table
plan: text('plan').default('free').notNull(), // 'free', 'starter', 'small', etc.
currency: text('currency').default('AUD').notNull(), // 'AUD', 'USD', 'GBP', etc.
paidAt: timestamp('paid_at', { mode: 'string' }),
stripeSessionId: text('stripe_session_id'),
stripePaymentIntent: text('stripe_payment_intent'),
```

### Better Auth Stripe Tables
Run Better Auth migration to add subscription tables (adapted for one-time payments):
```bash
npx @better-auth/cli migrate
```

### Generate Drizzle Migration
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Phase 4: Better Auth + Stripe Plugin Integration (30 minutes)

### Server Configuration
Update `src/lib/auth.ts`:
- Add Stripe plugin with Better Auth
- Configure webhook handling
- Set customer creation on signup

### Client Configuration  
Update `src/lib/auth-client.ts`:
- Add Stripe client plugin
- Enable payment functionality

### Stripe Client Setup
Create `src/lib/stripe.ts`:
- Initialize Stripe server client
- Export for API routes

### Price Mapping
Create `src/lib/pricing.ts`:
- Map plan codes to Stripe price IDs
- Support multi-currency lookup
- Type-safe currency and plan enums

## Phase 5: Payment API Routes (45 minutes)

### Checkout Session Creation
`src/app/api/checkout/route.ts`:
- Validate user authentication
- Verify event ownership
- Prevent duplicate payments
- Create Stripe checkout session with event metadata
- Store pending payment state

### Webhook Handler
`src/app/api/stripe/webhook/route.ts`:
- Verify Stripe webhook signatures
- Handle `checkout.session.completed` events
- Update event plan and features immediately
- Store payment references for audit
- Handle refund events

### Session Verification
`src/app/api/checkout/session/route.ts`:
- Verify payment completion
- Return session status for success page

## Phase 6: UI Components Overhaul (60 minutes)

### Replace Guest Count Dialog
Transform `GuestCountPricingDialog` into `StripePaymentDialog`:
- Show actual pricing from Stripe
- Currency selection (locked to event currency after first payment)
- Real payment buttons instead of mock pricing
- Plan comparison with features
- Loading states during checkout

### Payment Success/Cancel Pages
Create `src/app/checkout/success/page.tsx`:
- Verify payment completion
- Show purchased plan details
- Redirect to event dashboard
- Handle edge cases (pending payments)

Create `src/app/checkout/cancel/page.tsx`:
- Show cancellation message  
- Allow retry
- Return to event settings

### Event Dashboard Integration
Update event settings to show:
- Current paid plan (if any)
- Plan features and limits
- Upgrade prompts when hitting limits
- Payment history

## Phase 7: Feature Gate Implementation (40 minutes)

### Plan-Based Feature Control
Create `src/lib/feature-gates.ts`:
- Map plans to feature capabilities
- Check current event plan against required features
- Return upgrade prompts for blocked actions

### Publish Gate Integration
Update event publish API route:
- Check if event has paid plan
- Block free trial events from going public
- Show upgrade prompt instead of generic error

### Feature Enforcement Middleware
Create middleware for:
- Album creation limits
- Theme selection limits
- Upload window enforcement
- Custom branding features
- Video guestbook features

## Phase 8: Local Development & Testing (30 minutes)

### Stripe CLI Setup
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Test Payment Flow
1. Create test event
2. Attempt to publish (blocked)
3. Open payment dialog
4. Complete checkout with test card (4242 4242 4242 4242)
5. Verify webhook processes payment
6. Confirm event unlocked for publishing
7. Test feature gates for different plan levels

### Error Handling
- Payment failures
- Webhook processing errors
- Network issues during checkout
- Duplicate payment prevention

## Phase 9: Production Deployment (20 minutes)

### Stripe Dashboard Configuration
- Create production products and prices
- Set up production webhook endpoint
- Configure webhook events (checkout.session.completed, charge.refunded)

### Environment Variables
- Add production Stripe keys
- Set webhook secret from production webhook
- Verify CORS settings

### Database Migration
- Apply schema changes to production
- Run Better Auth migrations
- Seed any required data

## Key Technical Decisions

### Payment Model
- **One-time payments per event** (not subscriptions)
- **Event-specific pricing** (each event can have different plan)
- **No downgrades** (only upgrades allowed)
- **Immediate feature unlock** (via webhooks)

### Currency Strategy
- **Event currency locked** after first payment attempt
- **Full multi-currency support** (6 currencies)
- **Stripe handles currency conversion** and localization

### Data Architecture (Drizzle-based)
- **Extend existing events table** (minimal schema changes)
- **Leverage Better Auth Stripe plugin** (for webhook handling)
- **Store Stripe references** (for refunds and audit)
- **Feature gates based on plan field** (simple lookup)
- **Use Drizzle migrations** for schema changes

### User Experience
- **Seamless upgrade flow** (existing pricing dialog enhanced)
- **Immediate access** (webhook-driven feature unlock)
- **Clear feature comparison** (plan benefits matrix)
- **Retry-friendly** (handle payment failures gracefully)

## Success Metrics
- **Conversion rate**: Free trial → paid plan
- **Payment completion rate**: Checkout started → successful payment
- **Feature adoption**: Which paid features are used most
- **Webhook reliability**: <1% webhook processing failures
- **User experience**: <3 clicks from "upgrade" to checkout

## Estimated Timeline: 4-5 hours total

This plan leverages Stripe's robust multi-currency support and the Better Auth Stripe plugin to create a production-ready payment system that's much simpler than the previous Polar implementation while providing better currency support and proven reliability.

## Drizzle-Specific Considerations
- Use Drizzle schema extensions for payment fields
- Generate migrations with `drizzle-kit generate`
- Apply migrations with `drizzle-kit migrate` 
- Type-safe database operations with Drizzle ORM
- Better Auth Stripe plugin handles its own table creation