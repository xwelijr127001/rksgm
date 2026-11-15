# BOARD

Status: todo | doing | review | bug | done

| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| T-001 | (example) | Fullstack | todo | |
| T-002 | Rename "Senior Layanan Klaim" -> "Layanan Klaim" / Claims Officer / 理赔专员 everywhere incl. story scripts | Fullstack | done | spec rev2.1 · Lead verified 2026-11-15: git grep zero hits, 724/724 tests pass, PIC note kept; +docs/rancangan-mode-cerita.md:509 · not committed |
| T-003 | Homepage phone layout: hero+greeting on top, Join Game above fold, 320-430px + landscape | Designer -> Fullstack -> Designer+QA | done | 2026-11-15 Lead closed: Fullstack 724/724 + e2e 0 fail · Codex OK with notes (R-08 live banner -> verified by QA) · Designer PASS (D-15 pre-existing -> T-006; D-16..D-20 low polish) · QA PASS 0 bugs · not committed |
| T-006 | Landscape phone + legacy banner covers code field and Masuk (pre-existing, not caused by T-003); Designer D-15 | Fullstack | done | 2026-11-15 Lead closed: player.css only · 724/724 + e2e 0 fail · QA PASS 0 bugs, real open room, landscape pill verified · 320x568 banner residual ~7px accepted (low) · not committed |
| T-005 | Join code field clips 6 wide letters ("WWWWWW") on /cerita hub (shared JoinGame); homepage fixed in T-003 D-11 | Fullstack | done | 2026-11-15 Lead closed: player.css only · 724/724 + e2e 0 fail · QA PASS 0 bugs, real open room, landscape pill verified · 320x568 banner residual ~7px accepted (low) · not committed |
| T-004 | Homepage game feel: pixel-art hero (reuse story assets) + game-style CTA, reduced-motion safe; NO full restyle | Designer -> Fullstack -> Designer+QA | done | 2026-11-15 Lead closed: WelcomeArt + player.css only · 724/724 + e2e 0 fail · +0.42 KB gzip, 0 new images (QA confirmed on prod build, closes R-09) · Codex OK with notes (R-10 low) · Designer PASS (D-36..D-39 low) · QA PASS 0 bugs incl. motion matrix + flag-off · not committed |
| T-007 | Homepage polish bundle after T-004: Codex R-10 (frame ::before/::after in reduce block), Designer D-36 (left tower 3 window columns), D-37 (sprite filter:none in hero), D-38 (bubble tail when Miss Raksa inactive) | Fullstack -> QA | done | 2026-11-15 Lead closed: WelcomeArt + player.css + art doc · 724/724 + e2e 0 fail · QA PASS 0 bugs incl. flag-off and reduce matrix · brand.ts clean · not committed |
