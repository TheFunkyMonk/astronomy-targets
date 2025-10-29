# Telescope Viewing Targets

A Node.js script that uses the Astronomy API and 7timer weather data to determine what celestial bodies are good viewing targets based on your location, time, telescope capabilities, and current weather conditions.

## Features

- **Weather-Aware Planning**: Checks current atmospheric conditions (cloud cover, seeing, transparency) before recommending viewing sessions
- **Smart Target Analysis**: Evaluates celestial objects throughout your evening viewing window
- **Telescope-Specific Ratings**: Adjusts recommendations based on your equipment capabilities (entry/intermediate/advanced)
- **Optimal Viewing Times**: Shows when each target reaches its peak altitude for best viewing
- **Simplified Output**: Clean, scannable format showing only the most relevant information

## Requirements

- Node.js v20.11 or higher
- Astronomy API credentials (free tier available at https://astronomyapi.com)

## Setup

1. Install dependencies:
   ```bash
   npm install dotenv
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

### Example `.env` file:

```env
# Astronomy API Credentials
ASTRONOMY_API_APP_ID=your_app_id_here
ASTRONOMY_API_APP_SECRET=your_app_secret_here

# Location (find yours at https://www.latlong.net/)
LATITUDE=47.6062
LONGITUDE=-122.3321
ELEVATION=50

# Telescope Configuration
TELESCOPE_LEVEL=entry

# Evening Viewing Window (24-hour format)
EVENING_START_HOUR=21
EVENING_END_HOUR=2
```

## Usage

Run the script:

```bash
node index.js
```

The script will:

1. **Check Weather Conditions** - Fetches real-time atmospheric data from 7timer including:
   - Cloud cover forecast
   - Atmospheric seeing (stability)
   - Transparency
   - Precipitation

2. **Provide Viewing Recommendation** - Clear GO/NO-GO recommendation based on weather

3. **Analyze Celestial Targets** - Shows the best viewing targets categorized by quality (Excellent, Good, Fair) with:
   - Optimal viewing time (when object is highest in sky)
   - Peak altitude and compass direction
   - Only shows targets worth observing (filters out poor quality and invisible objects)

## Telescope Levels

The script adjusts recommendations based on your telescope capabilities:

**Entry Level** (60-80mm aperture)
- Can see objects up to magnitude 10
- Requires objects to be at least 15° above horizon
- Best for: Moon, bright planets, some brighter deep-sky objects

**Intermediate** (100-150mm aperture)
- Can see objects up to magnitude 12
- Requires objects to be at least 10° above horizon
- Best for: All planets, many deep-sky objects, some galaxies

**Advanced** (200mm+ aperture)
- Can see objects up to magnitude 14
- Can view objects as low as 5° above horizon
- Best for: Faint deep-sky objects, distant galaxies, challenging targets

## Example Output

```
TELESCOPE VIEWING - 2025-10-29
==================================================
✅ CONDITIONS: GO OUTSIDE
Quality: GOOD | Clouds: 2/9 | Seeing: 6.3/8
==================================================

⭐ EXCELLENT TARGETS:
--------------------------------------------------
Moon - 9PM at 45° S
Saturn - 10PM at 52° SE

✨ GOOD TARGETS:
--------------------------------------------------
Jupiter - 11PM at 38° E
Mars - 12AM at 25° ESE

💫 FAIR TARGETS:
--------------------------------------------------
Uranus - 1AM at 18° E

==================================================
```

### Output Explanation

**Weather Summary:**
- **✅ GO OUTSIDE** or **⚠️ NOT RECOMMENDED** - Clear recommendation
- **Quality**: Overall viewing quality (excellent/good/fair/poor/unsuitable)
- **Clouds**: Cloud cover rating (1=clear, 9=overcast)
- **Seeing**: Atmospheric stability for sharpness (1=poor, 8=excellent)

**Target Categories:**
- **⭐ EXCELLENT**: High in sky with minimal atmospheric interference
- **✨ GOOD**: Good viewing angle, easily visible
- **💫 FAIR**: Viewable but lower in sky or relatively faint

**Target Information:**
- **Time**: When object reaches peak altitude (best viewing time)
- **Altitude**: Height above horizon in degrees (higher is better)
- **Direction**: Compass direction (N, NE, E, SE, S, SW, W, NW)

## Weather Condition Ratings

The script evaluates weather conditions and provides one of these ratings:

- **Excellent**: Clear skies (cloud cover <3), great seeing and transparency
- **Good**: Mostly clear (cloud cover <5), good atmospheric conditions
- **Fair**: Some clouds (cloud cover <7), average conditions
- **Poor**: Significant cloud cover (7-9), may still see bright objects
- **Unsuitable**: Heavy clouds or precipitation expected

## How Targets Are Prioritized

Targets are sorted by:

1. **Viewing Quality Rating** - Excellent targets appear first
2. **Viewability Score** - Within each category, easier/brighter targets appear first
   - Moon is always prioritized (if visible)
   - Saturn gets a bonus (rings make it interesting)
   - Jupiter gets a bonus (moons and size)
   - Mars gets a slight bonus (surface features)
   - Brighter objects (lower magnitude) rank higher
   - Higher altitude improves ranking

## APIs Used

- **Astronomy API** (https://astronomyapi.com) - Provides celestial body positions, magnitudes, and constellation data
- **7timer Astro** (https://www.7timer.info) - Free astronomical weather forecasting (no API key required)

## Tips

- **Start with excellent targets** when you first go outside
- **Check weather first** - even great celestial positioning won't help if it's cloudy
- **Magnitude scale**: Lower/negative numbers = brighter = easier to see
  - Moon: -9 to -12 (extremely bright)
  - Bright planets: -4 to 2 (easily visible)
  - Faint objects: 6+ (need dark skies and good telescope)
- **Higher altitude = better viewing** - less atmospheric distortion
- **Optimal viewing**: Objects above 30° altitude are ideal
- **The Moon** is always a great target for beginners
- **Plan your session**: Targets are shown at their peak viewing time

## Troubleshooting

**Weather data unavailable**
- The script will continue without weather data and still show celestial targets
- Weather service may be temporarily down

**No targets visible**
- Check your evening time range configuration (EVENING_START_HOUR, EVENING_END_HOUR)
- You may need to adjust the hours or try a different time of year
- Some celestial bodies have seasonal visibility

**All targets rated as poor or missing**
- Your telescope level might be too restrictive for current visible objects
- Objects may be low on the horizon during your viewing window
- Try adjusting TELESCOPE_LEVEL to see what's theoretically visible

**API authentication errors**
- Verify your ASTRONOMY_API_APP_ID and ASTRONOMY_API_APP_SECRET are correct
- Check that your API credentials are active at https://astronomyapi.com

## Configuration Tips

**Evening Window**
- Set EVENING_START_HOUR and EVENING_END_HOUR to match when you typically observe
- Handles overnight periods correctly (e.g., 21:00 to 02:00)
- Script checks hourly throughout this window

**Location Accuracy**
- More precise coordinates give more accurate results
- Elevation affects atmospheric calculations (find yours at https://www.whatismyelevation.com/)

**Telescope Level**
- Be realistic about your equipment's capabilities
- "Entry" level is a good starting point
- You can always adjust to see fainter targets that might be challenging

## License

MIT
