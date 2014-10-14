<?php

	$year = date('Y');
	$month = date('m');
	$rd = rand(10,10);

	echo json_encode(array(
	
		array(
			'id' => 1,
			'title' => "Cours N°".rand(1,100),
			'start' => 'Tue Feb 18 2014 10:10:00 GMT+0100 (CET)',
			'end' => 'Tue Feb 18 2014 10:10:00 GMT+0100 (CET)',
			'prof' =>'Astien'
		)
	
	));

?>
