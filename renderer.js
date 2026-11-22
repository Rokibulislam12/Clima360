const API_KEY = "fb6584dbccb72dc5b8765b76e564f12a";

const $ = id => document.getElementById(id);

const forecastCards = $("forecastCards");

// Weather Icons
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

// Loading
function showLoading() {
  showToast("Loading live weather data...");
}

// Current Weather API
async function getWeather(city) {
  if (!city || !city.trim()) {
    showToast("Please enter a city name.");
    return;
  }

  if (API_KEY === "fb6584dbccb72dc5b8765b76e564f12a") {
    showToast("Please add your OpenWeatherMap API Key.");
    return;
  }

  showLoading();

  try {
    const cityName = city.trim();

    const currentURL =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;

    const forecastURL =
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;

    const [currentResponse, forecastResponse] =
      await Promise.all([
        fetch(currentURL),
        fetch(forecastURL)
      ]);

    if (!currentResponse.ok) {
      if (currentResponse.status === 404) {
        throw new Error("City not found.");
      }

      if (currentResponse.status === 401) {
        throw new Error("Invalid API Key.");
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
    weatherInfo.description.replace(/\b\w/g, char =>
      char.toUpperCase()
    );

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

  $("uvMetric").textContent = "N/A";

  $("cloudMetric").innerHTML =
    `${data.clouds.all}<span>%</span>`;

  const humidityBar =
    document.querySelector(".meter span");

  const cloudBar =
    document.querySelector(".purple-meter span");

  const windBar =
    document.querySelector(".wind-track span");

  if (humidityBar) {
    humidityBar.style.width =
      `${data.main.humidity}%`;
  }

  if (cloudBar) {
    cloudBar.style.width =
      `${data.clouds.all}%`;
  }

  if (windBar) {
    windBar.style.width =
      `${Math.min(data.wind.speed * 3.6, 100)}%`;
  }
}

// Display 5-Day Forecast
function displayForecast(data) {
  if (!forecastCards) return;

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

    const day = new Date(`${date}T12:00:00`)
      .toLocaleDateString("en-US", {
        weekday: "short"
      });

    return {
      day,
      icon: getWeatherIcon(selected.weather[0].main),
      temp: Math.round(selected.main.temp)
    };
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
const searchForm = $("searchForm");

if (searchForm) {
  searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const city = $("cityInput").value.trim();

    if (city) {
      getWeather(city);
    }
  });
}

// Popular Cities
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
  "Islamabad",
  "Delhi",
  "Kathmandu"
];

// Load City Weather
async function loadCityWeather() {
  const cityContainer = $("cityList");

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
      card.querySelector(".city-temp").textContent =
        "Unavailable";

      card.querySelector(".city-condition").textContent =
        "Weather not available";
    }
  }
}

// View All
const viewAll = $("viewAll");

if (viewAll) {
  viewAll.addEventListener("click", () => {
    showToast("Search any city to see its live weather.");
  });
}

// Dark Mode
const themeToggle = $("themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}

// Live Clock
function updateClock() {
  const clock = $("clock");

  if (!clock) return;

  clock.textContent =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
}

// Bangladesh Date
function updateDate() {
  const now = new Date();

  const localDate = $("localDate");
  const todayDate = $("todayDate");

  if (localDate) {
    localDate.textContent =
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        weekday: "long",
        month: "long",
        day: "numeric"
      }).format(now);
  }

  if (todayDate) {
    todayDate.textContent =
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        day: "2-digit",
        month: "short"
      }).format(now).toUpperCase();
  }
}

// App Version
if (window.weatherApp) {
  window.weatherApp.getAppVersion().then(version => {
    console.log("Clima360 Version:", version);
  });
}

// Start Application
updateDate();
updateClock();

setInterval(updateClock, 1000);

// Load Popular Cities
loadCityWeather();

// Default City
getWeather("Saidpur");
