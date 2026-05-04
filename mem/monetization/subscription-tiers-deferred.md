---
name: Subscription Tiers (Deferred)
description: Free/Pro/Sovereign monetization decisions parked until later wave
type: feature
---
**Status:** Wave 1.2 deferred by user. Do not implement paywall/Paddle until user re-opens it.

**Decided matrix (locked-in):**
- **Free (généreux):** Goals, Habits, Health, Finance manuel, Community, Achievements core.
- **Pro (~7€/mois):** AI Coach, connecteurs banque + santé (Bridge/Apple/Google), exports PDF, calendrier 2-way sync.
- **Sovereign (~19€/mois):** tout Pro + sessions humaines de coaching 1:1 + early access nouvelles fonctions.

**Provider décidé (à retenir):** Paddle (Seamless, MoR, 5%+0,50€). Ne pas re-proposer Stripe sauf demande explicite.

**Pricing target:** annual base — Pro 7€, Sovereign 19€ (placeholders confirmés par user).

When user says "on reprend la Vague 1.2" or "active le pricing": run enable_paddle_payments → batch_create_product with the matrix above.
