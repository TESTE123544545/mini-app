# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Brazilian adults, mostly on their phones, who want to organise money, habits and goals and are drawn to astrology as a language for self-knowledge. They open the app daily for a few minutes: read the day's guidance, do a small action, reflect.

## Product Purpose

Veias da Sintonia ("Use seu signo para prosperar") turns the person's sign and chosen objective into a daily practice. Owner's own formulation: "astrologia que vira ação; ação que vira constância; constância que faz sua árvore crescer." Success is a person who returns every day and whose Prosperity Tree grows because they acted, not because they were promised anything.

## Positioning

Astrology used as a practical self-knowledge ritual tied to real actions and a growing tree — not horoscope entertainment and not financial advice.

## Operating Context

Daily cycle: sign + objective → guidance of the day → mission and 3-minute ritual → XP and tree growth → journal reflection → weekly report. Free accounts can only take the diagnostic; Premium (Stripe: monthly R$ 29,99 or lifetime) unlocks the diagnostic result and everything else in the app.

## Capabilities and Constraints

- Next.js-style app (vinext) deployed as a Cloudflare Worker; D1 database; accounts with email and password.
- Portuguese (pt-BR) only.
- No videos anywhere (owner decision); prefer light WebP images. Content Security Policy only allows self-hosted fonts and assets.
- Mobile-first; must also work on desktop.

## Brand Commitments

- Name: Veias da Sintonia. Gold/amber is the brand accent.
- Never promise money, returns or guaranteed results; readings are symbolic and reflect only what the person records in the app.
- No scary or deterministic horoscopes, no guilt-driven notifications, no casino look, no random prizes; the Wheel of Fortune and tarot are symbolic daily rituals without prizes.
- Respect the system "reduce motion" setting.

## Evidence on Hand

- Zodiac sculpture stills in `public/zodiac/*.webp` and the portal loop `public/portal-loop.mp4` with its poster (placeholders; the owner will send new renders for the redesign).
- No testimonials, user counts or press exist — never fabricate them.

## Product Principles

- Every feature feeds the daily cycle rather than adding screens for their own sake.
- Monetization (owner decision, September 2026): the free plan is only taking the diagnostic. Its result and every other screen are Premium. No false countdowns, and cancellation stays easy.
- Calm confidence over hype.
