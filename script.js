const API_KEY = "PASTE_YOUR_API_KEY_HERE";

const $ = id => document.getElementById(id);

const forecastCards = $("forecastCards");

// Weather condition 
function getWeatherIcon(condition) {
  const icons = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️",
    Smoke: "🌫️"
  };

  return icons[condition] || "🌤️";
}

// Toast Notification
function showToast(message) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Loading Message
function showLoading() {
  showToast("Loading live weather data...");
}

// Current Weather API
async function getWeather(city) {
  if (!city) {
    showToast("Please enter a city name.");
    return;
  }

  if (API_KEY === "PASTE_YOUR_API_KEY_HERE") {
    showToast("Please add your OpenWeatherMap API Key first.");
    return;
  }

  showLoading();

  try {
    const cityName = city.trim();

    const currentURL =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;

    const forecastURL =
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentURL),
      fetch(forecastURL)
    ]);

    if (!currentResponse.ok) {
      if (currentResponse.status === 404) {
        throw new Error("City not found. Please enter a valid city name.");
      }

      if (currentResponse.status === 401) {
        throw new Error("Invalid API Key or API Key is not activated yet.");
      }

      throw new Error("Unable to get weather data.");
    }

    if (!forecastResponse.ok) {
      throw new Error("Unable to get forecast data.");
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    displayCurrentWeather(currentData);
    displayForecast(forecastData);

    showToast(`Live weather updated: ${currentData.name}`);

  } catch (error) {
    console.error("Weather API Error:", error);
    showToast(error.message || "Something went wrong.");
  }
}

// Display Current Weather
function displayCurrentWeather(data) {
  const weatherInfo = data.weather[0];

  $("locationName").textContent =
    `${data.name}, ${data.sys.country}`;

  $("currentTemp").textContent =
    Math.round(data.main.temp);

  $("condition").textContent =
    weatherInfo.description.replace(/\b\w/g, char => char.toUpperCase());

  $("feelsLike").textContent =
    `${Math.round(data.main.feels_like)}°C`;

  $("weatherArt").textContent =
    getWeatherIcon(weatherInfo.main);

  $("feelMetric").innerHTML =
    `${Math.round(data.main.feels_like)}<span>°C</span>`;

  $("windMetric").innerHTML =
    `${(data.wind.speed * 3.6).toFixed(1)}<span> km/h</span>`;

  const rainAmount =
    data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0;

  $("rainMetric").innerHTML =
    `${rainAmount}<span> mm</span>`;

  $("humidityMetric").innerHTML =
    `${data.main.humidity}<span>%</span>`;

  // UV data is not provided by this Current Weather endpoint
  $("uvMetric").innerHTML =
    `N/A`;

  $("cloudMetric").innerHTML =
    `${data.clouds.all}<span>%</span>`;

  const humidityBar = document.querySelector(".meter span");
  const cloudBar = document.querySelector(".purple-meter span");
  const windBar = document.querySelector(".wind-track span");

  if (humidityBar) {
    humidityBar.style.width = `${data.main.humidity}%`;
  }

  if (cloudBar) {
    cloudBar.style.width = `${data.clouds.all}%`;
  }

  if (windBar) {
    windBar.style.width =
      `${Math.min(data.wind.speed * 3.6, 100)}%`;
  }
}

// Display 5-Day Forecast
function displayForecast(data) {
  const dailyForecast = {};

  data.list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];

    if (!dailyForecast[date]) {
      dailyForecast[date] = [];
    }

    dailyForecast[date].push(item);
  });

  const dates = Object.keys(dailyForecast).slice(0, 5);

  const forecast = dates.map(date => {
    const dayItems = dailyForecast[date];

    // Select forecast closest to 12:00
    const selected = dayItems.reduce((previous, current) => {
      const previousHour =
        Number(previous.dt_txt.split(" ")[1].slice(0, 2));

      const currentHour =
        Number(current.dt_txt.split(" ")[1].slice(0, 2));

      return Math.abs(currentHour - 12) <
        Math.abs(previousHour - 12)
        ? current
        : previous;
    });

    const day = new Date(`${date}T12:00:00`).toLocaleDateString(
      "en-US",
      { weekday: "short" }
    );

    const icon = getWeatherIcon(selected.weather[0].main);
    const temp = Math.round(selected.main.temp);

    return { day, icon, temp };
  });

  forecastCards.innerHTML = forecast.map(item => `
    <article class="forecast-card">
      <div class="day">${item.day}</div>
      <div class="icon">${item.icon}</div>
      <strong>${item.temp}°</strong>
      <small>°C</small>
    </article>
  `).join("");
}

// Search City
$("searchForm").addEventListener("submit", event => {
  event.preventDefault();

  const city = $("cityInput").value.trim();

if (city) {
  getWeather(city);
};
    getWeather(aliases[city.toLowerCase()] || city);
});
// More Live Weather Cities
const cities = [
  "Dhaka",
  "Rangpur",
  "Saidpur",
  "Rajshahi",
  "Sylhet",
  "London",
  "New York",
  "Dubai",
  "Tokyo",
  "Singapore",
  "Paris",
  "Toronto",
  "Kuala Lumpur",
  "Sydney",
  "Pakistan",
  "India",
  "Nepal"

];

// Load weather for each city
async function loadCityWeather() {
  const cityContainer = document.getElementById("cityList");

  if (!cityContainer) return;

  cityContainer.innerHTML = "";

  for (const city of cities) {
    const card = document.createElement("div");
    card.className = "city-card";
    card.innerHTML = `
      <div class="city-name">${city}</div>
      <div class="city-temp">Loading...</div>
      <div class="city-condition">Getting weather...</div>
    `;

    card.style.cursor = "pointer";

    card.addEventListener("click", () => {
      getWeather(city);
    });

    cityContainer.appendChild(card);

    try {
      const url =
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Weather unavailable");
      }

      const data = await response.json();

      card.innerHTML = `
        <div class="city-name">${data.name}</div>
        <div class="city-temp">
          ${Math.round(data.main.temp)}°C
        </div>
        <div class="city-condition">
          ${getWeatherIcon(data.weather[0].main)}
          ${data.weather[0].description}
        </div>
      `;

    } catch (error) {
      card.querySelector(".city-temp").textContent = "Unavailable";
      card.querySelector(".city-condition").textContent =
        "Weather not available";
    }
  }
}

// Load all city weather
loadCityWeather();


// View All
$("viewAll").addEventListener("click", () => {
  showToast("Search any city to see its live weather.");
});

// Dark Mode
$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Live Clock
function updateClock() {
  const now = new Date();

  $("clock").textContent =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);
}

// Bangladesh Date
function updateDate() {
  const now = new Date();

  $("localDate").textContent =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(now);

  $("todayDate").textContent =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short"
    }).format(now).toUpperCase();
}

// Start Application
updateDate();
updateClock();
setInterval(updateClock, 1000);
// Default City
getWeather("Saidpur");
