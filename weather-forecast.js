"use strict";
// Create global variables
const locationInput = document.getElementById('input-text');
const currentLocationButton = document.getElementById('current-location-btn');
const searchButton = document.getElementById('search-btn');
const APIkey = 'ONCE-CALL-OPENWEATHERMAP-API'; //Openweathermap OnceCall API
const days = [];// array of 8 days from current day to next 7 days
let weatherData;

const popup = document.getElementById('popup-alert');
const overlay = document.createElement('div');//overlay background for popup

// Object constructor for 3 hours forecast
function HourlyDataObj(icon, temp, hour, minute) {
  this.icon = icon,
  this.temp = temp,
  this.hour = hour
  this.minute = minute
}

// get full country names
const regionNames = new Intl.DisplayNames( 
  ['en'], {type: 'region'}
);

// Set default location to Helsinki
let country = regionNames.of('FI');
let area = 'Helsinki';
let fullLocationName = 'Helsinki, Finland';
let lat = 60.16952;
let lon = 24.93545;

// create array of 8 days from current day to next 7 days
for (let i = 0; i <= 7; i++) {
  let day = new Date();
  day.setDate(day.getDate() + i);
  days.push(day.toDateString());
}

// convert unix time to daily time
function getLocalTime(unixTime) {
  let date = (new Date(unixTime * 1000));
  let hour = date.getHours();
  let minute = date.getMinutes();
  return `${hour}:${minute}`;
}

// Use Google API autocomplete place and get coordinates
let autocomplete;
function initAutocomplete() {
  autocomplete = new google.maps.places.Autocomplete(
    locationInput,
    {
      type: ['cities'],
    }
  );  

  locationInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent the form from press enter   
      getAutocompletePlace();   
    };
  })
}

function getAutocompletePlace() {
  setTimeout(() =>{
    try {
      let place = autocomplete.getPlace();
      fullLocationName = place.formatted_address;
      area = place.name;
      lat = place.geometry.location.lat();
      lon = place.geometry.location.lng();       
      getWeatherData(lat, lon);
    } 
    catch(error) {
      getCoordinates();
    }
  }, 200)
}

// Use this function in case getAutocompletePlace() catch error or mannual input
function getCoordinates() {
  if (locationInput.value) {
    const locationName = locationInput.value.trim();
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${locationName}&limit=5&appid=${APIkey}`)
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) {      
          let errorMessage = `No coordinates found for ${locationName}`;    
          showError(errorMessage); 
        } else {        
        lat = data[0].lat;
        lon = data[0].lon;
        country = regionNames.of(data[0].country);
        area = data[0].name;
        fullLocationName = area + ', ' + country;
        getWeatherData(lat, lon);
        };
      });   
  }
}

function getCurrentCoordinates() {
  navigator.geolocation.getCurrentPosition(
    (position)=> {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${APIkey}`)
        .then(response => response.json())
        .then(data => {
          country = regionNames.of(data[0].country);
          area = data[0].name;
          fullLocationName = area + ', ' + country;
          getWeatherData(lat, lon);
        })
    },
    () => {
      showError('Geolocation is not supported by this browser.');
    }
    );
}

function getWeatherData(lat, lon) {
  fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${APIkey}&units=metric`)
    .then(response => response.json())
    .then(data => {
      weatherData = data;
      getWeatherDetail()
    })
}

function getWeatherDetail() {     
    const sevenDaysForecastSection = document.querySelector('.next-7-days__list');
    sevenDaysForecastSection.innerHTML = '';
    let out = '';
    for (let i = 0; i <= 7; i++) {
      let humidity = weatherData.daily[i].humidity;
      let description = weatherData.daily[i].weather[0].description;
      let minTemp = weatherData.daily[i].temp.min;
      let maxTemp = weatherData.daily[i].temp.max;
      let icon = weatherData.daily[i].weather[0].icon;
      let date = days[i];
      let sunrise = getLocalTime(weatherData.daily[i].sunrise);
      let sunset = getLocalTime(weatherData.daily[i].sunset);     
      if (i === 0) {
        showTodayData(description, minTemp, maxTemp, humidity, icon, sunrise, sunset);     
      } else {
        out += createDayForecastCard(date, description, minTemp, maxTemp, humidity, icon, sunrise, sunset);
      }                
    }
    sevenDaysForecastSection.innerHTML = out;
}

function showTodayData(description, minTemp, maxTemp, humidity, icon, sunrise, sunset) {
  let currentTemp = weatherData.current.temp;
  let feelLike = weatherData.current.feels_like;
  let summary = weatherData.daily[0].summary; 

  const showLocationInfo = document.getElementById('detail-location-info');
  showLocationInfo.innerHTML = '';
  const currentData1 = document.getElementById('current-data-1');
  const currentData2 = document.getElementById('current-data-2');
  currentData1.innerHTML = '';
  currentData2.innerHTML = '';  
  const hourlyForecastSection = document.querySelector('.today__hours-forecast--list');
  hourlyForecastSection.innerHTML = '';
  showLocationInfo.innerHTML = `${fullLocationName}`;
  let out = '';    
  let hour = (new Date()).getHours();
  let minute = (new Date()).getMinutes(); 
  if (minute < 10) {
    minute = `0${minute}`;
  }
  // Show current weather data 
  currentData1.innerHTML = `
    <h2>${days[0]}</h2>    
    <h5 id="current-temp">${currentTemp} &deg;C</h5>
    <h5 id="realfeel">Real feel ${feelLike} &deg;C</h5>
    <h5 class="weather-description">${description[0].toUpperCase() + description.slice(1)}</h5>
    <div class="big-icon">
      <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="weather icon">
    </div>   
  `; 
  currentData2.innerHTML = `
    <h3>MORE DETAILS</h3>
    <h2>${hour}:${minute}</h2>
    <h5>Min temp ${minTemp}&degC</h5>
    <h5>Max temp ${maxTemp}&degC</h5>
    <h5>Humidity ${humidity}%</h5>
    <h5>Sunrise ${sunrise} &nbsp; &nbsp; Sunset ${sunset}</h5>
    <h5 class="italic">${summary}</h5>
  `;

  // create next 3-hours cards
  const hourlyData = [];
  for (let i = 1; i <= 6; i ++) {    
    hour = (hour + 3) % 24;
    let temp = weatherData.hourly[i].temp;
    let hourlyIcon = weatherData.hourly[i].weather[0].icon;
    hourlyData.push(new HourlyDataObj(hourlyIcon, temp, hour, minute));
    out += `    
      <li class="today__hours-forecast--card">
        <h3>${hour}:${minute}</h3>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather-icon">
        <h3>${temp} &deg;C</h3>
      </li>
    `;
    hourlyForecastSection.innerHTML = out;
  }  
}

function createDayForecastCard(date, description, minTemp, maxTemp, humidity, icon, sunrise, sunset) {
  return  `
    <li class="next-7-days__daily-card">
      <h2>${date}</h2>
      <h5>${description[0].toUpperCase() + description.slice(1)}</h5>
      <h5>Min temp ${minTemp}&degC</h5>
      <h5>Max temp ${maxTemp}&degC</h5>
      <h5>Humidity ${humidity}%</h5>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon">
      <h5>Sunrise ${sunrise} &nbsp Sunset ${sunset}</h5>
    </li>`;  
}

// Display information of error due to unsatisfied input
function showError(errorMessage) {  
  popup.innerHTML = errorMessage;
  popup.style.display = 'block';

  overlay.className = 'overlay';
  document.body.appendChild(overlay);
  overlay.style.display = 'block';
  
  popup.addEventListener('click', () => {
    popup.style.display = 'none';
    overlay.style.display = 'none';
  });

  overlay.addEventListener('click', () => {
    popup.style.display = 'none';
    overlay.style.display = 'none';
  });
}

getWeatherData(lat, lon);// Set default weather forecast for Helsinki area

// Double click to clear previous suggestions
locationInput.addEventListener('dblclick',() => {
  locationInput.value = '';
});

searchButton.addEventListener('click', getAutocompletePlace);
document.addEventListener('keypress', (event => event.key === 'Enter' && getAutocompletePlace()));
currentLocationButton.addEventListener('click', getCurrentCoordinates);