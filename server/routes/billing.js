const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? Stripe(stripeSecret) : null;
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Simple auth middleware using JWT header like other routes
const jwt = require('jsonwebtoken');
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

// Get billing status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId && stripe) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
    return res.json({
      success: true,
      data: {
        stripeCustomerId,
        subscription: user.subscription || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create checkout session for upgrading
router.post('/checkout', authMiddleware, body('priceId').isString(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Invalid input' });
    if (!stripe) return res.status(400).json({ success: false, error: 'Stripe not configured' });
    const { priceId } = req.body;
    const user = req.user;
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/settings#billing-success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/settings#billing-cancel`
    });
    return res.json({ success: true, data: { url: session.url } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create Billing Portal session
router.post('/portal', authMiddleware, async (req, res) => {
  try {
    if (!stripe) return res.status(400).json({ success: false, error: 'Stripe not configured' });
    const user = req.user;
    if (!user.stripeCustomerId) return res.status(400).json({ success: false, error: 'No Stripe customer' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.STRIPE_BILLING_PORTAL_RETURN_URL || `${process.env.CLIENT_URL || 'http://localhost:3000'}/settings#billing`
    });
    return res.json({ success: true, data: { url: portal.url } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


