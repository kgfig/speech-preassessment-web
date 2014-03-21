<!doctype html>
<html>
<?php 
	define('WP_USE_THEMES', false);
	require('../wp-blog-header.php');

	if ($current_user->ID > 0) {  ?>
<head>
	<meta name="viewport" content="width=device-width,initial-scale=1">
    <script src="js/AudioContextMonkeyPatch.js"></script>
	<script src="js/audiodisplay.js"></script>
	<script src="js/recorderjs/recorder.js"></script>
	<script src="js/main.js"></script>
	<title>Speech Pre-assessment</title>
	<style>
	
	body { 
		background: rgb(250, 250, 250);
		font-size: 200%;
		overflow: hidden;
		height: 90vh;
		color: rgb(45, 45, 45);
		font-family: Helvetica, Arial, sans-serif;
	}
	
	button {
		display: inline-block;
		*display: inline;
		padding: 5px 20px;
		margin-bottom: 5px;
		*margin-left: 0.3em;
		line-height: 20px;
		color: #333;
		text-align: center;
		vertical-align: middle;
		cursor: pointer;
		background-color: #eee;
		background: -webkit-gradient(linear, left top, left bottom, from(#eee), to(#e6e6e6));
		background: -moz-linear-gradient(top, #eee, #e6e6e6);
		border: 1px solid #bbbbbb;
		border-color: rgba(0,0,0,0.1) rgba(0,0,0,0.1) rgba(0,0,0,0.25);
		border-color: #eee, #eee, #d4d4d4;
		filter:progid:dximagetransform.microsoft.gradient(startColorstr="#ffffffff", endColorstr="#ffe6e6e6", GradientType=0);
		filter:progid:dximagetransform.microsoft.gradient(enabled=false);
		*zoom:1;
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.2),0 1px 2px rgba(0,0,0,0.05);
		-moz-box-shadow: inset 0 1px 0 rgba(255,255,255,0.2),0 1px 2px rgba(0,0,0,0.05);
		-webkit-box-shadow: inset 0 1px 0 rgba(255,255,255,0.2),0 1px 2px rgba(0,0,0,0.05);
	}
	
	button:disabled {
		color: rgb(200, 200,200);
	}
	
	button:hover {
		box-shadow: 0px 0px 3px darkgrey;
	}

	.small-font {
		font-size: 18pt !important;
		line-height: 125% !important;
	}
	
	#controls {
		width: 100%;
		margin: 30px auto;
		text-align: center;
		position: relative;
	}
	
	#prompt {
		height: 50vh;
		width: 80%;
		overflow-y: auto;
		margin: 10px 8%;
		text-align: center;
		position: relative;
		padding: 20px;
		background: #f0f0f0;
		line-height: 50px;
	}
	
	#header {
		height: 15vh;
		width: 80%;
		margin: 10px 8%;
		position: relative;
		padding: 10px;
	}
	
	canvas { 
		background: #202020; 
		box-shadow: 0px 0px 10px blue;
		width: 25%;
		float: right;
		bottom: 0px;
		height: 100%;
	}
	
	#counter {
		float: left;
		position: absolute;
	}
	
	#nav {
		bottom: 0px;
		position: absolute;
	}
	
	.modal {
        position: fixed;
        top: 0;
        left: 0;
        background-color: black;
        z-index: 99;
        opacity: 0.8;
        filter: alpha(opacity=80);
        -moz-opacity: 0.8;
        min-height: 100%;
        width: 100%;
    }
    #loading {
		padding: 30px 0;
        font-size: 20pt;
        border: 5px solid #f0f0f0;
        width: 500px;
        height: 100px;
        position: fixed;
        background-color: lightgrey;
        z-index: 999;
		display: none;
    }
	.stop-button {
		background: url("img/stop-button-bg.png") no-repeat scroll 5px 3px #e6e6e6;
		padding: 5px 10px 5px 30px;
	}
	
	.play-button {
		background: url("img/play-button-bg.png") no-repeat scroll 5px 3px #e6e6e6;
		padding: 5px 10px 5px 30px;
	}
	
	.play-button:disabled {
		background: url("img/play-button-disabled-bg.png") no-repeat scroll 5px 3px #e6e6e6;
		padding: 5px 10px 5px 30px;
	}
	
	.record-button {
		background: url("img/record-button-bg.png") no-repeat scroll 5px 3px #e6e6e6;
		padding: 5px 10px 5px 30px;
	}
	
	.record-button:disabled {
		background: url("img/record-button-disabled-bg.png") no-repeat scroll 5px 3px #e6e6e6;
		padding: 5px 10px 5px 30px;
	}
	
	.small-button {
		padding: 5px;
		width: 32px;
		height: 32px;
	}
	
	#prevSmall {
		background: url("img/prev-small-button.png") no-repeat scroll 5px 3px #e6e6e6;
	}
	
	#prevSmall:disabled {
		background: url("img/prev-small-button-disabled.png") no-repeat scroll 5px 3px #e6e6e6;
	}
	
	#playButton {
		background: url("img/play-small-button.png") no-repeat scroll 5px 3px #e6e6e6;
	}
	
	#playButton:disabled {
		background: url("img/play-small-button-disabled.png") no-repeat scroll 5px 3px #e6e6e6;
	}
	
	#nextSmall {
		background: url("img/next-small-button.png") no-repeat scroll 5px 3px #e6e6e6;
	}
	
	#nextSmall:disabled {
		background: url("img/next-small-button-disabled.png") no-repeat scroll 5px 3px #e6e6e6;
	}
	
	.footnote {
		font-size: 0.7em;
		line-height: 140%;
	}
	
	progress {
		color: #272727;
		font-size: .6em;
		line-height: 1.5em;
		text-indent: .5em;
		width: 15em;
		height: 1.4em;
		border: 1px solid #272727;
		background: #fff;
	}
	
	progress[value] {
		-webkit-appearance: none;
		-moz-appearance: none;
        appearance: none;
		border: none;
	}
	
	progress::-moz-progress-bar { background: #272727; }
	
	progress::-webkit-progress-bar { background: #fff; }
	progress::-webkit-progress-value { background: #272727; }
	
	</style>
</head>
<body>
		<div id="loading" align="center">
			<span id="uploading-text">Uploading. Please wait.</span>
			<br />
			<br />
			<progress value="0" max="100" id="progressbar"></progress>
			<button id="save-recordings" onclick="saveRecordings();">Yes</button>
			<a href="" id="wavlink"><?php echo $current_user->user_nicename; ?></a>
		</div>
		<div id="modal"></div>
		<div id="header">
			<span id="counter"></span>
			<span id="nav">
			<button id="prevSmall" onclick="goToPrompt(previousPrompt);" class="small-button"></button>
			<button id="playButton" onclick="playPrompt();" class="small-button"></button>
			<button id="nextSmall" onclick="goToPrompt(nextPrompt);" class="small-button"></button>
			</span>
			<canvas id="analyser"></canvas>
		</div>
		<div id="prompt">
			Loading prompts...
		</div>
		<div id="controls">
			<audio id="recordedWav">Replay</audio>
			<button id="replayButton" onclick="playPrevious();" class="play-button" disabled="true">Replay</button>
			<button id="recordButton" onclick="toggleRecording(this);" class="record-button">Record</button>
			<button id="nextButton" onclick="goToPrompt(nextPrompt);">Next</button>
			<button id="submitButton" onclick="onSubmit();">Submit</button>
		</div>
</div>
</body>
<?php } ?>
</html>