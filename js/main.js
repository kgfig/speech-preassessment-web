/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/*************** audio recording and playback variables ********************/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;

/****************** audio recording and wave display functions *******************/

function saveAudio() {
    audioRecorder.exportWAV( saveBlobURL );
}

function drawWave( buffers ) {
    var canvas = document.getElementById( "wavedisplay" );
    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData); 

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j< multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }
    
    rafID = window.requestAnimationFrame( updateAnalysers );
}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

/************************ prompt status and data ***************************/

var currentIndex = 0;
var prompts = new Array();
prompts[0] = {text: "UNO", recorded: false, question: false, url: null, index: 0};
prompts[1] = {text: "Andyan na si toot", recorded: false, question: false, url: null, index: 1};
prompts[2] = {text: "Kamusta naman ang hair mo", recorded: false, question: false, url: null, index: 2};
prompts[3] = {text: "Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this",
				recorded: false, question: false, url: null, index: 3}
				
/*********************** prompt controls and display ******************************/

var recordedWav = null, recordButton = null, replayButton = null,
	nextButton = null, submitButton = null, promptDisplay = null,
	counterDisplay = null;

/************************* control functions **************************/

function initElements() {
	recordedWav = document.getElementById("recordedWav");
	recordButton = document.getElementById("recordButton");
	replayButton = document.getElementById("replayButton");
	nextButton = document.getElementById("nextButton");
	submitButton = document.getElementById("submitButton");
	promptDisplay = document.getElementById("prompt");
	counterDisplay = document.getElementById("counter");
}

function toggleRecording( e ) {
	if (e.classList.contains("recording")) {
        console.log("stop recording");
        audioRecorder.stop();
        e.classList.remove("recording");
        audioRecorder.getBuffers( drawWave );
		recordButton.textContent = "Record";
		saveAudio();
    } else {
        console.log("start recording");
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
		recordButton.textContent = "Stop";
    }
}

function nextPrompt() {
	if (currentPrompt.index < prompts.length - 1)
		currentIndex++;
	updatePrompt();
	console.log("next prompt " + currentPrompt.text);
}

function previousPrompt() {
	if (currentPrompt.index > 0) 
		currentIndex--;
	updatePrompt();
	console.log("previous prompt " + currentPrompt.text);
}

function playPrevious() {
	console.log("play previous prompt");
	goToPrompt(previousPrompt);
	
	if (currentPrompt.recorded)
		recordedWav.play();
}

function updatePrompt() {
	currentPrompt = prompts[currentIndex];
	document.getElementById("prompt").textContent = currentPrompt.text;
}

function updateCounter() {
	document.getElementById("counter").textContent = (currentPrompt.index + 1) + " / " + prompts.length;
}

function updateControls() {
	if (currentPrompt.index == prompts.length - 1)
		nextButton.disabled = true;
	else
		nextButton.disabled = false;
		
	if (prompts[0].recorded)
		replayButton.disabled = false;
}

function setPrompt(newRecIndex) {
	if (newRecIndex >=0 && newRecIndex < prompts.length)
		currentIndex = newRecIndex;
	updatePrompt();
	console.log("set prompt " + currentPrompt.text);
}

function goToPrompt(updatePromptIndex) {
	if (updatePromptIndex)
		updatePromptIndex();
		
	updateCounter();
	updateControls();
}

function getMissedPrompts() {
	console.log("counting missed prompts");
	var missing = [];
	for (index in prompts) {
		if (!prompts[index].recorded)
			missing.push(index);
	}
	console.log("found " +missing.length + " missed prompts");
	return missing;
}

function onSubmit() {
	var missingIndices = getMissedPrompts();
	if (!missingIndices || missingIndices.length == 0) {
		var result = confirm("Thank you for participation!");
		if (result) {
			replayButton.disabled = true;
			recordButton.disabled = true;
			nextButton.disabled = true;
			submitButton.disabled = true;
			console.log("uploading recording " + index + " to " + prompts[index].url);
		}
	} else {
		var result = confirm("You missed " + missingIndices.length +" item(s).");
		if (result) {
			setPrompt(missingIndices[0]);
			goToPrompt();
		}
	}
}

function saveBlobURL( blob ) {
	var url = (window.URL || window.webkitURL).createObjectURL(blob);
	recordedWav.src = url;
	upload("username_bday_sp1_"+url.substring(url.lastIndexOf(":")+1)+".wav", blob);
	currentPrompt.recorded = blob;
	currentPrompt.url = url;
    goToPrompt(nextPrompt);
}

function upload(url, blob) {
  var xhr=new XMLHttpRequest();
  xhr.onload=function(e) {
      if(this.readyState === 4) {
          console.log("Server returned: ",e.target.responseText);
      }
  };
  var fd=new FormData();
  fd.append("filename", url);
  fd.append("wavfile", blob);
  xhr.open("POST","upload.php",true);
  xhr.send(fd);
}
/*************************** on load ************************/

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia({audio:true}, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
	updatePrompt();
	updateCounter();
	initElements();
}

window.addEventListener('load', initAudio );
