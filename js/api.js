import axios from 'axios';
import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";

const loader = document.querySelector('.loader');
const showLoader = () => loader?.classList.remove('is-hidden');
const hideLoader = () => loader?.classList.add('is-hidden');

export async function getCoordsByCityName(cityName) {
    try {
        showLoader();
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=uk&format=json`;
        const response = await axios.get(url);
        
        if (!response.data.results || response.data.results.length === 0) {
            throw new Error("Місто не знайдено. Спробуйте іншу назву.");
        }
        
        return response.data.results[0]; 
    } catch (error) {
        iziToast.error({ message: error.message, position: 'topRight' });
        return null;
    } finally {
        hideLoader();
    }
}

export async function getWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code&timezone=auto`;
        const response = await axios.get(url);
        
        // Перевіряємо, чи прийшли дані взагалі
        if (!response.data) throw new Error("No data from API");
        
        return response.data; // ПОВЕРТАЄМО ВЕСЬ ОБ'ЄКТ
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
}