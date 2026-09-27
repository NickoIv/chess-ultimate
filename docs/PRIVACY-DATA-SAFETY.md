# Privacy and Data Safety

This document describes the current implementation, not a promise about future services.

## Stored locally on the device

- saved games, move history and PGN data;
- settings, theme, statistics and Academy progress;
- cached Stockfish reviews and Train My Mistakes exercises;
- locally cached entitlement state as a convenience cache only.

## Sent for online play

Private online rooms use PeerJS signalling and WebRTC/STUN/TURN networking. Room codes and moves are used to establish and maintain the match. They must not be sent to analytics.

## Chess analysis

The bundled Stockfish WASM engine analyses positions locally on the device. The engine analysis itself is not sent to a Chess Ultimate server.

## Billing

When Google Play Billing is enabled, Google Play processes purchase, restore and acknowledgement flows. The app must rely on Play purchase state for ownership, not local browser storage alone.

## Ads and analytics

No production advertising SDK or analytics provider is currently configured. The app contains only an internal event boundary. If either is enabled later, this document and the Play Data safety form must be updated before release.
