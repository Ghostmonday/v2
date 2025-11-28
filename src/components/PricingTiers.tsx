/**
 * Pricing Tiers Component
 * Premium pricing cards for SentimentDNA subscription plans
 */

import { motion } from 'framer-motion';
import { useState } from 'react';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  limits: {
    assets: number | 'unlimited';
    refreshRate: string;
    historyDays: number;
    apiCalls?: number | 'unlimited';
  };
}

const tiers: PricingTier[] = [
  {
    id: 'observer',
    name: 'Observer',
    price: 0,
    period: 'month',
    description: 'Perfect for exploring the system',
    badge: 'FREE',
    features: [
      'Demo mode with synthetic data',
      'Phase Portrait visualization',
      'Streamlines flow view',
      'Basic regime detection',
      'Community Discord access',
    ],
    limits: {
      assets: 1,
      refreshRate: '30s delay',
      historyDays: 1,
    },
  },
  {
    id: 'analyst',
    name: 'Analyst',
    price: 49,
    period: 'month',
    description: 'For serious traders & researchers',
    highlighted: true,
    badge: 'POPULAR',
    features: [
      'Real-time sentiment feed',
      'All 3 visualization lenses',
      'SHAP explainability highlights',
      'Bot/shill authenticity scores',
      'Narrative event stream',
      'Cross-asset correlation matrix',
      'Email alerts on regime shifts',
      'Export to CSV/JSON',
    ],
    limits: {
      assets: 10,
      refreshRate: '500ms real-time',
      historyDays: 30,
      apiCalls: 10000,
    },
  },
  {
    id: 'institution',
    name: 'Institution',
    price: 299,
    period: 'month',
    description: 'For funds, desks, and enterprises',
    badge: 'FULL ACCESS',
    features: [
      'Everything in Analyst',
      'Unlimited assets',
      'WebSocket streaming API',
      'Custom model integration',
      'White-label embedding',
      'Dedicated account manager',
      'SLA uptime guarantee (99.9%)',
      'Priority feature requests',
      'On-premise deployment option',
    ],
    limits: {
      assets: 'unlimited',
      refreshRate: '100ms ultra-low latency',
      historyDays: 365,
      apiCalls: 'unlimited',
    },
  },
];

export function PricingTiers() {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const yearlyDiscount = 0.2; // 20% off

  const getPrice = (tier: PricingTier) => {
    if (tier.price === 0) return 0;
    if (billingPeriod === 'year') {
      return Math.round(tier.price * 12 * (1 - yearlyDiscount));
    }
    return tier.price;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
        >
          Choose Your <span className="text-regime-calm">Signal</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
        >
          From exploration to institution-grade intelligence. 
          Scale your edge as your needs grow.
        </motion.p>

        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <span className={`text-sm ${billingPeriod === 'month' ? 'text-white' : 'text-[var(--text-tertiary)]'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
            className="relative w-14 h-7 rounded-full bg-white/10 border border-white/20 transition-colors"
          >
            <motion.div
              className="absolute top-1 w-5 h-5 rounded-full bg-regime-calm"
              animate={{ left: billingPeriod === 'month' ? 4 : 32 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm ${billingPeriod === 'year' ? 'text-white' : 'text-[var(--text-tertiary)]'}`}>
            Yearly
          </span>
          {billingPeriod === 'year' && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30">
              SAVE 20%
            </span>
          )}
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`
              relative rounded-2xl p-6 
              ${tier.highlighted 
                ? 'bg-gradient-to-b from-regime-calm/20 to-transparent border-2 border-regime-calm/50 scale-105 z-10' 
                : 'bg-white/5 border border-white/10'
              }
            `}
          >
            {/* Badge */}
            {tier.badge && (
              <div className={`
                absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider
                ${tier.highlighted 
                  ? 'bg-regime-calm text-black' 
                  : 'bg-white/10 text-[var(--text-secondary)]'
                }
              `}>
                {tier.badge}
              </div>
            )}

            {/* Tier Name */}
            <h3 className="text-xl font-display font-bold text-white mt-4 mb-2">
              {tier.name}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {tier.description}
            </p>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold text-white">
                  ${getPrice(tier)}
                </span>
                <span className="text-[var(--text-tertiary)]">
                  /{billingPeriod === 'year' ? 'year' : 'mo'}
                </span>
              </div>
              {billingPeriod === 'year' && tier.price > 0 && (
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  ${Math.round(getPrice(tier) / 12)}/mo billed annually
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-sm transition-all
                ${tier.highlighted
                  ? 'bg-regime-calm text-black hover:bg-regime-calm/90'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }
              `}
            >
              {tier.price === 0 ? 'Start Free' : 'Get Started'}
            </button>

            {/* Limits Summary */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)] uppercase tracking-wider">Assets</span>
                  <span className="text-white font-mono">
                    {tier.limits.assets === 'unlimited' ? '∞' : tier.limits.assets}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)] uppercase tracking-wider">Refresh</span>
                  <span className="text-white font-mono text-[10px]">{tier.limits.refreshRate}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)] uppercase tracking-wider">History</span>
                  <span className="text-white font-mono">{tier.limits.historyDays}d</span>
                </div>
                {tier.limits.apiCalls && (
                  <div className="flex flex-col">
                    <span className="text-[var(--text-tertiary)] uppercase tracking-wider">API</span>
                    <span className="text-white font-mono">
                      {tier.limits.apiCalls === 'unlimited' ? '∞' : `${tier.limits.apiCalls / 1000}k`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="mt-6 space-y-3">
              {tier.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-regime-calm flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enterprise CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-[var(--text-secondary)] mb-4">
          Need a custom solution? Running a fund or exchange?
        </p>
        <button className="px-6 py-3 rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-colors">
          Contact Sales →
        </button>
      </motion.div>

      {/* Trust Badges */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-16 flex flex-wrap justify-center gap-8 text-[var(--text-tertiary)] text-xs"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Bank-grade encryption</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12a1 1 0 11-2 0 1 1 0 012 0zm0-3a1 1 0 01-2 0V7a1 1 0 112 0v4z" />
          </svg>
          <span>No credit card for free tier</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span>Cancel anytime</span>
        </div>
      </motion.div>
    </div>
  );
}

