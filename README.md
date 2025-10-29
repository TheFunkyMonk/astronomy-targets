# Telescope Viewing Targets

A Node.js script that uses the Astronomy API and 7timer weather data to determine what celestial bodies are good viewing targets based on your location, time, telescope capabilities, and current weather conditions.

## Features

- **Weather-Aware Planning**: Checks current atmospheric conditions (cloud cover, seeing, transparency) before recommending viewing sessions
- **Smart Target Analysis**: Evaluates celestial objects throughout your evening viewing window
- **Telescope-Specific Ratings**: Adjusts recommendations based on your equipment capabilities
- **Detailed Viewing Information**: Provides optimal viewing times, directions, and reasons for each target

## Requirements

- Node.js v20.11 or higher
- Astronomy API credentials (free tier available at https://astronomyapi.com)

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
npm start
```

The script will:

1. **Check Weather Conditions** - Fetches real-time atmospheric data from 7timer including:
   - Cloud cover forecast
   - Atmospheric seeing (stability)
   - Transparency
   - Precipitation

2. **Provide Viewing Recommendation** - Advises whether conditions are suitable for observing

3. **Analyze Celestial Targets** - Shows visibility throughout your configured evening time range with:
   - Best viewing time for each celestial body (when it's highest in the sky)
   - Overall visibility rating: Excellent, Good, Fair, Poor, or Not Visible
   - Direction, constellation, magnitude, and duration visible

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
Date: 2025-10-29
Location: 47.6693552, -122.3891101 (15.24m elevation)
Telescope: Entry-level telescope (60-80mm aperture)
Time Range: 21:00 - 2:00
======================================================================

Checking weather conditions...

🌤️  WEATHER CONDITIONS FOR TONIGHT:
----------------------------------------------------------------------
Overall Quality: GOOD
Cloud Cover: 2/9 (1=clear, 9=overcast)
Atmospheric Seeing: 5.5/8 (higher is better)
Transparency: 3.5/8 (higher is better)
Conditions: some clouds, average atmospheric stability

✅ VIEWING RECOMMENDATION: GO OUTSIDE!
Weather conditions are favorable for telescope viewing tonight.
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

## Weather Condition Ratings

The script evaluates weather conditions and provides one of these ratings:

- **Excellent**: Clear skies, great seeing and transparency
- **Good**: Mostly clear with good atmospheric conditions
- **Fair**: Some clouds or average atmospheric conditions
- **Poor**: Significant cloud cover or poor seeing
- **Unsuitable**: Heavy clouds or precipitation expected

## APIs Used

- **Astronomy API** (https://astronomyapi.com) - Provides celestial body positions and data
- **7timer** (https://www.7timer.info) - Free astronomical weather forecasting (no API key required)

## Tips

- Objects rated "Excellent" or "Good" are your best bets
- Check weather conditions before heading out - even great celestial positioning won't help if it's cloudy!
- Magnitude scale: lower/negative numbers = brighter (easier to see)
- Higher altitude = better viewing (less atmospheric distortion)
- The Moon is always a great target for beginners!
- If weather is poor, the script still shows what would be visible if conditions improve

## Troubleshooting

- **Weather data unavailable**: The script will continue without weather data and still show celestial targets
- **No targets visible**: Check your evening time range configuration - you may need to adjust the hours
- **All targets rated as poor**: Your telescope level might be too restrictive, or objects may be low on the horizon during your viewing window
