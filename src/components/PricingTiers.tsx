/**
 * Pricing Tiers Component
 * Displays subscription options for SentimentDNA
 * 
 * Tiers:
 * - Free: Basic features, delayed data
 * - Pro: Full access, real-time, advanced features
 * - Enterprise: Custom solutions, API access, white-label
 */

import { motion } from 'framer-motion';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with basic sentiment analysis',
    features: [
      'BTC & ETH real-time sentiment',
      'Basic phase portrait visualization',
      'Demo mode access',
      '5-minute delayed data',
      'Community support',
    ],
    limitations: [
      '2 assets only',
      'No API access',
      'No alerts',
    ],
    cta: 'Current Plan',
    ctaDisabled: true,
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Full power for serious traders',
    features: [
      'All 10 coins real-time',
      'CryptoBERT NLP (SHAP explainability)',
      'Bot/shill detection & filtering',
      'Funding rate squeeze alerts',
      'HMM regime detection',
      'Cross-asset correlation matrix',
      'API access (1,000 req/day)',
      'Discord alerts',
      'Priority email support',
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
    highlighted: true,
    badge: 'MOST POPULAR',
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    description: 'For funds, trading desks & institutions',
    features: [
      'Everything in Pro',
      'Unlimited coins (custom support)',
      'Webhook alerts (Slack, Telegram)',
      'Historical backtesting (2 years)',
      'Unlimited API access',
      'Custom model fine-tuning',
      'White-label dashboard option',
      'Dedicated account manager',
      'SLA guarantee (99.9% uptime)',
    ],
    limitations: [],
    cta: 'Contact Sales',
    ctaDisabled: false,
    highlighted: false,
  },
];

export function PricingTiers() {
  return (
    <div className="p-8 bg-[var(--bg-primary)] rounded-2xl">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Choose Your <span className="text-[#3b82f6]">Edge</span>
        </motion.h2>
        <motion.p 
          className="text-[var(--text-secondary)] max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          From hobbyist to institutional—get the sentiment intelligence you need 
          to make informed decisions.
        </motion.p>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`
              relative p-6 rounded-2xl border transition-all
              ${tier.highlighted 
                ? 'bg-gradient-to-b from-[#3b82f6]/10 to-transparent border-[#3b82f6]/30 shadow-lg shadow-blue-500/10' 
                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }
            `}
          >
            {/* Badge */}
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#3b82f6] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {tier.badge}
                </span>
              </div>
            )}

            {/* Tier Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
              <p className="text-xs text-[var(--text-tertiary)]">{tier.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">{tier.price}</span>
              <span className="text-[var(--text-tertiary)]">{tier.period}</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {tier.features.map((feature, j) => (
                <li 
                  key={j} 
                  className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <span className="text-[#10b981] mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Limitations */}
            {tier.limitations.length > 0 && (
              <ul className="space-y-2 mb-6 pt-4 border-t border-white/5">
                {tier.limitations.map((limitation, j) => (
                  <li 
                    key={j} 
                    className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
                  >
                    <span className="text-[#6b7280]">✕</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* CTA Button */}
            <button
              disabled={tier.ctaDisabled}
              className={`
                w-full py-3 rounded-lg font-bold text-sm transition-all
                ${tier.highlighted
                  ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb] shadow-lg shadow-blue-500/20'
                  : tier.ctaDisabled
                    ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }
              `}
            >
              {tier.cta}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-12">
        <p className="text-xs text-[var(--text-muted)]">
          All plans include 14-day money-back guarantee. No credit card required for Free tier.
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Questions? Email us at <span className="text-[#3b82f6]">support@sentimentdna.io</span>
        </p>
      </div>
    </div>
  );
}
