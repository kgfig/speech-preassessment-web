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
var currentPrompt = null;
var currentIndex = 0;
var totalRecordCount = 0;
var uploadedCount = 0;
var prompts = new Array();

function fetchPrompts() {
	var request = new XMLHttpRequest();
	request.open("GET", "prompts.json", true);
	
	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			prompts = JSON.parse(request.responseText);
			console.log("Received " + prompts.length + " prompts");
			for (index in prompts) {
				console.log(index+":"+ prompts[index].text+"\t"+prompts[index].recorded+"\t"+prompts[index].instruction);
				if (!prompts[index].instruction)
					totalRecordCount++;
			}
			console.log("Found " + totalRecordCount + " prompts to record");
			initElements();
			updatePrompt();
			updateCounter();
			updateControls();
		} else {
			alert("Failed to fetch prompts");
		}
	}
	
	request.onerror = function () {
		alert("Failed to fetch prompts");
	}
	
	request.send();
}
				
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
        console.log("Start recording");
        if (!audioRecorder) {
			console.log("no audio recorder!");
            return;
		}
        e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
		recordButton.textContent = "Stop";
    }
}

function nextPrompt() {
	if (currentIndex < prompts.length - 1)
		currentIndex++;
	updatePrompt();
	console.log("Next prompt " + currentPrompt.text);
}

function previousPrompt() {
	if (currentIndex > 0) 
		currentIndex--;
	updatePrompt();
	console.log("Previous prompt " + currentPrompt.text);
}

function playPrevious() {
	console.log("Play previous prompt");
	goToPrompt(previousPrompt);
	
	if (currentPrompt.recorded)
		recordedWav.play();
}

function updatePrompt() {
	currentPrompt = prompts[currentIndex];
	document.getElementById("prompt").textContent = currentPrompt.text;
}

function updateCounter() {
	document.getElementById("counter").textContent = (currentIndex + 1) + " / " + prompts.length;
}

function updateControls() {
	if (currentIndex == prompts.length - 1)
		nextButton.disabled = true;
	else
		nextButton.disabled = false;
	
	console.log("instruction?"+prompts[currentIndex].instruction);
	if (prompts[currentIndex].instruction)
		recordButton.disabled = true;
	else 
		recordButton.disabled = false;
}

function setPrompt(newRecIndex) {
	if (newRecIndex >=0 && newRecIndex < prompts.length)
		currentIndex = newRecIndex;
	updatePrompt();
	console.log("Set prompt " + currentPrompt.text);
}

function goToPrompt(updatePromptIndex) {
	if (updatePromptIndex)
		updatePromptIndex();
		
	updateCounter();
	updateControls();
}

function getMissedPrompts() {
	console.log("Counting missed prompts");
	var missing = [];
	for (index in prompts) {
		if (!prompts[index].recorded && !prompts[index].instruction)
			missing.push(parseInt(index));
	}
	console.log("Found " +missing.length + " missed prompts");
	return missing;
}

function saveBlobURL( blob ) {
	var url = (window.URL || window.webkitURL).createObjectURL(blob);
	recordedWav.src = url;
	currentPrompt.recorded = blob;
	replayButton.disabled = false;
    goToPrompt(nextPrompt);
}

function onSubmit() {
	var missingIndices = getMissedPrompts();
	if (!missingIndices || missingIndices.length == 0) {
		var result = confirm("Submit recordings?");
		if (result) {
			replayButton.disabled = true;
			recordButton.disabled = true;
			nextButton.disabled = true;
			submitButton.disabled = true;
			for (index in prompts) {
				if (prompts[index].recorded) {
					console.log("Uploading wav for question " + prompts[index].question_id);
					upload(prompts[index]);
				}
			}
		}
	} else {
		var result = confirm("You missed " + missingIndices.length +" item(s).");
		if (result) {
			setPrompt(missingIndices[0]);
			goToPrompt();
		}
	}
}

function upload(uploadPrompt) {
	var xhr=new XMLHttpRequest();
	xhr.onload=function(e) {
		if(this.readyState === 4) {
			uploadedCount++;
			if (uploadedCount == totalRecordCount) {
				alert(e.target.responseText);
			}
		}
	};
	
	var fd=new FormData();
	fd.append("question_id", uploadPrompt.question_id);
	fd.append("wavfile", uploadPrompt.recorded);
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
	fetchPrompts();
}

window.addEventListener('load', initAudio );
