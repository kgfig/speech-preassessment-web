<?php
header("Content-type: text/plain");

if (isset($_POST["filename"] && $_FILES["wavfile"])) {
	$target_filename = $_POST["filename"];
	$tmp_filename = $_FILES["wavfile"]["tmp_name"];

	rename($tmp_filename,"uploads/".$target_filename.".wav");
	echo "Uploaded!";
} else {
	echo "Failed!";
}

//chmod("uploads/this.wav",0755);
?>