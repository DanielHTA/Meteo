<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meteo Torino</title>
    <link href="https://fonts.googleapis.com/css2?family=Merryweather&display=swap" rel="stylesheet">
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Merryweather', serif; background-color: #f8f9fa; padding-top: 20px; }
        .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        .table { font-size: 1.1em; }
        .table th, .table td { padding: 15px; text-align: center; }
        #loading { font-size: 1.2em; color: #6c757d; }
        .chart-container { margin-top: 30px; height: 400px; }
    </style>
</head>
<body>

    <div class="container">
        <h2 class="text-center">Meteo di Torino</h2>
        <div id="loading" class="text-center">Caricamento meteo...</div>
        <div id="weather-data" style="display:none;">
            <table class="table table-striped">
                <thead><tr><th>Giorno</th><th>Temperatura Media (°C)</th><th>Umidità Media (%)</th><th>Precipitazioni Totali (mm)</th></tr></thead>
                <tbody id="weather-table"></tbody>
            </table>
            <div class="chart-container">
                <canvas id="weatherChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        async function fetchWeather() {
            const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=45.0705&longitude=7.6868&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=Europe%2FRome';
            const response = await fetch(apiUrl);
            const { hourly } = await response.json();
            const dailyData = groupDataByDay(hourly.time, hourly.temperature_2m, hourly.relative_humidity_2m, hourly.precipitation);
            displayData(dailyData);
        }

        function groupDataByDay(times, temperatures, humidity, precipitation) {
            let dailyData = [], currentDay = '', tempSum = 0, humiditySum = 0, precipSum = 0, count = 0;
            times.forEach((time, i) => {
                const day = time.split('T')[0];
                if (day !== currentDay && count > 0) {
                    dailyData.push({ date: currentDay, avgTemp: tempSum / count, avgHumidity: humiditySum / count, totalPrecip: precipSum });
                    tempSum = humiditySum = precipSum = count = 0;
                }
                currentDay = day;
                tempSum += temperatures[i];
                humiditySum += humidity[i];
                precipSum += precipitation[i];
                count++;
            });
            if (count > 0) dailyData.push({ date: currentDay, avgTemp: tempSum / count, avgHumidity: humiditySum / count, totalPrecip: precipSum });
            return dailyData;
        }

        function displayData(dailyData) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('weather-data').style.display = 'block';
            document.getElementById('weather-table').innerHTML = dailyData.map(day => `
                <tr><td>${day.date}</td><td>${day.avgTemp.toFixed(2)}°C</td><td>${day.avgHumidity.toFixed(2)}%</td><td>${day.totalPrecip.toFixed(2)} mm</td></tr>
            `).join('');
            const ctx = document.getElementById('weatherChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dailyData.map(day => day.date),
                    datasets: [
                        { label: 'Temperatura Media (°C)', data: dailyData.map(day => day.avgTemp), borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true },
                        { label: 'Umidità Media (%)', data: dailyData.map(day => day.avgHumidity), borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true },
                        { label: 'Precipitazioni Totali (mm)', data: dailyData.map(day => day.totalPrecip), borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true }
                    ]
                },
                options: { responsive: true, scales: { x: { title: { display: true, text: 'Giorno' } }, y: { title: { display: true, text: 'Valore' } } } }
            });
        }

        window.onload = fetchWeather;
    </script>

</body>
</html>
