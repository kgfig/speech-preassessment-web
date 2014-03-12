<?php

define('WP_USE_THEMES', false);
require('../wp-blog-header.php');

if (isset($_POST["question_id"]) && isset($_FILES["wavfile"])) {
	$question_id = $_POST["question_id"];
	$tmp_name = $_FILES["wavfile"]["tmp_name"];
	
	if ($question_id < 10) {
		$question_id = "0" . $question_id;
	}
	
	$user_id = $current_user->user_nicename;
	$target_dir = "uploads/". $user_id . "/" ;
	$target_name = $target_dir . $user_id . "_" . $question_id . ".wav";
	
	if (!is_dir($target_dir)) {
		mkdir($target_dir);
	}
	
	rename($tmp_name, $target_name);
	//chmod($target_name,0755);
	
	echo "Complete!";
} else {
	echo "Failed!";
}
?>