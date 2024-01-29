<?php
namespace NoteTool;
require_once('../library.php');


note_helper_tool::require_admin();

if (!isset($_REQUEST['action'])) {
    note_helper_tool::error_page('You must set an action to use this page');
}
$action = $_REQUEST['action'];



note_helper_tool::handle_action($action,$_REQUEST);

?>