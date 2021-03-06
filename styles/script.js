var file = document.getElementById("file"); // Read uploaded file
var audio = document.getElementById("audio"); // Read audio details

// Get and display name of file
var visualizerFile = document.getElementById("visualizerFile");
file.addEventListener("change", showFileName);
function showFileName(event) {
  var file = event.target;
  var fileName = file.files[0].name; // Not working in Firefox!
  document.getElementById("visualizerFile").innerHTML = ' | ' + fileName;
}

// Load file and setup visualization
file.onchange = function() {
  var files = this.files; // Initialize audio file
  audio.src = URL.createObjectURL(files[0]); // Specify location of audio
  // Load and begin playing audio
  audio.load();
  audio.play();

  // Create audio context
  var audioContext = new AudioContext();
  var source = audioContext.createMediaElementSource(audio);
  // Setup analyser node
  var analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  // Detail level of bars
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  // Set up canvas
  var canvasCtx = canvas.getContext("2d");
  canvas.width = 1600; // Set canvas resolution (higher = better)
  canvas.height = 1000;
  var width = canvas.width;
  var height = canvas.height;

  // Enable play / pause Button
  var playDiv = document.getElementById('playIcon');
  var pauseDiv = document.getElementById('pauseIcon');
  playDiv.style.display = 'none';
  pauseDiv.style.display = 'block';

  var pButton = document.getElementById('playButton');
  pButton.disabled = false;

  // Paint canvas!
  function paintCanvas() {
    // Get bar color from user input
    var barColor = document.getElementById("selectBarColor").value;
    // Get bar width from user input
    var widthValue = document.getElementById("selectBarWidth").value;
    document.getElementById("widthOutput").innerHTML = widthValue;
    // Get smoothing value from user
    var smoothingAmount = document.getElementById("selectSmoothing").value;
    document.getElementById("smoothingOutput").innerHTML = smoothingAmount;
    if (smoothingAmount == "") {
      analyser.smoothingTimeConstant = .50; // Failsafe smoothing amount
    } else {
      analyser.smoothingTimeConstant = smoothingAmount;
    }
    // Get visualizer style from user
    var visualStyle = document.getElementById("selectStyle").value;
    var styleName = "";
    if (visualStyle == "1") {
      styleName = "Mirror";
    } else if (visualStyle == "2") {
      styleName = "Bar";
    } else if (visualStyle == "3") {
      styleName = "Tunnel";
    }
    document.getElementById("styleOutput").innerHTML = styleName;
    // Get background color from user
    var BGColor = document.getElementById("selectBGColor").value;
    if (BGColor == "") {
      canvasCtx.fillStyle = "#000000"; // Failsafe canvas background color
    } else {
      canvasCtx.fillStyle = BGColor; // Canvas background color
    }
    document.getElementById("bgcolorOutput").innerHTML = BGColor;
    document.getElementById("barcolorOutput").innerHTML = barColor;

    requestAnimationFrame(paintCanvas); // Update animation
    analyser.getByteFrequencyData(dataArray); // Read from audio
    canvasCtx.fillRect(0, 0, width, height); // Paint canvas ^

    // Set bar width and height
    if (widthValue == "") {
      var barWidth = (width / bufferLength) * 5.3; // Failsafe bar width
    } else {
      var barWidth = (width / bufferLength) * widthValue;
    }
    var barHeight;
    var x = barWidth / 2;
    var y = 0;

    // Draw bars (Shadows first)
    for (var i = 0; i < 510; i++) {
      canvasCtx.fillStyle = "#000000";
      // Determine visualizer "style"
      if (visualStyle == "1") { // "Mirror style"
        barHeight = dataArray[i] * 1.84;
        canvasCtx.fillRect(x, 500, barWidth, -1 * barHeight);
        canvasCtx.fillRect(x, 500, barWidth, barHeight); // Upside down
      } else if (visualStyle == "2") { // Normal "bar style"
        barHeight = dataArray[i] * 3.82;
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
      } else if (visualStyle == "3") { // "Tunnel"
        barHeight = dataArray[i] * 1.95;
        canvasCtx.fillRect(x, 0, barWidth, barHeight);
        canvasCtx.fillRect(x, 1000, barWidth, -1 * barHeight); // Upside down
      }
      x += barWidth + 2;
      // Repeat for colored bars
      if (barColor == "") {
        canvasCtx.fillStyle = "#ffffff"; // Failsafe bar color
      } else {
        canvasCtx.fillStyle = barColor;
      }
      if (visualStyle == "1") { // "Mirror style"
        barHeight = dataArray[i] * 1.84;
        canvasCtx.fillRect(y, 500, barWidth, -1 * barHeight);
        canvasCtx.fillRect(y, 500, barWidth, barHeight); // Upside down
      } else if (visualStyle == "2") { // Normal "bar style"
        barHeight = dataArray[i] * 3.82;
        canvasCtx.fillRect(y, height - barHeight, barWidth, barHeight);
      } else if (visualStyle ==  "3") { // "Tunnel"
        canvasCtx.fillRect(y, 0, barWidth, barHeight); // Upside down
        canvasCtx.fillRect(y, 1000, barWidth, -1 * barHeight);
      }
      y += barWidth + 2;
    }
  };
  paintCanvas();
}

// Setup audio controls
var playButton = document.getElementById('playButton'); // Play button
var seeker = document.getElementById('seeker'); // Seeker
var timeline = document.getElementById('timeline'); // Timeline
var duration = audio.duration; // Determine audio file duration
var timelineWidth = timeline.offsetWidth - seeker.offsetWidth; // Width

playButton.addEventListener("click", play); // Play button event listener
audio.addEventListener("timeupdate", timeUpdate, false);
timeline.addEventListener("click", function(event) {
  moveSeeker(event);
  audio.currentTime = duration * clickPercent(event);
}, false);

function clickPercent(event) {
  return (event.clientX - getPosition(timeline)) / timelineWidth;
}

// Draggable seeker cotnrol
seeker.addEventListener('mousedown', mouseDown, false);
window.addEventListener('mouseup', mouseUp, false);

var onSeeker = false;

function mouseDown() {
  onSeeker = true;
  window.addEventListener('mousemove', moveSeeker, true);
  audio.removeEventListener('timeupdate', timeUpdate, false);
}

function mouseUp(event) {
  if (onSeeker == true) {
    moveSeeker(event);
    window.removeEventListener('mousemove', moveSeeker, true);
    // Change track time
    audio.currentTime = duration * clickPercent(event);
    audio.addEventListener('timeupdate', timeUpdate, false);
  }
  onSeeker = false;
}
// Moves seeker position as user drags
function moveSeeker(event) {
  var newMargLeft = event.clientX - getPosition(timeline);

  if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
    seeker.style.marginLeft = newMargLeft + "px";
  }
  if (newMargLeft < 0) {
    seeker.style.marginLeft = "0px";
  }
  if (newMargLeft > timelineWidth) {
    seeker.style.marginLeft = timelineWidth + "px";
  }
}

// Synchronizes seeker position with current point in audio
function timeUpdate() {
  var playPercent = timelineWidth * (audio.currentTime / duration);
  seeker.style.marginLeft = playPercent + "px";
  if (audio.currentTime == duration) {
    playButton.className = "";
    playButton.className = "play";
  }
}

// Play and Pause
function play() {
  var playDiv = document.getElementById('playIcon');
  var pauseDiv = document.getElementById('pauseIcon');

  if (audio.paused) { // Unpause
    audio.play();
    // Class change for styling
    playButton.className = "";
    playButton.className = "pause";
    // Button visibility
    playDiv.style.display = 'none';
    pauseDiv.style.display = 'block';
  } else { // Pause
    audio.pause();
    // Class change for styling
    playButton.className = "";
    playButton.className = "play";
    // Button visibility
    playDiv.style.display = 'block';
    pauseDiv.style.display = 'none';
  }
}

// Gets audio file duration
audio.addEventListener("canplaythrough", function() {
  duration = audio.duration;
}, false);

// Returns position relative to top-left of viewport (Seeker function)
function getPosition(el) {
  return el.getBoundingClientRect().left;
};

function trackTime() {
  // For current track time
  var c = Math.floor(audio.currentTime);
  var cm = Math.floor(c % 3600 / 60) || 0; // Minutes
  var cs = Math.floor(c % 3600 % 60) || 0; // Seconds
  var tmpCs = Math.floor(c % 3600 % 60) || 0; // Seconds
  var cs = tmpCs < 10 ? '0' + tmpCs : tmpCs;

  // For track duration
  var d = Math.floor(audio.duration);
  var dm = Math.floor(d % 3600 / 60) || 0; // Minutes
  var ds = Math.floor(d % 3600 % 60) || 0; // Seconds
  var tmpDs = Math.floor(d % 3600 % 60) || 0; // Seconds
  var ds = tmpDs < 10 ? '0' + tmpDs : tmpDs;

  document.getElementById('trackTime').innerHTML =
  cm + ':' + cs + ' / ' + dm + ':' + ds;
}

// icons
function showWindow1() {
  document.getElementById('window1').style.display = "block";
  document.getElementById('window1header').style.display = "block";
  document.getElementById('window1content').style.display = "block";
  document.getElementById('windowhelp').style.display = "inline-block";
  window1Front();
}

function showWindow2() {
  document.getElementById('window2').style.display = "block";
  document.getElementById('window2header').style.display = "block";
  document.getElementById('window2content').style.display = "block";
  document.getElementById('windowabout').style.display = "inline-block";
  window2Front();
}

function showWindow3() {
  document.getElementById('window3').style.display = "block";
  document.getElementById('window3header').style.display = "block";
  document.getElementById('window3content').style.display = "block";
  document.getElementById('windowthemes').style.display = "inline-block";
  window3Front();
}

// close buttons
function closeWindow1() {
  document.getElementById('window1').style.display = "none";
  document.getElementById('windowhelp').style.display = "none";
}

function closeWindow2() {
  document.getElementById('window2').style.display = "none";
  document.getElementById('windowabout').style.display = "none";
}

function closeWindow3() {
  document.getElementById('window3').style.display = "none";
  document.getElementById('windowthemes').style.display = "none";
}

// Show / Hide Spans
function toggleWindow1Span1() {
  var span1 = document.getElementById('window1Span1');
  if (span1.style.display == 'block')
      span1.style.display = 'none';
      else {
        span1.style.display ='block';
      }
}

function toggleWindow1Span2() {
  var span2 = document.getElementById('window1Span2');
  if (span2.style.display == 'block')
      span2.style.display = 'none';
      else {
        span2.style.display ='block';
      }
}

function toggleWindow1Span3() {
  var span3 = document.getElementById('window1Span3');
  if (span3.style.display == 'block')
      span3.style.display = 'none';
      else {
        span3.style.display ='block';
      }
}

// Get current time
function currentTime() {
  var d = new Date();
  var n = d.toLocaleTimeString();
  document.getElementById('currentTime').innerHTML = n;
}

setInterval(currentTime, 1000);

// Draggable divs (W3Schools tutorial)
dragElement(document.getElementById(("visualizer")));
dragElement(document.getElementById(("settings")));
dragElement(document.getElementById(("window1"))); // Help
dragElement(document.getElementById(("window2"))); // About
dragElement(document.getElementById(("window3"))); // Themes

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Change background
function changebgWhite() {
  document.body.style.backgroundImage = "url('images/whitebg.svg')";
}
function changebgBlack() {
  document.body.style.backgroundImage = "url('images/blackbg.svg')";
}
function changebgPink() {
  document.body.style.backgroundImage = "url('images/pinkbg.svg')";
}
function changebgBlue() {
  document.body.style.backgroundImage = "url('images/bluebg.svg')";
}
function changebgOrange() {
  document.body.style.backgroundImage = "url('images/orangebg.svg')";
}
function changebgMint() {
  document.body.style.backgroundImage = "url('images/mintbg.svg')";
}
function changebgJBlack() {
  document.body.style.backgroundImage = "url('images/jpnblackbg.jpg')";
}
function changebgJPink() {
  document.body.style.backgroundImage = "url('images/jpnpinkbg.jpg')";
}

// Change theme
// Dark theme
function changebgDark() {
  // Colors
  var dark = "rgb(110, 110, 110)";
  var darker = "rgb(80, 80, 80)";
  var light = "rgb(130, 130, 130)";
  var lighter = "rgb(190, 190, 190)";
  var white = "rgb(255, 255, 255)";

  // Task bar (footer)
  document.getElementById("footerWindows").style.backgroundColor = darker;
  document.getElementById("startFooter").style.backgroundColor = darker;
  document.getElementById("footer").style.backgroundColor = darker;
  document.getElementById("footer").style.backgroundColor = darker;
  document.getElementById("footer").style.color = white;
  // Task bar windows
  document.getElementById("window98").style.backgroundColor = dark;
  document.getElementById("window98settings").style.backgroundColor = dark;
  document.getElementById("windowhelp").style.backgroundColor = dark;
  document.getElementById("windowabout").style.backgroundColor = dark;
  document.getElementById("windowthemes").style.backgroundColor = dark;
  // Window headers
  document.getElementById("visualizerheader").style.backgroundColor = darker;
  document.getElementById("settingsheader").style.backgroundColor = darker;
  document.getElementById("window1header").style.backgroundColor = darker;
  document.getElementById("window2header").style.backgroundColor = darker;
  document.getElementById("window3header").style.backgroundColor = darker;
  // Window header fonts
  document.getElementById("visualizerheader").style.color = white;
  document.getElementById("settingsheader").style.color = white;
  document.getElementById("window1header").style.color = white;
  document.getElementById("window2header").style.color = white;
  document.getElementById("window3header").style.color = white;
  // Window elements
  document.getElementById("audioPlayer").style.backgroundColor = light;
  document.getElementById("settingswindow").style.backgroundColor = light;
  document.getElementById("window1content").style.backgroundColor = light;
  document.getElementById("window2content").style.backgroundColor = light;
  document.getElementById("window3content").style.backgroundColor = light;
  // Window borders
  document.getElementById("settingswindow").style.borderColor = dark;
  document.getElementById("window1content").style.borderColor = dark;
  document.getElementById("window2content").style.borderColor = dark;
  document.getElementById("window3content").style.borderColor = dark;
  // Window fonts
    // document.getElementById("settingswindow").style.color = white;
    // document.getElementById("window1content").style.color = white;
    // document.getElementById("window2content").style.color = white;
    ///document.getElementById("window3content").style.color = white;
  // Buttons and other elements | Visualizer
  document.getElementById("uploadbutton").style.backgroundColor = dark;
  document.getElementById("uploadbutton").style.color = white;
  document.getElementById("playButton").style.backgroundColor = dark;
  // document.getElementById("playButton").style.color = white;
  document.getElementById("timeline").style.backgroundColor = dark;
  // document.getElementById("seeker").style.backgroundColor = white;
  document.getElementById("trackTime").style.color = white;
  // Buttons and other elements | Settings
    //document.getElementById("settingsTable").style.color = white;
  document.getElementById("selectBarColor").style.backgroundColor = dark;
  document.getElementById("selectBGColor").style.backgroundColor = dark;
  document.getElementById("selectBarWidth").style.backgroundColor = dark;
  document.getElementById("selectSmoothing").style.backgroundColor = dark;
  document.getElementById("selectStyle").style.backgroundColor = dark;
}

// Light theme
function changebgLight() {
  // Colors
  var footer = "rgb(240, 240, 240)";
  var muchlighter = "rgb(230, 230, 230)";
  var headers = "rgb(220, 220, 220)";
  var black = "rgb(0, 0, 0)";
  var button = "rgb(225, 225, 225)";

  // Task bar (footer)
  document.getElementById("footerWindows").style.backgroundColor = footer;
  document.getElementById("startFooter").style.backgroundColor = footer;
  document.getElementById("footer").style.backgroundColor = footer;
  document.getElementById("footer").style.color = black;
  // Task bar windows
  document.getElementById("window98").style.backgroundColor = muchlighter;
  document.getElementById("window98settings").style.backgroundColor = muchlighter;
  document.getElementById("windowhelp").style.backgroundColor = muchlighter;
  document.getElementById("windowabout").style.backgroundColor = muchlighter;
  document.getElementById("windowthemes").style.backgroundColor = muchlighter;
  // Window headers
  document.getElementById("visualizerheader").style.backgroundColor = headers;
  document.getElementById("settingsheader").style.backgroundColor = headers;
  document.getElementById("window1header").style.backgroundColor = headers;
  document.getElementById("window2header").style.backgroundColor = headers;
  document.getElementById("window3header").style.backgroundColor = headers;
  // Window header fonts
  document.getElementById("visualizerheader").style.color = black;
  document.getElementById("settingsheader").style.color = black;
  document.getElementById("window1header").style.color = black;
  document.getElementById("window2header").style.color = black;
  document.getElementById("window3header").style.color = black;
  // Window elements
  document.getElementById("audioPlayer").style.backgroundColor = footer;
  document.getElementById("settingswindow").style.backgroundColor = footer;
  document.getElementById("window1content").style.backgroundColor = footer;
  document.getElementById("window2content").style.backgroundColor = footer;
  document.getElementById("window3content").style.backgroundColor = footer;
  // Window borders
  document.getElementById("settingswindow").style.borderColor = headers;
  document.getElementById("window1content").style.borderColor = headers;
  document.getElementById("window2content").style.borderColor = headers;
  document.getElementById("window3content").style.borderColor = headers;
  // Window fonts
  document.getElementById("settingswindow").style.color = black;
  document.getElementById("window1content").style.color = black;
  document.getElementById("window2content").style.color = black;
  document.getElementById("window3content").style.color = black;
  // Buttons and other elements | Visualizer
  document.getElementById("uploadbutton").style.backgroundColor = button;
  document.getElementById("uploadbutton").style.color = black;
  document.getElementById("playButton").style.backgroundColor = button;
  // document.getElementById("playButton").style.color = white;
  document.getElementById("timeline").style.backgroundColor = button;
  // document.getElementById("seeker").style.backgroundColor = white;
  document.getElementById("trackTime").style.color = black;
  // Buttons and other elements | Settings
  document.getElementById("settingsTable").style.color = black;
  document.getElementById("selectBarColor").style.backgroundColor = button;
  document.getElementById("selectBGColor").style.backgroundColor = button;
  document.getElementById("selectBarWidth").style.backgroundColor = button;
  document.getElementById("selectSmoothing").style.backgroundColor = button;
  document.getElementById("selectStyle").style.backgroundColor = button;
  var slider = document.getElementsByClassName("slider");
    var x;
    for (x = 0; x < slider.length; x++) {
        slider[x].style.backgroundColor = "button";
    }
}

// Z-Index
document.getElementById("visualizer").addEventListener("mousedown", visualizerFront);
function visualizerFront() {
  visualizer.style.zIndex = "3";
  settings.style.zIndex = "2";
  window1.style.zIndex = "1";
  window2.style.zIndex = "1";
  window3.style.zIndex = "1";
}

document.getElementById("settings").addEventListener("mousedown", settingsFront);
function settingsFront() {
  settings.style.zIndex = "2";
  visualizer.style.zIndex = "1";
  window1.style.zIndex = "1";
  window2.style.zIndex = "1";
  window3.style.zIndex = "1";
}

document.getElementById("window1").addEventListener("mousedown", window1Front);
function window1Front() {
  settings.style.zIndex = "1";
  visualizer.style.zIndex = "1";
  window1.style.zIndex = "2";
  window2.style.zIndex = "1";
  window3.style.zIndex = "1";
}

document.getElementById("window2").addEventListener("mousedown", window2Front);
function window2Front() {
  settings.style.zIndex = "1";
  visualizer.style.zIndex = "1";
  window1.style.zIndex = "1";
  window2.style.zIndex = "2";
  window3.style.zIndex = "1";
}

document.getElementById("window3").addEventListener("mousedown", window3Front);
function window3Front() {
  settings.style.zIndex = "1";
  visualizer.style.zIndex = "1";
  window1.style.zIndex = "1";
  window2.style.zIndex = "1";
  window3.style.zIndex = "2";
}

// Viewport nonsense
var viewport = window.innerWidth;
if (viewport < 600) {
  document.getElementById("warning").style.visibility = "visible";
  document.getElementById("warningbg").style.visibility = "visible";
}
