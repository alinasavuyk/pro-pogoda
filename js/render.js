import SkyconsInit from 'skycons';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const Skycons = SkyconsInit(window);
const skycons = new Skycons({ color: "white", resizeClear: true });

let currentFullData = null;
let tempChartInstance = null;

function getSkyconType(code) {
    if (code === 0) return "CLEAR_DAY";
    if (code >= 1 && code <= 3) return "PARTLY_CLOUDY_DAY";
    if (code >= 45 && code <= 48) return "FOG";
    if (code >= 51 && code <= 67) return "RAIN";
    if (code >= 71 && code <= 77) return "SNOW";
    if (code >= 80 && code <= 82) return "RAIN";
    if (code >= 95) return "WIND";
    return "CLOUDY";
}

function renderChart(hourlyData, dayIndex) {
    const canvas = document.getElementById('tempChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (tempChartInstance) tempChartInstance.destroy();

    const start = dayIndex * 24;
    const end = start + 24;
    const dayTemps = hourlyData.temperature_2m.slice(start, end);
    const dayLabels = hourlyData.time.slice(start, end).map(t => new Date(t).getHours() + ":00");

    tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Температура (°C)',
                data: dayTemps,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
           scales: {
    y: { ticks: { color: '#333' } }, // Темний колір для світлої модалки
    x: { ticks: { color: '#333' } }
},
            plugins: { legend: { display: false } }
        }
    });
}

export function renderCurrentWeather(allData, cityName) {
    if (!allData || !allData.current_weather) return;

    const data = allData.current_weather;
    const hourly = allData.hourly;
    const tableBody = document.querySelector('#main-table-body');
    
    document.querySelector('#current-weather').classList.remove('is-hidden');
    
    document.querySelector('#display-city-name').textContent = cityName;
    document.querySelector('#current-temp').textContent = Math.round(data.temperature);
    document.querySelector('#feels-like').textContent = `${Math.round(data.temperature)}°C`;
    document.querySelector('#humidity').textContent = `${hourly.relative_humidity_2m[0]}%`;
    document.querySelector('#wind').textContent = `${data.windspeed} km/h`;

    const hours = [8, 14, 20];
    
    const getRow = (label, dataPath, unit = "", isProb = false) => {
        const values = hours.map(h => {
            const val = Math.round(hourly[dataPath][h]);
            const style = (isProb && val > 0) ? 'style="color: #3498db; font-weight: bold;"' : '';
            return `<td ${style}>${val}${unit}</td>`;
        }).join('');
        return `<tr><td class="row-label">${label}</td>${values}</tr>`;
    };

    tableBody.innerHTML = `
        <tr class="icon-row">
            <td></td>
            ${hours.map(h => `<td><canvas id="main-icon-${h}" width="35" height="35"></canvas></td>`).join('')}
        </tr>
        ${getRow("Температура", "temperature_2m", "°")}
        ${getRow("Ймовірність опадів", "precipitation_probability", "%", true)}
        ${getRow("Вологість", "relative_humidity_2m", "%")}
    `;

    // Іконки для таблиці на головній (сьогодні)
    hours.forEach(h => {
        const canvasId = `main-icon-${h}`;
        const code = hourly.weather_code ? hourly.weather_code[h] : allData.daily.weathercode[0];
        skycons.add(canvasId, Skycons[getSkyconType(code)]);
    });

    // Велика головна іконка
    const mainIconBox = document.querySelector('#current-icon');
    mainIconBox.innerHTML = `<canvas id="main-canvas" width="100" height="100"></canvas>`;
    skycons.add("main-canvas", Skycons[getSkyconType(data.weathercode)]);
    
    skycons.play();
}

export function renderForecast(allData) {
    currentFullData = allData;
    const dailyData = allData.daily;
    const forecastList = document.querySelector('#forecast-list');
    
    forecastList.innerHTML = '';
    document.querySelector('#forecast').classList.remove('is-hidden');

    for (let i = 0; i < 5; i++) {
        const canvasId = `forecast-icon-${i}`;
        const markup = `
            <li class="day-forecast-card" data-index="${i}">
                <p class="day-name">${new Date(dailyData.time[i]).toLocaleDateString('uk-UA', { weekday: 'short' }).toUpperCase()}</p>
                <div class="day-icon">
                    <canvas id="${canvasId}" width="40" height="40"></canvas>
                </div>
                <p class="temp-range">
                    <span class="max-temp">${Math.round(dailyData.temperature_2m_max[i])}°</span> | 
                    <span class="min-temp">${Math.round(dailyData.temperature_2m_min[i])}°</span>
                </p>
            </li>
        `;
        forecastList.insertAdjacentHTML('beforeend', markup);
        skycons.add(canvasId, Skycons[getSkyconType(dailyData.weathercode[i])]);
    }
    skycons.play();
}

function updateMainCardWithSelectedDay(allData, index, cityName = null) {
    const tableBody = document.querySelector('#main-table-body');
    const cityTitle = document.querySelector('#display-city-name');
    const currentTemp = document.querySelector('#current-temp');
    
    // 1. Визначаємо назву міста (якщо cityName пустий, пробуємо витягти чисту назву з заголовка)
    const currentCity = cityName || cityTitle.textContent.split(' (')[0];
    
    const baseIndex = index * 24;
    const hours = [8, 14, 20];
    const daily = allData.daily;

    // 2. Оновлюємо заголовок (Місто + дата) та велику температуру
    const selectedDate = new Date(daily.time[index]).toLocaleDateString('uk-UA', {day: 'numeric', month: 'short'});
    cityTitle.textContent = `${currentCity} (${selectedDate})`;
    currentTemp.textContent = Math.round(daily.temperature_2m_max[index]);

    // 3. Оновлюємо головну велику іконку
    const mainIconBox = document.querySelector('#current-icon');
    mainIconBox.innerHTML = `<canvas id="main-canvas" width="100" height="100"></canvas>`;
    skycons.add("main-canvas", Skycons[getSkyconType(daily.weathercode[index])]);

    // 4. Функція для створення рядків таблиці
    const getRow = (label, dataPath, unit = "", isProb = false) => {
        const values = hours.map(h => {
            const val = Math.round(allData.hourly[dataPath][baseIndex + h]);
            const style = (isProb && val > 0) ? 'style="color: #3498db; font-weight: bold;"' : '';
            return `<td ${style}>${val}${unit}</td>`;
        }).join('');
        return `<tr><td class="row-label">${label}</td>${values}</tr>`;
    };

    // 5. Перемальовуємо вміст таблиці
    tableBody.innerHTML = `
        <tr class="icon-row">
            <td></td>
            ${hours.map(h => `<td><canvas id="main-icon-${h}" width="35" height="35"></canvas></td>`).join('')}
        </tr>
        ${getRow("Температура", "temperature_2m", "°")}
        ${getRow("Ймовірність опадів", "precipitation_probability", "%", true)}
        ${getRow("Вологість", "relative_humidity_2m", "%")}
    `;

    // 6. Оновлюємо іконки в таблиці
    hours.forEach(h => {
        const code = allData.hourly.weather_code ? allData.hourly.weather_code[baseIndex + h] : daily.weathercode[index];
        skycons.add(`main-icon-${h}`, Skycons[getSkyconType(code)]);
    });

    // 7. Оновлюємо нижні текстові деталі
    document.querySelector('#feels-like').textContent = `${Math.round(daily.temperature_2m_max[index])}°C`;
    document.querySelector('#humidity').textContent = `${allData.hourly.relative_humidity_2m[baseIndex + 12]}%`;
    document.querySelector('#wind').textContent = `${allData.hourly.wind_speed_10m[baseIndex + 12]} km/h`;

    // 8. ЗАПУСКАЄМО ГРАФІК (як ти і хотіла)
    renderMainChart(allData.hourly, index);
    
    skycons.play();
}

// Функція для графіка (без змін, колір адаптований під світлий фон)
function renderMainChart(hourlyData, dayIndex) {
    const canvas = document.getElementById('mainTempChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (tempChartInstance) tempChartInstance.destroy();

    const start = dayIndex * 24;
    const end = start + 24;
    const dayTemps = hourlyData.temperature_2m.slice(start, end);
    const dayLabels = hourlyData.time.slice(start, end).map(t => new Date(t).getHours() + ":00");

    tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Температура (°C)',
                data: dayTemps,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    ticks: { color: '#555' },
                    grid: { display: false }
                },
                x: { 
                    ticks: { color: '#555' },
                    grid: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}
document.addEventListener('click', (e) => {
    const card = e.target.closest('.day-forecast-card');
    if (card && currentFullData) {
        // Викликаємо оновлення головної картки замість модалки
        updateMainCardWithSelectedDay(currentFullData, parseInt(card.dataset.index));
        
        // Додамо візуальний ефект активної картки (опціонально)
        document.querySelectorAll('.day-forecast-card').forEach(c => c.classList.remove('active-day'));
        card.classList.add('active-day');
    }
});