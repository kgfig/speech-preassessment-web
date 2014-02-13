<?php
header("Content-type: text/plain");

if (isset($_POST["question_id"]) && isset($_FILES["wavfile"])) {
	$user_id = "username";
	$question_id = $_POST["question_id"];
	$tmp_name = $_FILES["wavfile"]["tmp_name"];
	$target_name = $user_id . "_" . $question_id . ".wav";
	
	rename($tmp_name,"uploads/".$target_name);
	echo "Uploaded!";
} else {
	echo "Failed!";
}

//chmod("uploads/this.wav",0755);
?>