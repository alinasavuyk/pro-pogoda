import { getCoordsByCityName, getWeather } from './js/api.js';
import { renderCurrentWeather, renderForecast } from './js/render.js';
import { saveLastCity, getLastCity } from './js/storage.js';
import iziToast from "izitoast";

const searchForm = document.querySelector('#city-search-form');

/**
 * Отримує назву міста за координатами (Зворотне геокодування)
 */
async function getCityNameByCoords(lat, lon) {
    try {
        // Використовуємо безкоштовний API Nominatim (OpenStreetMap)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=uk`
        );
        const data = await response.json();
        // Беремо назву міста, селища або села
        return data.address.city || data.address.town || data.address.village || "Ваше місце";
    } catch (error) {
        console.error("Помилка отримання назви міста:", error);
        return "Ваше місце";
    }
}

async function performWeatherSearch(cityName) {
    const locationData = await getCoordsByCityName(cityName);
    if (!locationData) return;

    const allWeatherData = await getWeather(locationData.latitude, locationData.longitude);
    if (!allWeatherData) return;

    renderCurrentWeather(allWeatherData, locationData.name); 
    renderForecast(allWeatherData); 
    saveLastCity(locationData.name);
}

searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const cityName = searchForm.elements.city.value.trim();
    if (!cityName) return;

    await performWeatherSearch(cityName);
    searchForm.reset();
});

// Кнопка геолокації
const geoBtn = document.createElement('button');
geoBtn.type = 'button'; 
geoBtn.innerHTML = '📍';
geoBtn.className = 'geo-btn';
geoBtn.title = 'Визначити моє місцезнаходження';

const formContainer = document.querySelector('.search-form');
if (formContainer) {
    formContainer.appendChild(geoBtn);
}

geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return iziToast.error({ message: "Геолокація не підтримується вашим браузером" });
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // 1. Отримуємо назву міста за координатами
            const cityName = await getCityNameByCoords(latitude, longitude);
            
            // 2. Отримуємо погоду
            const allWeatherData = await getWeather(latitude, longitude);
            
            if (allWeatherData) {
                // 3. Рендеримо з реальною назвою міста
                renderCurrentWeather(allWeatherData, cityName);
                renderForecast(allWeatherData);
                saveLastCity(cityName);
            }
        },
        (error) => {
            iziToast.warning({ message: "Доступ до геолокації відхилено" });
        }
    );
});

// АВТОМАТИЧНИЙ ЗАПУСК
const savedCity = getLastCity();
if (savedCity) {
    performWeatherSearch(savedCity);
} else {
    // Якщо місто не збережено, пробуємо знайти за геолокацією при старті
    geoBtn.click(); 
}