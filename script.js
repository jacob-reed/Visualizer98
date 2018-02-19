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
  console.log(bufferLength);
  var dataArray = new Uint8Array(bufferLength);

  // Set up canvas
  var canvasCtx = canvas.getContext("2d");
  canvas.width = 2000; // Set canvas resolution (higher = better)
  canvas.height = 1000;
  var width = canvas.width;
  var height = canvas.height;

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
    }
    document.getElementById("styleOutput").innerHTML = styleName;
    // Get background color from user
    var BGColor = document.getElementById("selectBGColor").value;
    if (BGColor == "") {
      canvasCtx.fillStyle = "#000000"; // Failsafe canvas background color
    } else {
      canvasCtx.fillStyle = BGColor; // Canvas background color
    }

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
  if (audio.paused) { // Unpause
    audio.play();
    // Class change for styling
    playButton.className = "";
    playButton.className = "pause";
  } else { // Pause
    audio.pause();
    // Class change for styling
    playButton.className = "";
    playButton.className = "play";
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
  var cm = Math.floor(c % 3600 / 60); // Minutes
  var cs = Math.floor(c % 3600 % 60); // Seconds
  var tmpCs = Math.floor(c % 3600 % 60); // Seconds
  var cs = tmpCs < 10 ? '0' + tmpCs : tmpCs;

  // For track duration
  var d = Math.floor(audio.duration);
  var dm = Math.floor(d % 3600 / 60); // Minutes
  var ds = Math.floor(d % 3600 % 60); // Seconds
  var tmpDs = Math.floor(d % 3600 % 60); // Seconds
  var ds = tmpDs < 10 ? '0' + tmpDs : tmpDs;

  document.getElementById('trackTime').innerHTML =
  cm + ':' + cs + ' / ' + dm + ':' + ds;
}
