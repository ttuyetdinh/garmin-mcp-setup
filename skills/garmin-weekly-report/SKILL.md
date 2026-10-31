---
name: garmin-weekly-report
description: Build a 7-day Garmin health and activity report (activities/running, sleep, stress, body battery, HRV, training readiness/status, VO2 max, SpO2, respiration, load balance, lactate threshold). Use ONLY when the user asks for it explicitly, e.g. "/garmin-report", "show my 7-day Garmin report", "Garmin health summary this week", "xem báo cáo Garmin 7 ngày". Do not trigger just because running or health comes up in general; answer those single questions with the relevant Garmin tool directly.
---

# Garmin Weekly Report

7-day health and activity report from Garmin, shown as markdown tables in the chat (no file unless the user asks for one).

## Notes
- **Lactate threshold bug**: if memory has a note that `lactate_threshold_speed_mps` is off by a factor of 10, multiply by 10 before using it or computing pace, and do not mention this fix in the report.
- **TSB**: describe it as "race readiness/form", not as "freshness/fatigue".
- Reply in the user's language; keep the original English metric names (HRV, VO2 Max, Body Battery...).
- Missing data in a cell: write "n/a". Never invent numbers, never drop rows.

## Workflow

**1. Date range**: default is the last 7 days (today -6 to today), unless the user specifies another range.

**2. Call tools**, preferring the light summary/trend versions; avoid the full versions unless the user wants to dig deeper:

Per date range (once): `get_activities_by_date`, `get_hrv_trend`, `get_vo2max_trend`, `get_respiration_trend`, `get_training_load_trend`, `get_endurance_score`, `get_lactate_threshold`.

Per day (7 calls, or only the last 1-2 days for metrics that change little): `get_sleep_summary`, `get_stats` (main source for daily steps/HR/stress/body battery/SpO2/respiration), `get_training_readiness` (last 1-2 days), `get_training_load_balance` (once, trailing month), `get_fitnessage_data` (once).

If you need to cut back, do activities + sleep + stats first and add the rest afterwards.

**3. Present** (markdown tables, skip any section without data):

1. Quick summary (2-3 sentences)
2. Activities/Running: Date | Type | Distance | Duration | Avg pace | Avg HR
3. Sleep: Date | Total sleep | Deep | REM | Light | Sleep Score
4. Stress & Body Battery: Date | Avg stress | Max stress | BB high | BB low
5. Recovery: daily HRV + baseline (flag deviations >10ms), latest Training Readiness, Respiration trend
6. Long-term fitness: VO2 Max, Endurance Score, Lactate Threshold (pace/HR), **Training Load** (daily ATL|CTL|TSB|ACWR table: ATL=acute fatigue ~7 days, CTL=base fitness ~42 days, TSB=CTL−ATL measures form, ACWR=ATL/CTL measures injury risk: <0.8 underloaded, 0.8–1.3 optimal, >1.5 high), plus `training_status` if available; Load Balance (Aerobic Low/High/Anaerobic)
7. Other: average SpO2, Fitness Age if available

Finish with 2-4 short bullet observations based on the actual numbers, no extra speculation, not medical advice.

## Export
If the user wants a file, create a .md (or use the `docx` skill if they ask for Word) with the same content.
