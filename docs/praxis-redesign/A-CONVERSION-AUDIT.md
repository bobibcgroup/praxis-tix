# Concept A: conversion audit and gating

Date: 2026-09-28. Direction chosen: Concept A (Stage). This audit covers how clearly the product's functions are placed for a new visitor and where the paid moments sit.

## Findings

1. **Style DNA was invisible.** On the home it was a grey text link under the primary button; inside a journey it appeared only in the monogram menu as "Your DNA". Nothing said what it is or why it matters. A paid feature cannot live as a footnote.
2. **Try-on gave no signal that it is gated.** "See it on you" read as a free next step. A gate that appears only after the tap feels like a bait and switch and costs trust at the best moment.
3. **No account presence.** Nothing in A suggested that looks, DNA and purchases attach to a person, so sign-in would arrive as an interruption instead of an expectation.
4. **The completion state under-sold DNA.** "Build my Style DNA" was the weakest of three actions at the moment the user is most satisfied and most open to a second step.
5. **The free path is the hook and must stay free.** Occasion to three looks costs nothing and asks for no account. Sign-in is asked only when something needs to be kept; payment only when the two premium capabilities are requested.

## Changes

- **Home** shows two paths of unequal weight: the primary "Dress me for a moment", and a Style DNA block under a rule with a value line ("Know your colours and fit once. Two taps every time after."), one sentence on what it reads, and a secondary "Build my Style DNA" marked "Plus". With a DNA on file the block collapses to one line with "Update".
- **Premium marker.** Every gated action carries a quiet "Plus" word inside the control until the user has Plus. Results add one line under the actions on desktop: "Plus shows every look on you and saves your DNA."
- **Completion** promotes "Build my Style DNA" to the secondary control under "Style another moment", with "Two taps next time" above it.
- **Account presence.** "Sign in" in the top bar when signed out; an initial in a circle when signed in; name and "Sign out" in the menu.
- **One gate flow**, opened in place over the stage, never navigating away: step 1 sign in (Apple, Google, or email), step 2 Praxis Plus (what you get, price, Apple Pay, or card), success, then the requested action happens immediately. Steps already satisfied are skipped. Save and Buy ask for sign-in only; try-on and DNA ask for sign-in then Plus.

## Placeholder decisions to confirm

- **Plan shape.** A single membership, Praxis Plus, unlocks both try-on and DNA. Alternatives: DNA as a one-time purchase and try-on per look, or DNA free and try-on paid.
- **Price.** $9 a month is a placeholder.
- **What stays free.** Style a moment to three looks, with the reason and the pieces. Saving requires sign-in only.
- **Sign-in providers.** Apple and Google match the live Clerk setup; email is added as a lower-friction fallback and can be removed.

## Not implemented

The sign-in and payment sheets are visual previews. No Clerk, Stripe or Apple Pay calls are made; the state lives in local storage for the prototype. Production will need Clerk for identity, a Stripe Checkout or Payment Element with Apple Pay enabled, and a server-side entitlement check before try-on and DNA endpoints run.
