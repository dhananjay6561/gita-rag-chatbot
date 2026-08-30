# Fixed Taxonomy — Gita RAG Chatbot

> **Closed vocabularies.** Every verse is tagged only from these lists — no free-text tags.
> Locked before tagging so retrieval stays consistent across 700 verses. Additions require a
> deliberate version bump + re-tag, not ad-hoc edits. `category` in the eval golden set (EVAL_SPEC §2.3)
> must map to a `life_situation` below.

## emotional_tags — what the user *feels* (tag 1–4 per verse)
anxiety · fear · anger · resentment · grief · sadness · guilt · shame ·
overwhelm · restlessness · hopelessness · loneliness · jealousy ·
attachment · confusion · self-doubt · frustration · apathy · craving · pride

## themes — the *teaching* the verse carries (tag 1–3 per verse)
detachment from outcomes · duty & right action · impermanence ·
equanimity · self-discipline · surrender & trust · knowledge vs ignorance ·
ego & humility · desire & its mastery · steadiness of mind ·
acceptance of loss · courage in adversity · faith · non-attachment to results ·
purpose & svadharma (one's own path)

## life_situations — the *context* the user is in (tag 1–3 per verse)
career pressure · exam/study stress · relationship conflict · breakup/divorce ·
family conflict · grief/bereavement · health/illness · financial worry ·
decision paralysis · failure/setback · burnout/loss of motivation ·
moral dilemma · social comparison · major life transition · caregiving strain

---

### Tagging rules
1. Tag from these lists only. If a verse truly fits nothing, flag it for a taxonomy-review batch — don't invent a tag inline.
2. Prefer fewer, accurate tags over many loose ones (retrieval noise).
3. `themes` describe the verse; `emotional_tags`/`life_situations` describe the *user states it speaks to* — a verse about duty may be tagged `apathy`/`burnout` because it *answers* them.
4. The composite embedding string (ARCHITECTURE §3) concatenates `plain_explanation + themes + life_situations + emotional_tags`, so tag for how a *user* would phrase the problem, not scholarly terms.

**Version:** v1 (locked pre-tagging). Bump on any list change; re-embed affected verses.
