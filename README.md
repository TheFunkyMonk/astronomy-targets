# Telescope Viewing Targets Script

A Node.js script that uses the Astronomy API to determine what celestial bodies are good viewing targets based on your location, time, and telescope capabilities.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with:
   - Your Astronomy API credentials (get them at https://astronomyapi.com)
   - Your latitude, longitude, and elevation
   - Your telescope level (entry/intermediate/advanced)
   - Optional: Custom evening viewing hours

## Usage

Run the script:
```bash
node telescope-targets.js
# or
npm start
```

The script will:
- Analyze visibility throughout your configured evening time range
- Show the best viewing time for each celestial body (when it's highest in the sky)
- Rate each target based on overall visibility: Excellent, Good, Fair, Poor, or Not Visible
- Provide helpful details like direction, constellation, magnitude, and how many hours it's visible

## Telescope Levels

**Entry Level** (default)
- Suitable for: 60-80mm aperture telescopes
- Can see objects up to magnitude 10
- Requires objects to be at least 15° above horizon

**Intermediate**
- Suitable for: 100-150mm aperture telescopes
- Can see objects up to magnitude 12
- Requires objects to be at least 10° above horizon

**Advanced**
- Suitable for: 200mm+ aperture telescopes
- Can see objects up to magnitude 14
- Can view objects as low as 5° above horizon

## Example Output

```
======================================================================
TELESCOPE VIEWING TARGETS
======================================================================
Date: 2025-10-28
Location: 47.6693552, -122.3891101 (15.24m elevation)
Telescope: Entry-level telescope (60-80mm aperture)
Time Range: 21:00 - 2:00
======================================================================

Analyzing celestial positions throughout the evening...

⭐ EXCELLENT TARGETS:
----------------------------------------------------------------------

Saturn
  Best viewing: 10:00 PM (32.5° altitude)
  Direction: SE (135.2°)
  Magnitude: 0.75
  Constellation: Aquarius
  Visible: 5/6 hours checked
  Why it's great: High in sky, minimal atmospheric interference

✨ GOOD TARGETS:
----------------------------------------------------------------------

Moon
  Best viewing: 9:00 PM (18.3° altitude)
  Direction: SSW (196.9°)
  Magnitude: -9.84
  Visible: 4/6 hours checked
  Note: Good viewing angle, very bright

💫 FAIR TARGETS:
----------------------------------------------------------------------

Uranus
  Best viewing: 11:00 PM (12.1° altitude)
  Magnitude: 5.61
  Note: Viewable but lower in sky, relatively faint

❌ NOT VISIBLE TONIGHT:
----------------------------------------------------------------------
  Venus, Mercury, Mars, Jupiter

======================================================================
💡 TIP: Start with the highest-rated targets when you first go outside!
======================================================================
```

## Tips

- Objects rated "Excellent" or "Good" are your best bets
- Magnitude scale: lower/negative numbers = brighter (easier to see)
- Higher altitude = better viewing (less atmospheric distortion)
- The Moon is always a great target for beginners!
