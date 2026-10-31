---
name: "garmin-report-analysis"
description: "Deep analysis of the Garmin report from /garmin-weekly-report with a 4-week trend, and detailed metric definitions looked up on Garmin Technology pages when the user asks in depth (HRV, VO2 Max, Training Status, Load, Body Battery...)."
---

# Garmin Report Analysis

Two jobs:

1. **Analyse the weekly report** from `/garmin-weekly-report` against a 4-week trend, because a single number is usually just noise.
2. **Look up and explain a metric in detail** when the user asks in depth ("how is HRV Status calculated", "what goes into Training Readiness", "why Maintaining"). The authoritative sources are the two Garmin Technology pages below; do not answer from memory when the question needs detail.

## Metric sources (required for in-depth questions)

- Running Science: https://www.garmin.com/en-US/garmin-technology/running-science/
- Health Science: https://www.garmin.com/en-US/garmin-technology/health-science/

Detail pages sit one level deeper. Running prefix: `https://www.garmin.com/en-US/garmin-technology/running-science/physiological-measurements/` plus `vo2-max/`, `training-status/`, `training-load/`, `recovery-time/`, `training-effect/`, `lactate-threshold/`, `race-time-prediction/`, `real-time-stamina/`, `performance-condition/`, `epoc/`, `training-readiness/`, `endurance-score/`, `running-economy/`, `running-tolerance/`, `heat-and-altitude-acclimation/`. There is also `.../running-science/running-dynamics/`. Health prefix: `https://www.garmin.com/en-US/garmin-technology/health-science/` plus `hrv-status/`, `sleep-tracking/`, `sleep-coach/`, `body-battery/`, `stress-tracking/`, `respiration-rate/`, `pulse-ox/`, `fitness-age/`, `intensity-minutes/`, `heart-rate-monitoring/`, `calories-burned/`. If a metric is not in this list, open the hub page to get the list of links.

### How to look up

1. **Use the built-in browser first** (open the page with `preview_start` or `navigate`, then `get_page_text`). These pages load their content with JavaScript, so `WebFetch` usually returns only the navigation menu. If `WebFetch` shows no article content, switch to the browser. If a long page is cut off, read the rest with `javascript_tool` (slice `document.querySelector('main').innerText` at heading boundaries).
2. **Do not bypass bot checks.** If the page shows "Just a moment..." (Cloudflare), wait a few seconds and retry once. If still blocked, stop, tell the user the page could not be opened, and answer from the "Quick interpretation guide" below, clearly marked as the built-in summary, not re-checked against the source page.
3. **Explain in your own words**, in this order: what the metric measures, inputs and calculation, levels or labels, how to interpret it, its limits. Then tie it to the user's real numbers ("your week is X, which means ..."). Summarise and paraphrase; do not paste long passages from the page. End the answer with the links you used.
4. **Questions spanning several metrics**: open each relevant page (e.g. Training Status also needs VO2 Max, Training Load, HRV Status).

## Input for the weekly analysis

The `/garmin-weekly-report` report must already be in the conversation; use it as the "this week" data and do not call tools again for numbers it already has. If it is missing, run the `garmin-weekly-report` skill first.

## Weekly analysis workflow

**1. Get the 4-week trend** (28 days ending today, split into 4 weeks, W0 is the report's week). Call in parallel, preferring summary/trend versions:

- `get_activities_by_date` (28 days, paginate while `has_more`): runs, km, duration, avg HR per week.
- `get_sleep_summary_range` (28 nights): sleep hours, Sleep Score, overnight HRV.
- `get_hrv_trend` (28 days, max 30): daily HRV, weekly average, status.
- `get_training_load_trend` (28 days): ATL, CTL, ACWR, training status.
- `get_vo2max_trend`, `get_endurance_score` (28 days).
- `get_stats_range` (28 days): steps, calories.
- `get_respiration_trend` (28 days).
- `get_race_predictions` and `get_running_tolerance_trend` if the user runs regularly.

If a tool fails or has no data, write "no data" in that cell and say so in the findings. Do not interpolate.

**2. Aggregate by week** and analyse three layers: Recovery, Load, Fitness. Then look for cross-layer links (e.g. HRV drops after a hard run, low Sleep Score pulls Training Readiness down). When a conclusion needs a detailed definition, open the matching Garmin page as described in "How to look up".

**3. Compare with goals.** If the user's memory has a race goal (e.g. a half marathon), compare VO2 Max, Endurance Score, lactate threshold and race predictions with it. Otherwise skip.

## Quick interpretation guide (summarised from the Garmin pages, for when no deep dive is needed)

- **HRV Status.** Garmin compares the 7-day average of overnight HRV with a personal baseline range, so one low night is not a signal by itself. Flag only when status is not BALANCED or the weekly average falls for several days in a row. The baseline needs about 3 weeks of overnight wear.
- **Sleep Score (0 to 100).** Duration versus the age-based recommendation, sleep architecture, stress from HRV, awakenings over 5 minutes, total awake time. Look at the trend over several nights.
- **Stress (0 to 100).** Estimated from HR and HRV. Below 25 is rest, above 25 is sympathetic dominance. Not measured during exercise.
- **Body Battery.** Charges mainly during sleep, drained by activity and stress. The daily peak reflects how well it charged the night before.
- **Training Readiness.** Poor to prime. Main factors are Sleep Score and Recovery Time, plus Acute Load, HRV Status, Sleep History, Stress History (last 3 waking days). Highest on waking; a drop after training is normal. It does not predict race performance.
- **Recovery Time.** After a hard session (Training Effect 3.0 or more), wait until recovery is green. Poor sleep and sustained high stress lengthen it; good sleep shortens it.
- **Acute Load, ACWR.** Acute load stops counting after about 10 days and is normalised to a 7-day window. ACWR below 0.8 is underloaded, 0.8 to 1.3 optimal, above 1.5 high. Describe TSB as "race readiness/form", not as "freshness/fatigue".
- **Load Focus (4 weeks).** Anaerobic (sprint intervals), High Aerobic (tempo), Low Aerobic (long easy runs). Feedback is Shortage, Balanced, Focus, and Below/Over Targets for total load.
- **Training Status.** Peaking, Productive, Maintaining, Strained, Unproductive, Overreaching, Recovery, Detraining. Interprets the VO2 Max trend together with load and HRV; needs at least one outdoor run per week.
- **VO2 Max.** Estimated from pace versus cardiovascular effort. Short-term changes under 0.5 are noise; look at the 4 to 6 week trend. Heat, humidity and altitude can lower it temporarily.
- **Endurance Score.** VO2 Max as the base, plus 2 to 3 months of history and the last 2 weeks; long sessions weigh more, and every activity with HR contributes.
- **Lactate Threshold.** The effort above which fatigue builds quickly. Expressed as pace, LTHR and power. LTHR is the zone 4 / zone 5 boundary when zones are set by %LTHR. If the pace is off by a factor of 10 compared with the note in memory, multiply by 10 before using it and do not mention the fix.
- **Running Tolerance.** Impact load converted to equivalent km. Acute impact load above tolerance is a warning state; tolerance adjusts at the start of each week.
- **Fitness Age, Respiration Rate, SpO2, Race Time Prediction.** No built-in summary yet. Look up the Garmin page when needed; if it cannot be opened, report only the numbers and trend, never invent how they are calculated.

## Weekly analysis output format

Reply in the user's language; keep the original English metric names. No em-dashes; use a period or a comma. No file unless the user asks for one.

1. **Conclusion** (3 sentences): was this a good week or does it need adjusting, and the single most important point.
2. **4-week trend** (table): Week | Runs | Total km | Avg HR | Avg HRV | Sleep (hours, score) | Avg stress | End-of-week ATL | CTL | VO2 Max. Drop columns without data.
3. **Analysis** (a table per layer: Recovery, Load, Fitness): Signal | How Garmin defines it | What it means for you. Tie every conclusion to a number and a definition.
4. **Cross-links**: 1 to 3 recurring patterns, stated as hypotheses from the data, not certain causes.
5. **Next week** (2 to 4 bullets): number and type of sessions (easy, tempo, long run) tied to Load Focus, Training Readiness and the goal if there is one.

End with one sentence saying this is training guidance based on device data, not medical advice.

## Principles

- Separate noise from trend. An outlier is worth mentioning only if it repeats or matches another signal.
- Today is usually partial data (steps, Body Battery, stress); leave it out of weekly averages unless the day is complete.
- With fewer than 3 runs in 4 weeks, VO2 Max and Training Status are unreliable; say so.
- Do not diagnose. If abnormal values persist (HRV unbalanced for many days, rising resting respiration, repeatedly low SpO2), suggest watching how the user actually feels and seeing a medical professional if there are symptoms.
