// Зберігаємо назву міста
export const saveLastCity = (cityName) => {
    localStorage.setItem('last-weather-city', cityName);
};

// Отримуємо назву міста
export const getLastCity = () => {
    return localStorage.getItem('last-weather-city');
};