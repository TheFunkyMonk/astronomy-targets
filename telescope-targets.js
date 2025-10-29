const https = require('https');
const url = require('url');
require('dotenv').config();

// Configuration from environment variables
const config = {
	appId: process.env.ASTRONOMY_API_APP_ID,
	appSecret: process.env.ASTRONOMY_API_APP_SECRET,
	latitude: parseFloat(process.env.LATITUDE),
	longitude: parseFloat(process.env.LONGITUDE),
	elevation: parseFloat(process.env.ELEVATION),
	telescopeLevel: process.env.TELESCOPE_LEVEL || 'entry', // entry, intermediate, advanced
	eveningStartHour: parseInt(process.env.EVENING_START_HOUR || '21'), // 9pm default
	eveningEndHour: parseInt(process.env.EVENING_END_HOUR || '2') // 2am default
};

// Telescope capabilities based on level
const telescopeCapabilities = {
	entry: {
		maxMagnitude: 10,
		minAltitude: 15, // Avoid low horizon viewing
		description: 'Entry-level telescope (60-80mm aperture)'
	},
	intermediate: {
		maxMagnitude: 12,
		minAltitude: 10,
		description: 'Intermediate telescope (100-150mm aperture)'
	},
	advanced: {
		maxMagnitude: 14,
		minAltitude: 5,
		description: 'Advanced telescope (200mm+ aperture)'
	}
};

// Weather condition interpretation from 7timer
function interpretWeatherConditions(data) {
	const eveningData = data.dataseries.filter(point => {
		const hour = (point.timepoint % 24);
		// Filter for evening hours in our observation window
		if (config.eveningEndHour > config.eveningStartHour) {
			return hour >= config.eveningStartHour && hour <= config.eveningEndHour;
		} else {
			// Handle overnight periods (e.g., 21:00 to 02:00)
			return hour >= config.eveningStartHour || hour <= config.eveningEndHour;
		}
	});

	if (eveningData.length === 0) {
		return null;
	}

	// Calculate average conditions for the evening
	const avgCloudCover = eveningData.reduce((sum, d) => sum + d.cloudcover, 0) / eveningData.length;
	const avgSeeing = eveningData.reduce((sum, d) => sum + d.seeing, 0) / eveningData.length;
	const avgTransparency = eveningData.reduce((sum, d) => sum + d.transparency, 0) / eveningData.length;
	const hasRain = eveningData.some(d => d.prec_type === 'rain' || d.prec_type === 'snow');

	// Determine overall viewing quality
	let quality = 'excellent';
	let score = 0;
	let reasons = [];

	// Cloud cover assessment (1-9 scale, 1=clear)
	if (avgCloudCover >= 7) {
		score += 3;
		reasons.push('heavy cloud cover');
		quality = 'poor';
	} else if (avgCloudCover >= 5) {
		score += 2;
		reasons.push('moderate cloud cover');
		quality = quality === 'excellent' ? 'fair' : quality;
	} else if (avgCloudCover >= 3) {
		score += 1;
		reasons.push('some clouds');
		quality = quality === 'excellent' ? 'good' : quality;
	} else {
		reasons.push('clear skies');
	}

	// Seeing assessment (1-8 scale, higher is better)
	if (avgSeeing <= 3) {
		score += 2;
		reasons.push('poor atmospheric stability');
		quality = quality === 'excellent' ? 'fair' : (quality === 'good' ? 'fair' : quality);
	} else if (avgSeeing <= 5) {
		reasons.push('average atmospheric stability');
	} else {
		reasons.push('excellent atmospheric stability');
	}

	// Transparency assessment (1-8 scale, higher is better)
	if (avgTransparency <= 3) {
		score += 1;
		reasons.push('reduced transparency');
	} else if (avgTransparency >= 6) {
		reasons.push('excellent transparency');
	}

	// Precipitation
	if (hasRain) {
		score += 4;
		reasons.push('precipitation expected');
		quality = 'unsuitable';
	}

	// Determine if it's worth going out
	const worthObserving = quality !== 'unsuitable' && quality !== 'poor' && avgCloudCover < 6;

	return {
		quality,
		score,
		worthObserving,
		avgCloudCover: Math.round(avgCloudCover),
		avgSeeing: avgSeeing.toFixed(1),
		avgTransparency: avgTransparency.toFixed(1),
		hasRain,
		reasons,
		eveningData
	};
}

// Get weather conditions from 7timer
async function getWeatherConditions() {
	const apiUrl = `https://www.7timer.info/bin/astro.php?` +
		`lon=${config.longitude}&lat=${config.latitude}&ac=0&lang=en&unit=imperial&output=json&tzshift=0`;

	try {
		const parsedUrl = url.parse(apiUrl);

		return new Promise((resolve, reject) => {
			https.get({
				hostname: parsedUrl.hostname,
				path: parsedUrl.path,
				method: 'GET'
			}, (res) => {
				let data = '';

				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					if (res.statusCode === 200) {
						resolve(JSON.parse(data));
					} else {
						reject(new Error(`Weather API request failed with status ${res.statusCode}`));
					}
				});
			}).on('error', (err) => {
				reject(err);
			});
		});
	} catch (error) {
		throw new Error(`Failed to fetch weather data: ${error.message}`);
	}
}

// Rating criteria for viewing quality
function getViewingRating(body, telescope) {
	const altitude = parseFloat(body.position.horizontal.altitude.degrees);
	const magnitude = body.extraInfo.magnitude;

	if (altitude < 0) return { rating: 'not-visible', reason: 'Below horizon' };
	if (altitude < telescope.minAltitude) return { rating: 'poor', reason: 'Too low on horizon' };
	if (magnitude !== null && magnitude > telescope.maxMagnitude) {
		return { rating: 'too-faint', reason: 'Too faint for your telescope' };
	}

	// Rate based on altitude and brightness
	let rating = 'fair';
	let reason = '';

	if (altitude > 45) {
		rating = 'excellent';
		reason = 'High in sky, minimal atmospheric interference';
	} else if (altitude > 30) {
		rating = 'good';
		reason = 'Good viewing angle';
	} else {
		reason = 'Viewable but lower in sky';
	}

	// Adjust for brightness
	if (magnitude !== null) {
		if (magnitude < 0) {
			reason += ', very bright';
		} else if (magnitude > 5) {
			rating = rating === 'excellent' ? 'good' : 'fair';
			reason += ', relatively faint';
		}
	}

	return { rating, reason };
}

// Make HTTPS request with Basic Auth
function makeRequest(urlString) {
	return new Promise((resolve, reject) => {
		const parsedUrl = url.parse(urlString);
		const auth = Buffer.from(`${config.appId}:${config.appSecret}`).toString('base64');

		const options = {
			hostname: parsedUrl.hostname,
			path: parsedUrl.path,
			method: 'GET',
			headers: {
				'Authorization': `Basic ${auth}`
			}
		};

		https.get(options, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				if (res.statusCode === 200) {
					resolve(JSON.parse(data));
				} else {
					reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
				}
			});
		}).on('error', (err) => {
			reject(err);
		});
	});
}

// Format time for API (HH:MM:SS)
function formatTime(hour) {
	return `${hour.toString().padStart(2, '0')}:00:00`;
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
	const now = new Date();
	return now.toISOString().split('T')[0];
}

// Analyze targets for a specific time
async function analyzeTargets(date, time) {
	const apiUrl = `https://api.astronomyapi.com/api/v2/bodies/positions?` +
		`latitude=${config.latitude}&longitude=${config.longitude}&elevation=${config.elevation}` +
		`&from_date=${date}&to_date=${date}&time=${time}`;

	try {
		const response = await makeRequest(apiUrl);
		const telescope = telescopeCapabilities[config.telescopeLevel];
		const results = [];

		// Process each celestial body
		for (const row of response.data.table.rows) {
			const body = row.cells[0];

			// Skip Sun (dangerous) and Earth (not useful)
			if (body.id === 'sun' || body.id === 'earth') continue;

			const viewingInfo = getViewingRating(body, telescope);

			results.push({
				name: body.name,
				rating: viewingInfo.rating,
				reason: viewingInfo.reason,
				altitude: parseFloat(body.position.horizontal.altitude.degrees),
				azimuth: parseFloat(body.position.horizontal.azimuth.degrees),
				magnitude: body.extraInfo.magnitude,
				constellation: body.position.constellation.name,
				distance: body.distance.fromEarth,
				extraInfo: body.extraInfo
			});
		}

		return results;
	} catch (error) {
		throw new Error(`Failed to fetch data for ${time}: ${error.message}`);
	}
}

// Calculate viewability score for sorting
// Lower scores = better/easier viewing
function calculateViewabilityScore(target) {
	// Start with magnitude (brightness) - this is the most important factor
	// Lower magnitude = brighter = easier to see
	let score = target.magnitude !== null ? target.magnitude : 15; // Default high score for null magnitude

	// Adjust for altitude - higher altitude reduces score (improves ranking)
	// Subtract up to 5 points for excellent altitude
	if (target.peakAltitude) {
		const altitudeBonus = Math.min(5, target.peakAltitude / 10);
		score -= altitudeBonus;
	}

	// Special adjustments for particularly interesting or easy targets
	const name = target.name.toLowerCase();
	if (name === 'moon') {
		score -= 15; // Moon is always a great target
	} else if (name === 'saturn') {
		score -= 3; // Saturn's rings make it extra interesting
	} else if (name === 'jupiter') {
		score -= 2; // Jupiter's size and moons make it interesting
	} else if (name === 'mars') {
		score -= 1; // Mars shows some surface features
	}

	return score;
}

// Main function
async function main() {
	// Validate configuration
	if (!config.appId || !config.appSecret) {
		console.error('Error: ASTRONOMY_API_APP_ID and ASTRONOMY_API_APP_SECRET must be set in .env file');
		process.exit(1);
	}

	if (isNaN(config.latitude) || isNaN(config.longitude) || isNaN(config.elevation)) {
		console.error('Error: LATITUDE, LONGITUDE, and ELEVATION must be set in .env file');
		process.exit(1);
	}

	const telescope = telescopeCapabilities[config.telescopeLevel];
	const date = getCurrentDate();

	console.log('TELESCOPE VIEWING - ' + date);
	console.log('='.repeat(50));

	// Get weather conditions first
	let weatherConditions = null;

	try {
		const weatherData = await getWeatherConditions();
		weatherConditions = interpretWeatherConditions(weatherData);

		// Display concise weather summary
		const statusIcon = weatherConditions.worthObserving ? '✅' : '⚠️';
		const recommendation = weatherConditions.worthObserving ? 'GO OUTSIDE' : 'NOT RECOMMENDED';

		console.log(`${statusIcon} CONDITIONS: ${recommendation}`);
		console.log(`Quality: ${weatherConditions.quality.toUpperCase()} | Clouds: ${weatherConditions.avgCloudCover}/9 | Seeing: ${weatherConditions.avgSeeing}/8`);
		console.log('='.repeat(50));
		console.log();
	} catch (error) {
		console.log('⚠️  Weather data unavailable');
		console.log('='.repeat(50));
		console.log();
	}

	// Generate hours to check
	const hours = [];
	let currentHour = config.eveningStartHour;
	while (true) {
		hours.push(currentHour);
		currentHour = (currentHour + 1) % 24;
		if (currentHour === (config.eveningEndHour + 1) % 24) break;
		if (hours.length > 12) break; // Safety limit
	}

	// Collect data for all hours
	const targetsByName = new Map();

	for (const hour of hours) {
		const time = formatTime(hour);

		try {
			const targets = await analyzeTargets(date, time);

			// Track each target across hours
			for (const target of targets) {
				if (!targetsByName.has(target.name)) {
					targetsByName.set(target.name, {
						name: target.name,
						magnitude: target.magnitude,
						constellation: target.constellation,
						distance: target.distance,
						hourlyData: []
					});
				}

				targetsByName.get(target.name).hourlyData.push({
					hour: hour,
					altitude: target.altitude,
					azimuth: target.azimuth,
					rating: target.rating,
					reason: target.reason
				});
			}
		} catch (error) {
			console.error(`Error fetching data for ${time}: ${error.message}`);
		}
	}

	// Analyze and display results
	const nightSummary = [];

	for (const [name, data] of targetsByName) {
		// Find the best viewing time (highest altitude when visible)
		const visibleHours = data.hourlyData.filter(h => h.altitude > 0);

		if (visibleHours.length === 0) {
			continue; // Skip targets not visible
		}

		// Find peak altitude
		const peakHour = visibleHours.reduce((best, current) =>
			current.altitude > best.altitude ? current : best
		);

		// Determine overall best rating throughout the night
		const ratingPriority = { 'excellent': 0, 'good': 1, 'fair': 2, 'poor': 3, 'too-faint': 4, 'not-visible': 5 };
		const bestRatingHour = visibleHours.reduce((best, current) =>
			ratingPriority[current.rating] < ratingPriority[best.rating] ? current : best
		);

		// Only include targets that are at least "fair" quality
		if (ratingPriority[bestRatingHour.rating] <= 2) {
			nightSummary.push({
				name: data.name,
				bestRating: bestRatingHour.rating,
				reason: bestRatingHour.reason,
				magnitude: data.magnitude,
				constellation: data.constellation,
				peakAltitude: peakHour.altitude,
				peakHour: peakHour.hour,
				peakAzimuth: peakHour.azimuth,
				visibleHours: visibleHours.length,
				totalHours: data.hourlyData.length
			});
		}
	}

	// Sort by rating priority first, then by viewability score
	const ratingPriority = { 'excellent': 0, 'good': 1, 'fair': 2, 'poor': 3, 'too-faint': 4, 'not-visible': 5 };
	nightSummary.sort((a, b) => {
		const priorityDiff = ratingPriority[a.bestRating] - ratingPriority[b.bestRating];
		if (priorityDiff !== 0) return priorityDiff;
		// Within same rating, sort by viewability score (lower = better)
		return calculateViewabilityScore(a) - calculateViewabilityScore(b);
	});

	// Display results by category
	const excellent = nightSummary.filter(t => t.bestRating === 'excellent');
	const good = nightSummary.filter(t => t.bestRating === 'good');
	const fair = nightSummary.filter(t => t.bestRating === 'fair');

	if (excellent.length > 0) {
		console.log('⭐ EXCELLENT TARGETS:');
		console.log('-'.repeat(50));
		excellent.forEach(t => {
			const peakTime = formatHourDisplay(t.peakHour);
			console.log(`${t.name} - ${peakTime} at ${t.peakAltitude.toFixed(0)}° ${getDirection(t.peakAzimuth)}`);
		});
		console.log();
	}

	if (good.length > 0) {
		console.log('✨ GOOD TARGETS:');
		console.log('-'.repeat(50));
		good.forEach(t => {
			const peakTime = formatHourDisplay(t.peakHour);
			console.log(`${t.name} - ${peakTime} at ${t.peakAltitude.toFixed(0)}° ${getDirection(t.peakAzimuth)}`);
		});
		console.log();
	}

	if (fair.length > 0) {
		console.log('💫 FAIR TARGETS:');
		console.log('-'.repeat(50));
		fair.forEach(t => {
			const peakTime = formatHourDisplay(t.peakHour);
			console.log(`${t.name} - ${peakTime} at ${t.peakAltitude.toFixed(0)}° ${getDirection(t.peakAzimuth)}`);
		});
		console.log();
	}

	console.log('='.repeat(50));
}

// Format hour for display
function formatHourDisplay(hour) {
	const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
	const period = hour >= 12 ? 'PM' : 'AM';
	return `${displayHour}${period}`;
}

// Convert azimuth to compass direction
function getDirection(azimuth) {
	const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
	const index = Math.round(azimuth / 22.5) % 16;
	return directions[index];
}

// Run the script
main().catch(error => {
	console.error('Fatal error:', error.message);
	process.exit(1);
});
