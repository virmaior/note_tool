<?php 
namespace NoteTool;
require_once('library.php');


if (!isset($_REQUEST['note_id'])) {
    $user->error_page('This page requires a note_id.');
    exit();
}
$note_id = intval($_REQUEST['note_id']);


$n =  note_page::load_from_note_id($my_db,$note_id);

$n->head($student_id);
$n->body();
$n->tail();


?>