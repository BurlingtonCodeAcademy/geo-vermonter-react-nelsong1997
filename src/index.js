import React from 'react';
import ReactDOM from 'react-dom';
import L from 'leaflet';
import borderData from './border.js';
// import countyData from './counties.js'
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
      score: 100,
      mapCurrentCenter: null,
      countyList: [
        "Addison",
        "Bennington",
        "Caledonia",
        "Chittenden",
        "Essex",
        "Franklin",
        "Grand Isle",
        "Lamoille",
        "Orange",
        "Orleans",
        "Rutland",
        "Washington",
        "Windham",
        "Windsor"
      ],
      highScores: null,
      playerName: "",
      history: [],
      mode: "normal"
    }
    this.handleStart = this.handleStart.bind(this);
    this.handleGiveUp = this.handleGiveUp.bind(this);
    this.handleCountySelect = this.handleCountySelect.bind(this);
    this.goUp = this.goUp.bind(this);
    this.goLeft = this.goLeft.bind(this);
    this.goHome = this.goHome.bind(this);
    this.goRight = this.goRight.bind(this);
    this.goDown = this.goDown.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.replayGame = this.replayGame.bind(this);
  }

  handleStart () {
    this.setState({
      gameStarted: true,
      upGiven: false,
      randomLocation: findVermontLocation(),
      infoLoaded: false,
      countyGuess: null,
      mapCurrentCenter: null,
      score: 100,
      countyList: [
        "Addison",
        "Bennington",
        "Caledonia",
        "Chittenden",
        "Essex",
        "Franklin",
        "Grand Isle",
        "Lamoille",
        "Orange",
        "Orleans",
        "Rutland",
        "Washington",
        "Windham",
        "Windsor"
      ],
      history: [],
      mode: "normal"
    })
  }

  async componentDidMount () {
    const response = await fetch("/scores");
    const scoreObj = await response.json();
    this.setState({highScores: scoreObj})
  }

  componentDidUpdate () {
    if (!this.state.infoLoaded && this.state.randomLocation) {
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

  async replayGame (event) {
    let theScore = this.state.highScores[event.target.id.slice(-1)];
    let actionList = theScore.history.slice(0);
    this.setState({
      gameStarted: true,
      upGiven: false,
      randomLocation: theScore.location,
      mapCurrentCenter: theScore.loation,
      infoLoaded: false,
      countyGuess: null,
      score: 100,
      playerName: theScore.scorer,
      mode: "replay"
    })
    let turnCount = 0;
    await this.state.mapCurrentCenter;
    let theInterval = setInterval(() => {
      if (turnCount < actionList.length) {
        if (actionList[turnCount].actionType==="move" && this.state.gameStarted) {
          if (actionList[turnCount].actionValue==="up") {
            this.goUp();
          } else if (actionList[turnCount].actionValue==="left") {
            this.goLeft();
          } else if (actionList[turnCount].actionValue==="home") {
            this.goHome();
          } else if (actionList[turnCount].actionValue==="right") {
            this.goRight();
          } else if (actionList[turnCount].actionValue==="down") {
            this.goDown();
          }
        } else if (actionList[turnCount].actionType==="guess") {
          this.setState({countyGuess: actionList[turnCount].actionValue})
          if (actionList[turnCount].actionValue + " County"!==theScore.location.county) {
            let { score } = this.state;
            this.setState({score: score - 10})
          }
        }
        turnCount++;
      } else {
        clearInterval(theInterval);
        this.setState({
          gameStarted: false,
          playerName: "",
          infoLoaded: false
        })
      }
    }, 1000)
  }

  handleGiveUp () {
    this.setState({
      upGiven: true, 
      gameStarted: false,
      playerName: "",
      countyGuess: null
    })
  }

  handleNameChange (evt) {
    this.setState({
      playerName: evt.target.value
    });
  }

  async submitScore () {
    let { highScores } = this.state;
    highScores.push({
      "score": this.state.score,
      "scorer": this.state.playerName,
      "history": this.state.history,
      "location": this.state.randomLocation
    })
    this.setState({highScores: highScores})
    const response = await fetch("/scores", {
      method: "POST",
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(highScores)
    });
    if (response.status === 201) {
      console.log("score created")
    }
  }

  handleCountySelect () {
    let countySelect = document.getElementById("county-select");
    let guessWithCounty = countySelect.value + " County";
    this.setState({countyGuess: countySelect.value})
    let { history } = this.state;
    history.push({
      actionType: "guess",
      actionValue: countySelect.value
    })
    if (guessWithCounty===this.state.randomLocation.county) {
      this.submitScore()
      this.setState({
        gameStarted: false,
        playerName: "",
        history: history
      })
    } else {
      let { score } = this.state;
      let { countyList } = this.state;
      this.setState({
        score: score - 10,
        countyList: setDifference(countyList, [countySelect.value]),
        history: history
      })
    }
  }

  goUp () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng,
      lat: this.state.mapCurrentCenter.lat + .0012
    }
    let { score } = this.state;
    let { history } = this.state;
    history.push({
      actionType: "move",
      actionValue: "up"
    })
    this.setState({mapCurrentCenter: newCenter, score: score - 1, history: history, countyGuess: null})
  }

  goLeft () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng - .0012,
      lat: this.state.mapCurrentCenter.lat
    }
    let { score } = this.state;
    let { history } = this.state;
    history.push({
      actionType: "move",
      actionValue: "left"
    })
    this.setState({mapCurrentCenter: newCenter, score: score - 1, history: history, countyGuess: null})
  }

  goHome () {
    if (this.state.mapCurrentCenter.lat!==this.state.randomLocation.lat || this.state.mapCurrentCenter.lng!==this.state.randomLocation.lng) {
      let newCenter = {
        lng: this.state.randomLocation.lng,
        lat: this.state.randomLocation.lat
      }
      let { history } = this.state;
      history.push({
        actionType: "move",
        actionValue: "home"
      })
      this.setState({mapCurrentCenter: newCenter, history: history, countyGuess: null})
    }
  }

  goRight () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng + .0012,
      lat: this.state.mapCurrentCenter.lat
    }
    let { score } = this.state;
    let { history } = this.state;
    history.push({
      actionType: "move",
      actionValue: "right"
    })
    this.setState({mapCurrentCenter: newCenter, score: score - 1, history: history, countyGuess: null})
  }

  goDown () {
    let newCenter = {
      lng: this.state.mapCurrentCenter.lng,
      lat: this.state.mapCurrentCenter.lat - .0012
    }
    let { score } = this.state;
    let { history } = this.state;
    history.push({
      actionType: "move",
      actionValue: "down"
    })
    this.setState({mapCurrentCenter: newCenter, score: score - 1, history: history, countyGuess: null})
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
              upGiven={this.state.upGiven}
              countyGuess={this.state.countyGuess}
              gameStarted={this.state.gameStarted}
              playerName={this.state.playerName}
            />
            <div id="page-bottom">
              <div id="buttons-info">
                <Buttons
                  gameStarted={this.state.gameStarted}
                  handleStart={this.handleStart}
                  upGiven={this.state.upGiven}
                  handleGiveUp={this.handleGiveUp}
                  handleCountySelect={this.handleCountySelect}
                  countyList={this.state.countyList}
                  handleNameChange={this.handleNameChange}
                  playerName={this.state.playerName}
                  mode={this.state.mode}
                />
                <Info
                  upGiven={this.state.upGiven}
                  randomLocation={this.state.randomLocation}
                  score={this.state.score}
                  countyGuess={this.state.countyGuess}
                  gameStarted={this.state.gameStarted}
                  playerName={this.state.playerName}
                />
              </div>
              <Controls 
                goUp={this.goUp}
                goLeft={this.goLeft}
                goHome={this.goHome}
                goRight={this.goRight}
                goDown={this.goDown}
                gameStarted={this.state.gameStarted}
                countyGuess={this.state.countyGuess}
                mode={this.state.mode}
              />
            </div>
          </div>
          <div>
            <img src="./map.jpg" alt="Map of Vermont's counties"></img>
          </div>
          <Scores 
            highScores={this.state.highScores}
            replayGame={this.replayGame}
          />
        </div>
      </div>
    )
  }
}

class Map extends React.Component {
  componentDidMount() {
    if (!this.props.infoLoaded) {
      console.log("map init")
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

      L.geoJSON(borderData).addTo(this.map);
      this.polyline = L.polyline([[0, 0],[0, 0]], {color: 'red', dashArray: '4'}).addTo(this.map);
    }
  }

  componentDidUpdate() {
    if (this.props.gameStarted && this.props.infoLoaded && !this.props.upGiven) {
      this.map.setView(new L.LatLng(this.props.mapCurrentCenter.lat, this.props.mapCurrentCenter.lng), 18);
      this.marker = L.marker([this.props.randomLocation.lat, this.props.randomLocation.lng]).addTo(this.map)
      this.polyline.setLatLngs([
        [this.props.randomLocation.lat, this.props.randomLocation.lng],
        [this.props.mapCurrentCenter.lat, this.props.mapCurrentCenter.lng]
      ])
    }
    if (this.props.upGiven || (this.props.countyGuess && !this.props.gameStarted && this.props.playerName==="")) {
      this.map.setView(new L.LatLng(this.props.randomLocation.lat, this.props.randomLocation.lng), 8);
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

  listTheCounties (counties) {
    let i = 0;
    let listItems = [];
    counties.forEach((county) => {
      listItems.push(<option key={i}>{county}</option>)
      i++;
    })
    return (
      <select id="county-select">{listItems}</select>
    );

  }

  render() {
    if (!this.props.gameStarted && this.props.playerName!=="") {
      return (
        <div id="buttons">
          <input type="text" onChange={this.props.handleNameChange}></input>
          <button id="start" onClick={this.props.handleStart}>start game</button>
          <button id="give-up" style={{opacity: .5}}>give up!</button>
          <button id="guess" style={{opacity: .5}}>guess!</button>
        </div>
      )
    } else if (!this.props.gameStarted && this.props.playerName==="") {
      return (
        <div id="buttons">
          <input type="text" placeholder="Your name" onChange={this.props.handleNameChange}></input>
          <button id="start" style={{opacity: .5}}>start game</button>
          <button id="give-up" style={{opacity: .5}}>give up!</button>
          <button id="guess" style={{opacity: .5}}>guess!</button>
        </div>
      )
    } else if (this.props.mode==="replay") {
      return (
        <div id="buttons">
          <div id="player-name">
            <h4>Player: {this.props.playerName}</h4>
          </div>
          <button id="start" style={{opacity: .5}}>start game</button>
          <button id="stop-replay" onClick={this.props.handleGiveUp}>stop replay</button>
          <button id="guess" style={{opacity: .5}}>guess!</button>
        </div>
      )
    } else {
      return (
        <div id="buttons">
          <div id="player-name">
           <h4>Player: {this.props.playerName}</h4>
          </div>
          <button id="start" style={{opacity: .5}}>start game</button>
          <button id="give-up" onClick={this.props.handleGiveUp}>give up!</button>
          <button id="guess" onClick={this.showDialog}>guess!</button>
          <dialog id="guess-dialog">
            <form method="dialog">
              <p><label>Select a county</label></p>
                <div>
                 {this.listTheCounties(this.props.countyList)} 
                </div>
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
              <p>Latitude: ?</p>
              <p>Longitude: ?</p>
              <p>County: ?</p>
              <p>Municipality: ?</p>
              <p>You were incorrect :( Try again!</p>
              <p>Score: {this.props.score}</p>
            </div>
          )
        }
    } else if (!this.props.gameStarted) {
      return (
        <div id="info">
          <p>Latitude: ?</p>
          <p>Longitude: ?</p>
          <p>County: ?</p>
          <p>Municipality: ?</p>
          <p>Score: -</p>
        </div>
      )
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
    if (this.props.gameStarted && this.props.mode==="normal") {
      return (
        <div id="controls">
          <h2 style={{gridArea: "title"}}>Controls:</h2>
          <button id="up" onClick={this.props.goUp} style={{gridArea: "up"}}>↑</button>
          <button id="left" onClick={this.props.goLeft} style={{gridArea: "left"}}>←</button>
          <button id="home" onClick={this.props.goHome} style={{gridArea: "home"}}>H</button>
          <button id="right" onClick={this.props.goRight} style={{gridArea: "right"}}>→</button>
          <button id="down" onClick={this.props.goDown} style={{gridArea: "down"}}>↓</button>
        </div>
      )
    } else if (this.props.gameStarted && this.props.mode==="replay" && this.props.countyGuess) {
      return <h3>Guess: {this.props.countyGuess}</h3>
    } else {
      return null;
    }
  }
}

class Scores extends React.Component {
  listTheScores (scores) {
    let i = 0;
    let allOrderedScores = this.orderScores(scores)
    let topTenScores = allOrderedScores.slice(0, 10)
    let listItems = [];
    topTenScores.forEach((score) => {
      listItems.push(
        <li key={i}>
          {score.scorer}: {score.score}
          <button id={"history-button-" + i} onClick={this.showDialog}>view moves</button>
          <dialog id={"history-dialog-" + i}>
            <form method="dialog">
              <div>
                <p>Location: In the {score.location.municipalityType} of {score.location.municipalityName}, {score.location.county}, {score.location.state}</p>
                <p>Latitude: {score.location.lat}</p>
                <p>Longitude: {score.location.lng}</p>
                <p>Action History:</p>
                {this.listTheMoves(score)} 
              </div>
              <menu>
                <button value="cancel">Cancel</button>
                <button id={"confirmBtn-" + i} value="default" onClick={this.props.replayGame}>replay game!</button>
              </menu>
            </form>
          </dialog>
        </li>)
      i++;
    })
    return (
      <ol id="county-select">{listItems}</ol>
    );
  }

  showDialog(event) {
    let buttonIdNum = event.target.id.slice(-1);
    let dialogId = "history-dialog-" + buttonIdNum;
    let historyDialog = document.getElementById(dialogId);
    historyDialog.showModal();
  }

  listTheMoves (score) {
    let i = 0;
    let listItems = [];
    score.history.forEach((action) => {
      listItems.push(
        <li key={i}>
          {action.actionType}: {action.actionValue}
        </li>)
      i++;
    })
    return (
      <ol id="actions">{listItems}</ol>
    )
  }

  orderScores(scores) {
    scores.sort(function(a, b){return b.score - a.score})
    return scores;
  }

  render() {
    if (this.props.highScores) {
      return (
        <div id="scores">
          <h2>High Scores:</h2>
          {this.listTheScores(this.props.highScores)}
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
  let i = 1;
  while (!withinVermont(location)) {
    console.log(location.lng + ', ' + location.lat + " is outside of vermont, finding a new location...")
    location = randomInRectangle();
    i++;
  }
  console.log("After " + (i + 1) + " try(ies)...")
  return location;
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
  console.log("The selected location has longitude " + location.lng + " and latitude " + location.lat +
    " in the " + location.municipalityType + " of " + location.municipalityName + ", " + location.county + ", " + location.state + ".");
  return location;
}

function setDifference(minuend, subtrahend) {
  if (typeof(minuend)!=='object' || typeof(subtrahend)!=='object') {
    console.log('error: setDifference needs objects as arguments')
  };
let returnArray = []
let flag = 0;
for (let i in minuend) {
  for (let j in subtrahend) {
    if (minuend[i]===subtrahend[j]) {
      flag = 1;
    }
  }
  if (flag===0) {
    returnArray.push(minuend[i]);
  }
  flag = 0;
}
return returnArray;
}