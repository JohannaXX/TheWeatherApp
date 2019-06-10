let apiWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather?q=';
let apiForecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?lat=';
let weatherKey = '7289e9613cb8f800099af227a5133275';

let hero = document.querySelector('#hero');
let mapResult = document.querySelector('.mapResult');
let mainpart = document.querySelector('.mainpart');

let weatherObj = {
  lat: "",
  lon: "",
  id: "",
  name: "",
  main: {
    temp:    "",
    pressure:    "",
    humidity:    "",
    temp_min:    "",
    temp_max:    "",
    visibility:    ""
  },
  wind:{
    speed: "",
    deg: ""
  },
  units: "metric"
}

function formatDate(date) {
  let d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

const searchWeatherLocation = (e) => {
  e.preventDefault();
  let cityToSearch = document.querySelector('#searchText').value;
  
  //TEST FOR SPECIAL CHARACTERS
  let format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    
  document.querySelector('.errMsg').innerHTML ="";
    
  if(format.test(cityToSearch)){
    let errOccured = document.querySelector('.errMsg');
    let errMessage = `
        <div class="col-12 text-center">
          <h3>Ooops, special characters are not accepted. Try again!</div>
        </div>`;
    errOccured.innerHTML = errMessage;
    return searchWeatherLocation;
  }   
  
  axios.get(apiWeatherUrl+cityToSearch+`&units=`+weatherObj.units+`&appid=`+ weatherKey)
  .then(function (weatherReturned) {
    // Both requests are now complete
    //asign returned data to our weatherObj
    weatherObj.id = weatherReturned.data.id;
    weatherObj.name = weatherReturned.data.name;
    weatherObj.lat = weatherReturned.data.coord.lat;
    weatherObj.lon = weatherReturned.data.coord.lon;
    weatherObj.main = weatherReturned.data.main;
    weatherObj.description = weatherReturned.data.weather[0].description;
    weatherObj.wind = weatherReturned.data.wind;
    return weatherObj;
  })
  .then(function(weatherObj){
    axios.get(apiForecastUrl + weatherObj.lat + `&lon=` + weatherObj.lon + `&units=`+ weatherObj.units + `&appid=`+weatherKey)
    .then(function(forecast){
      const minTemp=[],maxTemp=[],labelDates = [];
      const datesTemps = [];
      weatherObj.forecast = forecast.data.list; //--> some how need to calculate min - max per day using reduce
      const result = weatherObj.forecast.map(function(e) {
      let dt = formatDate(e.dt_txt);

      return {
        "date": dt,
        "temp": e.main.temp
      }
      })
   .reduce((groups, item) => {
     const group = (groups[item.date] || {"date": groups[item.date], "temps": []});
     group.date = item.date;
     group.temps.push(item.temp);
     groups[item.date] = group;
     return groups;
    }, {});

    for (let i in result){
      datesTemps.push(result[i]);
    }

    const tempMaxMin = datesTemps.map((curr)=>{
      const x=curr.temps.reduce((agg,currEle) => {
        agg.date = curr.date;
        agg.min = ( agg.min === undefined || currEle < agg.min ) ? currEle : agg.min
        agg.max = ( agg.max === undefined || currEle > agg.max ) ? currEle : agg.max
        //agg[datesTemps[i].date] = minMax
        return agg
      },{});
      //console.log(x)
      return x
    });

    for(let i in tempMaxMin) {
      minTemp.push(tempMaxMin[i].min);
      maxTemp.push(tempMaxMin[i].max);
      labelDates.push(tempMaxMin[i].date);
    }
        
    //Build the Graph in the DOM
    const ctx = document.getElementById("myChart");
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labelDates,
          datasets: [{
            label: 'Max Temp',
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgb(255, 99, 132)',
            fill: false,
            data: maxTemp,
          }, {
            label: 'Min Temp',
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgb(54, 162, 235)',
            fill: false,
            data: minTemp,
          }]
        },
        options: {
          legend: {
            labels: {
              fontColor: 'white'
            }
          },
          maintainAspectRatio: false,
          responsive: true,
          title: {
            display: true,
            text: 'UPCOMING DAYS',
            fontColor: 'white'
          },
          tooltips: {
            mode: 'index',
            intersect: false
          },
          hover: {
            mode: 'nearest',
            intersect: true
          },
          scales: {
            xAxes: [{
              display: true,
              ticks: {
                  fontColor: 'white',
              },
              scaleLabel: {
                display: true,
                labelString: 'Days',
                fontColor: 'white'
              }
            }],
            yAxes: [{
              display: true,
              ticks: {
                  fontColor: "white",
              },
              scaleLabel: {
                display: true,
                labelString: 'Temperature',
                fontColor: 'white'
              }
            }]
          }
        }
      });


      //Build the DOM with weatherObj
      const results = document.querySelector('.weatherResult');
      const mapCanvas = document.querySelector('.gmap_canvas');
      let weatherHTML = `
        <div class="row">
            <div class="card-body">
              <h1 class="card-title city">${weatherObj.name.toUpperCase()}</h1></br>
              <h2 class="text-center">Today</h2></br>
              <div class="card-text row">
                  <div class="col-6">
                      <h3 >Current temperature&#58</h3>
                      <h3><b>${weatherObj.main.temp}&#176C</b></h3></br>
                  </div>
                  <div class="card-text col-6 subtemp">    
                      <h3>Current minimum&#58</h3>
                      <h3><b>${weatherObj.main.temp_min}&#176C</b></h3></br>
                      <h3>Current maximum&#58</h3>
                      <h3><b>${weatherObj.main.temp_max}&#176C</b></h3></br>
                  </div>
              </div>
              <div class="card-text row">
                  <div class="col-6">
                      <h3>Wind speed&#58</h3>
                      <h3><b>${weatherObj.wind.speed}</b></h3>
                  </div>
              </div>
            </div>
         </div>
      `;

      let mapHtml = `
      <iframe id="gmap_canvas" src="https://maps.google.com/maps?q= ${weatherObj.name}&t=&z=15&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"> 
       </iframe>
      `;
      mapCanvas.innerHTML = mapHtml;

      results.innerHTML = weatherHTML;

      //show map
      mapResult.style.visibility= "visible";

      //show info
      mainpart.style.visibility= "visible";

      //console.log(forecast.data);
      });
  })
  .catch(function(error){
  console.log(error);
  });
}

let searchForm = document.querySelector('#searchForm');
searchForm.addEventListener('submit', searchWeatherLocation);
