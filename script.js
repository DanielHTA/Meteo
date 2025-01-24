let latitude = 45.0705; // default: Torino
let longitude = 7.6868; // default: Torino
let locationName = "Torino";
let weatherChartInstance = null; // Variabile per il grafico

// Funzione per aggiornare le coordinate in base al nome del luogo
async function updateCoordinatesFromLocation(location) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?city=${location}&format=json&addressdetails=1&limit=1`;
    try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        if (data && data.length > 0) {
            latitude = parseFloat(data[0].lat);
            longitude = parseFloat(data[0].lon);
            locationName = data[0].display_name; // Mostra il nome completo del luogo
            fetchWeather(); // Aggiorna i dati meteo dopo aver ottenuto le coordinate
        } else {
            alert("Luogo non trovato.");
        }
    } catch (error) {
        console.error("Errore nel recupero delle coordinate:", error);
        alert("Errore nel recupero delle coordinate.");
    }
}

// Mappatura dei codici meteo a descrizioni testuali
const weatherDescriptions = {
    0: 'Soleggiato',       // Clear sky
    1: 'Poco nuvoloso',    // Mainly clear
    2: 'Nuvoloso',         // Partly cloudy
    3: 'Nuvoloso',         // Overcast
    45: 'Nebbia',          // Fog
    48: 'Nebbia ghiacciata', // Freezing fog
    51: 'Piovoso leggero',  // Light rain
    53: 'Piovoso moderato', // Moderate rain
    55: 'Piovoso intenso',   // Heavy rain
    56: 'Piovoso gelato',   // Freezing rain
    57: 'Piovoso gelato',   // Freezing rain
    61: 'Pioggia intermittente', // Showers (rain)
    63: 'Pioggia moderata',    // Moderate showers (rain)
    65: 'Pioggia forte',    // Heavy showers (rain)
    66: 'Pioggia gelata',   // Freezing showers (rain)
    67: 'Pioggia gelata',   // Freezing showers (rain)
    71: 'Neve leggera',     // Light snow
    73: 'Neve moderata',    // Moderate snow
    75: 'Neve intensa',     // Heavy snow
    77: 'Neve a fiocchi',   // Snow grains
    80: 'Rovesci di pioggia leggeri', // Light rain showers
    81: 'Rovesci di pioggia moderati', // Moderate rain showers
    82: 'Rovesci di pioggia forti',   // Heavy rain showers
    85: 'Neve da rovesci leggeri',    // Light snow showers
    86: 'Neve da rovesci forti',      // Heavy snow showers
    95: 'Temporali',         // Thunderstorm
    96: 'Temporale con grandine leggera', // Thunderstorm with light hail
    99: 'Temporale con grandine forte'  // Thunderstorm with heavy hail
};

// Funzione per recuperare i dati meteo
async function fetchWeather() {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=Europe%2FRome`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const dailyData = groupDataByDay(
            data.hourly.time, 
            data.hourly.temperature_2m, 
            data.hourly.relative_humidity_2m, 
            data.hourly.precipitation,
            data.hourly.weather_code
        );
        document.getElementById('loading').style.display = 'none';
        document.getElementById('weather-data').style.display = 'block';
        document.getElementById('location-name').textContent = `Meteo per: ${locationName}`;
        
        let tableContent = '';
        dailyData.forEach(day => {
            const iconUrl = getWeatherDescription(day.weatherCode);  // Usa la funzione per l'icona
            tableContent += `<tr>
                <td>${day.date}</td>
                <td>${day.avgTemp.toFixed(2)}°C</td>
                <td>${day.avgHumidity.toFixed(2)}%</td>
                <td>${day.totalPrecip.toFixed(2)} mm</td>
                <td>${day.weatherDescription} <img src="${iconUrl}" alt="Weather icon" style="width: 50px; height: 50px; filter: brightness(0.798453);"></td>
            </tr>`;
        });
        document.getElementById('weather-table').innerHTML = tableContent;

        // Se il grafico esiste già, distruggilo prima di crearne uno nuovo
        if (weatherChartInstance) {
            weatherChartInstance.destroy();
        }

        const ctx = document.getElementById('weatherChart').getContext('2d');
        weatherChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyData.map(day => day.date),
                datasets: [
                    { label: 'Temperatura Media (°C)', data: dailyData.map(day => day.avgTemp), borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, borderWidth: 2 },
                    { label: 'Umidità Media (%)', data: dailyData.map(day => day.avgHumidity), borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, borderWidth: 2 },
                    { label: 'Precipitazioni Totali (mm)', data: dailyData.map(day => day.totalPrecip), borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, borderWidth: 2 }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    x: { title: { display: true, text: 'Giorno' } }, 
                    y: { title: { display: true, text: 'Valore' }, beginAtZero: false } 
                }
            }
        });
    } catch (error) {
        console.error('Errore nel recupero dei dati meteo:', error);
        document.getElementById('loading').innerHTML = 'Errore nel recupero dei dati meteo';
    }
}

// Funzione per raggruppare i dati per giorno
function groupDataByDay(times, temperatures, humidity, precipitation, weatherCodes) {
    const dailyData = [];
    let currentDay = '', tempSum = 0, humiditySum = 0, precipSum = 0, count = 0, firstWeatherCode = '';
    
    for (let i = 0; i < times.length; i++) {
        const day = times[i].split('T')[0];
        if (day !== currentDay && count > 0) {
            dailyData.push({ 
                date: currentDay, 
                avgTemp: tempSum / count, 
                avgHumidity: humiditySum / count, 
                totalPrecip: precipSum, 
                weatherDescription: weatherDescriptions[firstWeatherCode] || 'Sconosciuto',
                weatherCode: firstWeatherCode
            });
            tempSum = humiditySum = precipSum = count = 0;
        }
        currentDay = day;
        tempSum += temperatures[i];
        humiditySum += humidity[i];
        precipSum += precipitation[i];
        if (count === 0) firstWeatherCode = weatherCodes[i]; // Prende il primo codice meteo per il giorno
        count++;
    }
    if (count > 0) dailyData.push({ 
        date: currentDay, 
        avgTemp: tempSum / count, 
        avgHumidity: humiditySum / count, 
        totalPrecip: precipSum, 
        weatherDescription: weatherDescriptions[firstWeatherCode] || 'Sconosciuto',
        weatherCode: firstWeatherCode 
    });

    return dailyData;
}

// Funzione per ottenere la descrizione meteo in base al codice
function getWeatherDescription(code) {
    const weatherMap = {
        0: '01d', // Clear sky
        1: '02d', // Mainly clear
        2: '02d', // Partly cloudy
        3: '03d', // Overcast
        45: '50d', // Fog
        48: '50d', // Freezing fog
        51: '10d', // Light rain
        53: '10d', // Moderate rain
        55: '10d', // Heavy rain
        56: '10d', // Freezing rain
        57: '10d', // Freezing rain
        61: '09d', // Showers (rain)
        63: '09d', // Moderate showers (rain)
        65: '09d', // Heavy showers (rain)
        66: '09d', // Freezing showers (rain)
        67: '09d', // Freezing showers (rain)
        71: '13d', // Light snow
        73: '13d', // Moderate snow
        75: '13d', // Heavy snow
        77: '13d', // Snow grains
        80: '09d', // Light rain showers
        81: '09d', // Moderate rain showers
        82: '09d', // Heavy rain showers
        85: '13d', // Light snow showers
        86: '13d', // Heavy snow showers
        95: '11d', // Thunderstorm
        96: '11d', // Thunderstorm with light hail
        99: '11d'  // Thunderstorm with heavy hail
    };
    const icon = weatherMap[code];
    
    return icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : 'Errore'; // Default error handling
}

// Evento per l'aggiornamento delle coordinate quando si clicca "Aggiorna Meteo"
document.getElementById('updateCoordinates').addEventListener('click', function() {
    const location = document.getElementById('location').value;
    updateCoordinatesFromLocation(location);
});

// Carica i dati meteo al caricamento della pagina
window.onload = fetchWeather;
