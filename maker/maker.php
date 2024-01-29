<?php
require_once('../library.php');

$note_id = 0;   if (isset($_REQUEST['note_id'])) {  $note_id = intval($_REQUEST['note_id']); }

$page = new NoteTool\maker_page($note_id,$my_db);
$page->head();
$page->show();
$page->footer();
?>