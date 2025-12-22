# TO DO's
- When clicking on slot machine => direct to games page / or if not yet signed up direct to sing in / sing up page
- only able to access games page when signed in
- Fix layout on different devices (ex.67% on windows)





# Juri's To Do's

# 5. Technical structure of slots.jsx
    Inside slots.jsx, you could structure like:
    Top‑level component: ClassicSlotsPage
    Fetches/receives user balance (from context or API).
### Renders:
    SlotsHeader (balance, back button).
    ReelArea (visual reels, driven by state).
    Controls (bet, spin, auto‑spin).
    ResultBanner (win/lose messages).
    HistoryPanel.
    State hooks
    balance, betSize, isSpinning, reelState, lastResult, history, autoSpinConfig.
    Spin handler
    On Spin:
    Disable controls.
    Call /api/spin/classic-slots with { betSize }.
    Animate reels while waiting for response (with min animation duration).
    On response, stop reels to match symbols, update balance and history.
# 6. Responsible back‑end considerations (for later)
    Server tracks:
    User balance, deposits/withdrawals.
    Game results logs for audits.
    Anti‑abuse & fairness:
    Use a well‑tested RNG library.
    Keep configuration (RTP, paytable) versioned for audits.
    Responsible gaming hooks:
    API endpoints for setting limits.
    Logs for detecting harmful patterns (used to prompt breaks / info, not exploit).