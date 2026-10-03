# Device and visual correction — 3 October 2026

## Causes and changes

- Board figures mixed Unicode outline/filled glyphs with a strong text stroke. White outlined shapes revealed the dark square through their interiors. Pawn SVGs used a separate scale and were visibly taller than the font-rendered major pieces on large boards.
- All six piece types now use shared, opaque SVG silhouettes. Colour is explicit on the SVG group, not inherited from a square, font, theme or emoji fallback. White is ivory, black is charcoal, both have contrasting outlines. Pawns use smaller geometry and occupy less of their square than major pieces.
- The renderer is shared by the game board, captured pieces, promotion choices, move/capture animation and review board. Previously the review board inherited colour from the square rather than the player.
- A final responsive geometry layer sizes the square board from both viewport dimensions, covers portrait/landscape and tablet widths, keeps controls available, bounds modal/side-panel scrolling and preserves touch targets. Tiny landscape screens necessarily use smaller squares.
- Keyboard activation is supported for board squares and promotion choices. Reduced-motion disables moving ghosts.
- Hints use full-strength analysis rather than the opponent's difficulty; a changed position discards the outstanding hint. An outstanding AI response is checked against game epoch and FEN. Concurrent engine requests cannot stop/replace an unrelated search.
- Black's board orientation now also works for online mode, not only AI mode.
- Fixed SAN disambiguation, rook capture/castling rights outside the home rank, and delayed checkmate completion after undo.
- PWA cache v16 includes the commercial and new rendering modules. Navigation is network-first with offline HTML fallback. Only this application's old caches are removed; storage and saved games are not deleted. Asset errors no longer return HTML as JavaScript/WASM.

## Executed evidence

`tests/device-validation.cjs` ran in Chromium and installed WebKit on 320×568, 390×664, 430×932, 768×1024, 1024×768, 1440×900, 844×390 and 568×320.

For each browser/viewport: 7 themes × 3 figure styles; identical pawn geometry/dimensions; invariant white/black SVG fill; pawns smaller than queens; square board within viewport; no horizontal document overflow; flipped board, capture/undo and review figures. Menu, academy, active review and settings also checked for horizontal overflow. No page JavaScript exceptions in these scenarios.

Additional browser tests: initial-position perft 20/400/8902, pinned en-passant rejected, castling through check rejected, underpromotion, SAN `Nbd2`, castling rights preserved when a non-home rook is captured, immediate mate and undo; actual Stockfish legal recommendation; stale hint discarded; correct vector/colour in move animation.

Chromium offline reload passed with application scripts available and a local-storage sentinel preserved. Existing puzzle and review-core tests passed. Inline/external script syntax and diff whitespace checks passed.

## Unverified / boundaries

- No physical iPhone/iPad/Android launch in this session. WebKit automation is relevant Safari-engine evidence, not a physical iOS acceptance.
- Firefox executable failed at startup with a profile-folder error; Firefox acceptance is not claimed.
- Installed WebKit reported an internal navigation error when reloading in automated offline mode. Real iOS offline/PWA behavior must still be checked; this is not reported as PASS.
- Internet play between two physical devices, native APK/AAB, billing and every possible imported/saved game are not covered by this visual/device audit. Existing v7 packages are not rebuilt here.
- No claim that every possible application defect has been eliminated. The fixes above have explicit regression coverage.

## Reproduce

Install a compatible Playwright runtime and its browsers, then run `node tests/device-validation.cjs`. Optional `PLAYWRIGHT_PATH`, `WEBKIT_EXEC`, `FIREFOX_EXEC`, and comma-separated `BROWSERS` select existing local runtimes. The test creates its own temporary browser profiles and serves this checkout on 127.0.0.1:4196; it does not use or reset the owner's saved browser data.
