# Recording Pipeline Optimization — Done

| # | Change | Status |
|---|--------|--------|
| 1 | `buildRecordXml()`: `maxLength="15"` → `"8"` (service + controller) | ✅ |
| 2 | `downloadAudio()`: `timeout: 15000` → `6000` | ✅ |
| 3 | Per-turn latency logging: `turnStart` + `sttStart` + `llmStart` + `totalTurn` | ✅ |
| 4 | `sarvam-ai.provider.ts`: `max_tokens: 500` → `150` | ✅ |
| 5 | Contact email: `ramnarayan847230@gmail.com` already present (no change needed) | ✅ |
| 6 | Controller `handleRecording`: try/catch already present (no change needed) | ✅ |
| 7 | `use-calls.ts`: `onError` handler added (shows real error message) | ✅ |

## Latency target
- Recording: **1.5s** (was ~2-3s with maxLength=15)
- Download: **~0.8s** (timeout reduced to 6s)
- STT: **~1.5s**
- LLM: **~1-2s** (max_tokens reduced by 70%)
- **Total per turn: ~4-5s** (was ~8s)
