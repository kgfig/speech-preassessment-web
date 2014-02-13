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
	<script src="js/spin.min.js"></script>
	<script src="js/main.js"></script>
	<title>Speech Pre-assessment</title>
	<style>
	body { 
		background: rgb(250, 250, 250);
		font-size: 200%;
		overflow: hidden;
		height: 90vh;
		color: rgb(45, 45, 45);
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
	
	:disabled {
		color: rgb(200, 200,200);
	}

	
	#controls {
		width: 100%;
		margin: 30px auto;
		text-align: center;
		position: relative;
	}
	
	#prompt {
		height: 40vh;
		width: 60%;
		overflow-y: auto;
		margin: 10px 20%;
		text-align: center;
		position: relative;
		padding: 20px;
		background: #f0f0f0;
		line-height: 50px;
	}
	
	#header {
		height: 15vh;
		width: 62%;
		margin: 10px 20%;
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
	</style>
</head>
<body>
		<div id="loading" align="center">
			Uploading. Please wait.
			<br />
			<br />
			<img src="img/loader.gif" alt="" />
		</div>
		<div id="modal"></div>
		<!--
		<div id="otherControls">
			<button name="prev" onclick="previousPrompt();">&lt;&lt;</button>
			<button name="play" onclick="playCurrent();">((o))</button>
			<button name="nextShort" onclick="nextPrompt();">&gt;&gt;</button>
		</div>
		-->
		<div id="header">
			<span id="counter"></span>
			<canvas id="analyser"></canvas>
		</div>
		<div id="prompt">
			Say this and this and this Say this and this and thisSay this and this and this Say this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and thisSay this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this Say this and this and this
		</div>
		<div id="controls">
			<audio id="recordedWav">Replay</audio>
			<button id="replayButton" onclick="playPrevious();" disabled="true">Replay</button>
			<button id="recordButton" onclick="toggleRecording(this);">Record</button>
			<button id="nextButton" onclick="goToPrompt(nextPrompt);">Next</button>
			<button id="submitButton" onclick="onSubmit();">Submit</button>
		</div>
</div>
</body>
<?php } ?>
</html>