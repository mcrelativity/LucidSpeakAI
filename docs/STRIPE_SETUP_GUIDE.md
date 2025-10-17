# Stripe Integration - Setup Guide

## ✅ What Was Added to Backend

**New Endpoints:**
1. `POST /api/stripe-payment` - Create checkout session
2. `POST /api/stripe-webhook` - Handle Stripe events
3. `GET /api/subscription-status` - Check user's subscription

**New Features:**
- ✅ Stripe checkout integration
- ✅ Monthly subscription ($4.99/month)
- ✅ Automatic Pro tier upgrade on payment
- ✅ Webhook handling for subscription events
- ✅ Runs alongside PayPal (both options work)

---

## 🔧 Setup Steps

### Step 1: Create Stripe Account (If not done yet)

Go to: https://dashboard.stripe.com/register

Fill in:
- Email
- Password
- Country: Chile
- Business type: Solo Individual or LLC

### Step 2: Get API Keys

1. **Go to:** https://dashboard.stripe.com/
2. **Click:** Developers (top right corner)
3. **Select:** API Keys
4. **You'll see two keys:**
   - **Publishable key:** Starts with `pk_live_...` (frontend use)
   - **Secret key:** Starts with `sk_live_...` (backend use)

### Step 3: Add to Environment

Edit `backend/.env`:

```env
STRIPE_PUBLIC_KEY=pk_live_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here
```

Test:
```bash
echo $env:STRIPE_SECRET_KEY
# Should show your key
```

### Step 4: Install Stripe Package

```bash
cd z:\lucidspeak
pip install stripe
```

Verify:
```bash
python -c "import stripe; print('✅ Stripe installed')"
```

---

## 📱 Frontend Integration

Your frontend needs to:

### Option 1: Use Stripe Hosted Checkout (Easiest)

```javascript
// When user clicks "Pay with Stripe" button:
async function payWithStripe() {
  const response = await fetch('/api/stripe-payment', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Redirect to Stripe checkout
  window.location.href = data.checkout_url;
}
```

### Option 2: Use Stripe.js (More Control)

1. Add Stripe.js to your frontend
2. Call `/api/stripe-payment` to get session_id
3. Use `redirectToCheckout()` with session_id

Documentation: https://stripe.com/docs/checkout/quickstart

---

## 🔗 API Reference

### Create Payment Session

```
POST /api/stripe-payment
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "session_id": "cs_test_...",
  "checkout_url": "https://checkout.stripe.com/...",
  "message": "..."
}
```

**What it does:**
- Creates $4.99/month recurring subscription
- Returns checkout URL
- User is redirected to Stripe to complete payment

### Get Subscription Status

```
GET /api/subscription-status
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "tier": "pro" | "free",
  "subscription_status": "active" | "inactive" | "cancelled",
  "subscription_end_date": 1697500000,
  "subscription_id": "sub_..."
}
```

### Webhook Handler

```
POST /api/stripe-webhook

Handles:
- checkout.session.completed → Upgrade user to Pro
- customer.subscription.deleted → Downgrade to free
```

---

## 📊 Payment Flow

```
User clicks "Pay with Stripe"
            ↓
Call POST /api/stripe-payment
            ↓
Get checkout_url
            ↓
Redirect to Stripe Checkout
            ↓
User enters card info
            ↓
Stripe processes payment
            ↓
Webhook: checkout.session.completed
            ↓
Backend upgrades user to Pro tier
            ↓
Frontend redirects to success page
```

---

## 🧪 Testing Stripe Locally

### Test Card Numbers

Use these to test without real charges:

| Card | Number | Exp | CVC |
|------|--------|-----|-----|
| Success | 4242 4242 4242 4242 | Any future | Any 3 digits |
| Decline | 4000 0000 0000 0002 | Any future | Any 3 digits |
| Require Auth | 4000 0025 0000 3155 | Any future | Any 3 digits |

### How to Test

1. **Start backend:** `python -m uvicorn main:app --reload`
2. **Call endpoint:** `curl -X POST http://localhost:8000/api/stripe-payment -H "Authorization: Bearer {JWT_TOKEN}"`
3. **Get checkout URL**
4. **Paste in browser**
5. **Use test card: 4242 4242 4242 4242**
6. **Complete flow**

---

## ⚠️ Important Notes

### Webhooks

For production, you should set up webhook signing:

1. **Go to:** Stripe Dashboard → Developers → Webhooks
2. **Add endpoint:** `https://api.lucidspeakapp.com/api/stripe-webhook`
3. **Get webhook secret:** `whsec_...`
4. **Add to .env:** `STRIPE_WEBHOOK_SECRET=whsec_...`

The webhook handler will then verify signatures for security.

### Testing Webhooks Locally

Use Stripe CLI:
```bash
# Download: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:8000/api/stripe-webhook
```

### Currency

Currently set to USD ($4.99). To change:

Edit in `main.py` around line 1720:
```python
"currency": "usd",  # Change to "clp" for Chilean Pesos
"unit_amount": 499,  # Adjust amount
```

---

## 🚨 Troubleshooting

### "Stripe is not configured"

**Problem:** STRIPE_SECRET_KEY not set

**Solution:**
```bash
echo $env:STRIPE_SECRET_KEY
# Must show your key, not empty
```

### "Invalid API Key"

**Problem:** Wrong key copied

**Solution:**
- Go to Stripe dashboard
- Copy from Developers → API Keys
- Make sure it's `sk_live_` (not test key)

### Webhook not working

**Problem:** Not set up in Stripe dashboard

**Solution:**
- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint with your production URL
- Copy webhook secret to .env

### "You already have an active Pro subscription"

**Problem:** User trying to subscribe twice

**Solution:** Check `/api/subscription-status` endpoint to see current status

---

## 📚 Additional Resources

- Stripe Docs: https://stripe.com/docs
- Stripe Python SDK: https://github.com/stripe/stripe-python
- Checkout Integration: https://stripe.com/docs/checkout/quickstart
- Webhooks: https://stripe.com/docs/webhooks

---

## ✅ Next Steps

1. ✅ Create Stripe account
2. ✅ Get API keys
3. ✅ Add to .env
4. ✅ Install stripe package: `pip install stripe`
5. ✅ Backend is ready (already integrated)
6. ➡️ Update frontend to show Stripe button
7. ➡️ Test with test card numbers
8. ➡️ Deploy to production

---

**Status:** Backend implementation complete ✅

**Ready for:** Frontend integration + deployment
