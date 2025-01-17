<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meteo Torino</title>
    <!-- Link a Google Fonts per Merryweather -->
    <link href="https://fonts.googleapis.com/css2?family=Merryweather&display=swap" rel="stylesheet">
    <!-- Link a Bootstrap CSS -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <!-- Link a Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        /* Impostazione del font Merryweather per tutta la pagina */
        body {
            font-family: 'Merryweather', serif;
            background-color: #f8f9fa;
            padding-top: 20px;
        }
        .weather-container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .weather-info {
            margin-top: 20px;
        }
        #loading {
            font-size: 1.2em;
            color: #6c757d;
        }
        .chart-container {
            margin-top: 30px;
            height: 400px;
        }
        .table {
            font-size: 1.1em;
            border: 1px solid #ddd;
        }
        .table th, .table td {
            padding: 15px;
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-10 weather-container">
                <h2 class="text-center">Meteo di Torino</h2>
                <div id="loading" class="text-center">Caricamento meteo...</div>
                <div id="weather-data" class="weather-info" style="display:none;">
                    <!-- Tabella dei dati giornalieri -->
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Giorno</th>
                                <th>Temperatura Media (°C)</th>
                                <th>Umidità Media (%)</th>
                                <th>Precipitazioni Totali (mm)</th>
                            </tr>
                        </thead>
                        <tbody id="weather-table">
                            <!-- I dati della tabella verranno inseriti qui -->
                        </tbody>
                    </table>

                    <!-- Grafico delle condizioni meteo -->
                    <div class="chart-container">
                        <canvas id="weatherChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Link a Bootstrap JS e jQuery -->
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>

    <script>
        // Funzione per ottenere il meteo da Open-Meteo API
        async function fetchWeather() {
            const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=45.0705&longitude=7.6868&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=Europe%2FRome';
            
            try {
                // Chiamata all'API
                const response = await fetch(apiUrl);
                const data = await response.json();

                // Estrazione dei dati orari
                const hourlyData = data.hourly;
                const times = hourlyData.time;
                const temperatures = hourlyData.temperature_2m;
                const humidity = hourlyData.relative_humidity_2m;
                const precipitation = hourlyData.precipitation;

                // Raggruppare i dati per giorno
                const dailyData = groupDataByDay(times, temperatures, humidity, precipitation);

                // Aggiorna la UI con i dati
                document.getElementById('loading').style.display = 'none';
                document.getElementById('weather-data').style.display = 'block';

                // Popola la tabella con i dati giornalieri
                let tableContent = '';
                dailyData.forEach(day => {
                    tableContent += `
                        <tr>
                            <td>${day.date}</td>
                            <td>${day.avgTemp.toFixed(2)}°C</td>
                            <td>${day.avgHumidity.toFixed(2)}%</td>
                            <td>${day.totalPrecip.toFixed(2)} mm</td>
                        </tr>
                    `;
                });
                document.getElementById('weather-table').innerHTML = tableContent;

                // Crea il grafico con Chart.js
                const ctx = document.getElementById('weatherChart').getContext('2d');
                const weatherChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dailyData.map(day => day.date),
                        datasets: [
                            {
                                label: 'Temperatura Media (°C)',
                                data: dailyData.map(day => day.avgTemp),
                                borderColor: 'rgba(255, 99, 132, 1)',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                fill: true,
                                borderWidth: 2
                            },
                            {
                                label: 'Umidità Media (%)',
                                data: dailyData.map(day => day.avgHumidity),
                                borderColor: 'rgba(54, 162, 235, 1)',
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                fill: true,
                                borderWidth: 2
                            },
                            {
                                label: 'Precipitazioni Totali (mm)',
                                data: dailyData.map(day => day.totalPrecip),
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                fill: true,
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Giorno'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Valore'
                                },
                                beginAtZero: false
                            }
                        }
                    }
                });

            } catch (error) {
                console.error('Errore nel recupero dei dati meteo:', error);
                document.getElementById('loading').innerHTML = 'Errore nel recupero dei dati meteo';
            }
        }

        // Funzione per raggruppare i dati per giorno e calcolare media e totali
        function groupDataByDay(times, temperatures, humidity, precipitation) {
            const dailyData = [];
            let currentDay = '';
            let tempSum = 0, humiditySum = 0, precipSum = 0, count = 0;

            for (let i = 0; i < times.length; i++) {
                const day = times[i].split('T')[0]; // Ottieni solo la data (senza l'ora)
                
                if (day !== currentDay && count > 0) {
                    // Aggiungi i dati per il giorno precedente
                    dailyData.push({
                        date: currentDay,
                        avgTemp: tempSum / count,
                        avgHumidity: humiditySum / count,
                        totalPrecip: precipSum
                    });
                    // Reset per il nuovo giorno
                    tempSum = humiditySum = precipSum = count = 0;
                }

                currentDay = day;
                tempSum += temperatures[i];
                humiditySum += humidity[i];
                precipSum += precipitation[i];
                count++;
            }

            // Aggiungi gli ultimi dati (l'ultimo giorno)
            if (count > 0) {
                dailyData.push({
                    date: currentDay,
                    avgTemp: tempSum / count,
                    avgHumidity: humiditySum / count,
                    totalPrecip: precipSum
                });
            }

            return dailyData;
        }

        // Esegui la funzione quando la pagina è pronta
        window.onload = fetchWeather;
    </script>

</body>
</html>
        window.onload = fetchWeather;
    </script>

</body>
</html>
