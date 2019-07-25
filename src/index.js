import React from 'react';
import ReactDOM from 'react-dom';
import L from 'leaflet';
import borderData from './border.js';
import countyData from './counties.js'
import leafletPip from "@mapbox/leaflet-pip";

class Page extends React.Component {
  constructor () {
    super();
    this.state = {
      gameStarted: false,
      infoLoaded: false,
      randomLocation: null,
      upGiven: false,
      countyGuess: null,
      score: 0,
      mapCurrentCenter: null
    }
    this.handleStart = this.handleStart.bind(this);
    this.handleGiveUp = this.handleGiveUp.bind(this);
    this.handleCountySelect = this.handleCountySelect.bind(this);
    this.goUp = this.goUp.bind(this);
    this.goLeft = this.goLeft.bind(this);
    this.goRight = this.goRight.bind(this);
    this.goDown = this.goDown.bind(this);
  }

  handleStart () {
    this.setState({
      gameStarted: true,
      upGiven: false,
      randomLocation: findVermontLocation(),
      infoLoaded: false,
      countyGuess: null,
      mapCurrentCenter: null
    })
  }

  componentDidUpdate () {
    if (!this.state.infoLoaded) {
      console.log(this.state.randomLocation)
      fetch(`http://nominatim.openstreetmap.org/reverse.php?format=json&lat=${this.state.randomLocation.lat}&lon=${this.state.randomLocation.lng}`)
        .then(response => response.json())
        .then(object => findLocationInfo(object, this.state.randomLocation))
        .then(this.setState({infoLoaded: true}))
    }
    if (!this.state.mapCurrentCenter && this.state.randomLocation) {
      let randomLatLong = {
        lng: this.state.randomLocation.lng,
        lat: this.state.randomLocation.lat
      }
      this.setState({mapCurrentCenter: randomLatLong})
    }
  }

  handleGiveUp () {
    this.setState({upGiven: true, gameStarted: false})
  }

  handleCountySelect () {
    let countySelect = document.getElementById("county-select");
    let guessWithCounty = countySelect.value + " County";
    this.setState({countyGuess: countySelect.value, gameStarted: false})
    if (guessWithCounty===this.state.randomLocation.county) {
      let oldScore = this.state.score;
      this.setState({score: oldScore + 10})
    }
  }

  goUp () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng,
      lat: this.state.mapCurrentCenter.lat + .001
    }

    this.setState({mapCurrentCenter: newCenter})
  }

  goLeft () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng - .001,
      lat: this.state.mapCurrentCenter.lat
    }

    this.setState({mapCurrentCenter: newCenter})
  }

  goRight () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng + .001,
      lat: this.state.mapCurrentCenter.lat
    }

    this.setState({mapCurrentCenter: newCenter})
  }

  goDown () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng,
      lat: this.state.mapCurrentCenter.lat - .001
    }

    this.setState({mapCurrentCenter: newCenter})
  }

  render() {
    return (
      <div id="site">
        <h1>Geo Vermonter!</h1>
        <div id="page">
          <div>
            <Map
              infoLoaded={this.state.infoLoaded}
              randomLocation={this.state.randomLocation}
              mapCurrentCenter={this.state.mapCurrentCenter}
            />
            <div id="page-bottom">
              <div id="buttons-info">
                <Buttons
                  gameStarted={this.state.gameStarted}
                  handleStart={this.handleStart}
                  upGiven={this.state.upGiven}
                  handleGiveUp={this.handleGiveUp}
                  handleCountySelect={this.handleCountySelect}
                />
                <Info
                  upGiven={this.state.upGiven}
                  randomLocation={this.state.randomLocation}
                  score={this.state.score}
                  countyGuess={this.state.countyGuess}
                />
              </div>
              <Controls 
                goUp={this.goUp}
                goLeft={this.goLeft}
                goRight={this.goRight}
                goDown={this.goDown}
                gameStarted={this.state.gameStarted}
              />
            </div>
          </div>
          <div>
            <img src="./map.jpg" alt="Map of Vermont's counties"></img>
          </div>
        </div>
      </div>
    )
  }
}

class Map extends React.Component {
  componentDidMount() {
    if (!this.props.infoLoaded) {
      this.map = L.map('map', {
        center: [44.26, -72.58],
        zoom: 7,
        layers: [
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }),
        ]
      });
      this.map.removeControl(this.map.zoomControl);
      this.map.touchZoom.disable();
      this.map.doubleClickZoom.disable();
      this.map.scrollWheelZoom.disable();
      this.map.boxZoom.disable();
      this.map.keyboard.disable();
      this.map.dragging.disable();

      L.geoJSON(countyData).addTo(this.map);
    }
  }

  componentDidUpdate() {
    if (this.props.infoLoaded) {
      console.log(this.props.mapCurrentCenter)
      this.map.setView(new L.LatLng(this.props.mapCurrentCenter.lat, this.props.mapCurrentCenter.lng), 18);
      this.marker = L.marker([this.props.randomLocation.lat, this.props.randomLocation.lng]).addTo(this.map)

      var countyOutlines = L.geoJSON(countyData);
      this.map.removeLayer(countyOutlines);
    }
  }

  render() {
    return (
      <div id="map"></div>
    )
  }
}

class Buttons extends React.Component {
  showDialog() {
    let guessDialog = document.getElementById("guess-dialog");
    guessDialog.showModal();
  }

  render() {
    if (!this.props.gameStarted) {
      return (
        <div id="buttons">
          <button id="start" onClick={this.props.handleStart}>start game</button>
          <button id="give-up" style={{opacity: .5}}>give up!</button>
          <button id="guess" style={{opacity: .5}}>guess!</button>
        </div>
      )
    } else {
      return (
        <div id="buttons">
          <button id="start" style={{opacity: .5}}>start game</button>
          <button id="give-up" onClick={this.props.handleGiveUp}>give up!</button>
          <button id="guess" onClick={this.showDialog}>guess!</button>
          <dialog id="guess-dialog">
            <form method="dialog">
              <p><label>Select a county
                <select id="county-select">
                  <option>Addison</option>
                  <option>Bennington</option>
                  <option>Caledonia</option>
                  <option>Chittenden</option>
                  <option>Essex</option>
                  <option>Franklin</option>
                  <option>Grand Isle</option>
                  <option>Lamoille</option>
                  <option>Orange</option>
                  <option>Orleans</option>
                  <option>Rutland</option>
                  <option>Washington</option>
                  <option>Windham</option>
                  <option>Windsor</option>
                </select>
              </label></p>
              <menu>
                <button value="cancel">Cancel</button>
                <button id="confirmBtn" value="default" onClick={this.props.handleCountySelect}>OK</button>
              </menu>
            </form>
          </dialog>
        </div>
      )
    }
  }
}

class Info extends React.Component {
  render() {
    if (this.props.upGiven) {
      return (
        <div id="info">
          <p>Latitude: {this.props.randomLocation.lat}</p>
          <p>Longitude: {this.props.randomLocation.lng}</p>
          <p>County: {this.props.randomLocation.county}</p>
          <p>Municipality: {this.props.randomLocation["municipalityName"]}</p>
          <p>Score: {this.props.score}</p>
        </div>
      )
    } else if (this.props.countyGuess) {
        console.log("guess: " + this.props.countyGuess)
        let guessWithCounty = this.props.countyGuess + " County"
        if (guessWithCounty===this.props.randomLocation.county) {
          return (
            <div id="info">
              <p>Latitude: {this.props.randomLocation.lat}</p>
              <p>Longitude: {this.props.randomLocation.lng}</p>
              <p>County: {this.props.randomLocation.county}</p>
              <p>Municipality: {this.props.randomLocation["municipalityName"]}</p>
              <p>You were correct!</p>
              <p>Score: {this.props.score}</p>
            </div>
          )
        } else {
          return (
            <div id="info">
              <p>Latitude: {this.props.randomLocation.lat}</p>
              <p>Longitude: {this.props.randomLocation.lng}</p>
              <p>County: {this.props.randomLocation.county}</p>
              <p>Municipality: {this.props.randomLocation["municipalityName"]}</p>
              <p>You were incorrect :(</p>
              <p>Score: {this.props.score}</p>
            </div>
          )
        }
    } else {
      return (
        <div id="info">
          <p>Latitude: ?</p>
          <p>Longitude: ?</p>
          <p>County: ?</p>
          <p>Municipality: ?</p>
          <p>Score: {this.props.score}</p>
        </div>
      )
    }
  }
}

class Controls extends React.Component {
  render () {
    if (this.props.gameStarted) {
      return (
        <div id="controls">
          <h2 style={{gridArea: "title"}}>Controls:</h2>
          <button id="up" onClick={this.props.goUp} style={{gridArea: "up"}}>↑</button>
          <button id="left" onClick={this.props.goLeft} style={{gridArea: "left"}}>←</button>
          <button id="right" onClick={this.props.goRight} style={{gridArea: "right"}}>→</button>
          <button id="down" onClick={this.props.goDown} style={{gridArea: "down"}}>↓</button>
        </div>
      )
    } else {
      return null;
    }
  }
}

ReactDOM.render(
  <Page />,
  document.getElementById('root')
)

function randomNumber(min, max) {
  let range = max - min; 
  return min + (Math.random() * range);
}

function findVermontLocation () {
  let location = randomInRectangle();
  let i = 0;
  while (!withinVermont(location) && i<100) {
    console.log(location.lng + ', ' + location.lat + " is outside of vermont, finding a new location...")
    location = randomInRectangle();
    i++;
  }
  if (!withinVermont(location)) {
    console.log("I failed to find a location within Vermont's borders :(")
  } else {
    console.log("After " + (i + 1) + " try(ies)...")
    return location;
  }
}

function randomInRectangle() { //"rectangle" meaning a rectangle that encloses all of VT
  let result = {
    lng: randomNumber(-73.41592488911837, -71.51022535353107),
    lat: randomNumber(42.730315121762715, 45.007561302382754)
  }
  return result;
}

function withinVermont(location) {
  let array = leafletPip.pointInLayer([location.lng, location.lat], L.geoJSON(borderData));
  if (array.length === 0) {
    return false;
  } else {
    return true;
  }
}

function findLocationInfo(object, location) {
  let areaNames = []; //e.g. street, county, country
  let municipalityTypeIndex = null;
  for (let item in object["address"]) {
    areaNames.push(item);
  }
  for (let i = 0; i < areaNames.length - 1; i++) {
    if (areaNames[i]==="county") { //town, village, city, hamlet etc. always 1 before county
      municipalityTypeIndex = i - 1;
    }
  }
  location["municipalityType"] = areaNames[municipalityTypeIndex]; //e.g. city, town, hamlet, village
  location["municipalityName"] = object["address"][location["municipalityType"]] //e.g. burlington, stowe, rutland
  location["state"] = object["address"]["state"] //double check that we're in vermont
  location["county"] = object["address"]["county"]
  console.log("I have selected a location with longitude " + location.lng + " and latitude " + location.lat +
    " in the " + location.municipalityType + " of " + location.municipalityName + ", " + location.county + ", " + location.state + ".");
  return location;
}