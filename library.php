<?php
namespace NoteToolBase;

define('NOTES_VERSION','20241001G');


class note_base_page
{
    
    function base_url()
    {
        return '/notes/';
    }
    
    function version_url(string $x)
    {
        $fc = '?';
        $base = '';
        if (strpos($x,'?') > -1) {  $fc = '&'; }
        if (strpos($x,'/') != 0) { $base = static::base_url(); }
        
        return $base . $x . $fc . 'v=' . NOTES_VERSION;
    }
    
    function load_js(string $filename, bool $debug = DEBUG_MODE)
    {
        
        echo sprintf('<script src="%1$s"></script>',self::version_url($filename));
    }
    
    
    function load_css(string $filename)
    {
        echo sprintf('<link rel="stylesheet" type="text/css" href="%1$s" />',  self::version_url( $filename)) ;
    }
    
    function head()
    {
        
    }
}

class maker_page extends note_base_page
{
        private $my_db;
        private $note_id;
        
        function test_admin(object $x)
        {
            return true;
        }
        
        function __construct(int $note_id, object $my_db)
        {
            $this->note_id = $note_id;
            $this->my_db = $my_db;
            self::load_note();
        }
        
        function head()
        {
            echo sprintf('<html><head><title>%1$s</title>',$this->title);
            static::load_css(static::base_url() . 'notes.css');
            static::load_css(static::base_url() . 'maker/maker.css');
            
            echo   '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+Double+Pica">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>';
            
            static::load_js(static::base_url() . 'notes.js');
            static::load_js(static::base_url() . 'maker/maker.js');
            static::load_js(static::base_url() . 'md5.js');
            
            echo '</head>';
        }
        
        function context()
        {
            return 'nm';
        }
        
        function load_note() {
            if ($this->note_id == 0) {
                $this->note = new \stdClass();
                $this->note->note_id = 0;
                $this->note->note_title = '';
                $this->note->note_body = ' ... ';
                return false;
            }
            $this->note = $this->my_db->query(sprintf('SELECT * FROM notes WHERE note_id = %1$u',$this->note_id))->fetch_object();
        }
        
        function action_button(string $action)
        {
            return sprintf('<button class="action_BUTTON" context="%1$s" action="%2$s">%3$s</button>',static::context(),$action,ucfirst($action));
        }
        
        function show()
        {
            echo sprintf('<div class="note_tool note_AREA" note_id="%5$u">
                    <div class="title_row"><input class="note_title" side="text" value="%1$s"><div class="note_title" side="HTML">%2$s</div></div>
                    <div class="body_row"><div class="note_text" side="text" part_id="0"><textarea>%3$s</textarea><div class="note_text" side="HTML" part_id="0">%4$s</div></div>
                    </div>',
                htmlentities($this->note->note_title),$this->note->note_title,  htmlentities($this->note->note_body),$this->note->note_body,$this->note->note_id);
            echo sprintf('<div class="general_info">
    <div class="gi_item" ntype="collisions" count="0">Collisions</div>
    <div class="gi_item" ntype="orphans" count="0">Orphans</div>
    <div class="gi_item" ntype="min_id" count="0">Min</div>
    <div class="gi_item" ntype="max_id" count="0">Max</div><div class="gi_LINK"><a href="/notes/notes.php?note_id=%1$u" target="_%1$u">View</a></div>%2$s %3$s %4$s
    </div>', $this->note->note_id, static::action_button('enable'),static::action_button('copy'),static::action_button('submit'));
            echo '<div class="note_infos"  >
        <div class="note_info" part_id="0">&nbsp;</div></div>';
        }


        function footer()
        {
            echo '</body></html>';
        }
}
    


class note_page extends note_base_page
{
    private $title,$body,$date, $my_db;
    private $debug = false;
    public $mode = 'encoded'; // the mode here determines whether or not the fillin and select will be encoded.
    
    
    
    function head($student_id)
    {
        echo sprintf('<html><head><title>%1$s</title>',$this->title);
        static::load_css('notes.css');
        static::load_css('note-view.css');
        
        
        echo   '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+Double+Pica">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>';
        
        static::test($this->my_db,$student_id);
        static::load_js('notes.js');
        static::load_js('md5.js');
        
        echo '</head>';
    }
    
        
    
    function set_my_db($my_db)
    {
        $this->my_db = $my_db;
    }
    
    function load_from_note_id(object $my_db,int $note_id)
    {
        $note_row  = $my_db->query(sprintf('SELECT note_title, note_body , note_date FROM `notes` WHERE note_id = %1$u' , $note_id))->fetch_object();
        $x = new static($note_row->note_title,$note_row->note_body,$note_row->note_date);
        $x->set_my_db($my_db);
        return $x;
    }
    
    function __construct(string $title, string $body, string $date)
    {
        $this->title = $title;
        $this->body = $body;
        $this->date = $date;
    }
    
    
    function author() {
        return 'Anonymous';
    }
    
    
    function block(string $block_message)
    {
        ?><script>
    localStorage.setItem('state','test');
    localStorage.setItem('state_text',$block_message);
</script><?php 
return true;
    }
    
    
    /**
     * if you are using this in your own project, you should extend this test function using custom.php
     * @param \mysqli $my_db
     * @param int $user_id
     * @return boolean
     */
    function test (object $my_db, int $user_id)
    {
        return true;
    }
    
    
    function release()
    {
        ?><script>
    localStorage.removeItem('state');
</script><?php 
return true;
    }
    
    
    function encode_answer(string $x)
    {
        return md5(strtoupper($x));
    }
    
    function process_body()
    {
        $this->mode = 'open';
        if ($this->mode == 'open') { return $this->body; }
        
       $dom = new \DOMDocument('1.0','UTF-16');
       $dom->loadHTML( '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' . $this->body);
       $spans = $dom->getElementsByTagName('span');
       
       $body = $this->body;
       $nodeListLength = $spans->length; // this value will also change
       $hp_ids = array();
       for ($i = 0; $i < $nodeListLength; $i ++)
       {
           $span = $spans->item($i);
           $class= $span->getAttribute('class');
           $hp_id= $span->getAttribute('hp_id');
           $text = $span->ownerDocument->saveXML($span);
           $value = $span->nodeValue;
           
           
           $scrub = false;
           
           if ((strpos($class,'fillin') > -1)) { $scrub = true; }
           if ((strpos($class,'select') > -1)) { $scrub = true; }
           if ($scrub) {
               $span->nodeValue = '';
               if ($value != '') {
                $span->setAttribute('codedanswer',static::encode_answer($value));
                $answer_length = strlen($value);
                $span->setAttribute('answerlength',$answer_length);
                $hp_ids[$hp_id] = $answer_length;
               }
               $new_text = $span->ownerDocument->saveXML($span);
               
               echo sprintf('<div><div>%1$s</div><div>%2$s</div></div>',$text,$new_text);
               
               $body = str_replace($text,$new_text,$body);
           }
           if (strpos($class,'refer') > -1) { 
               $span->setAttribute('answerlength',$hp_ids[$hp_id]);
               
           }
           
       }
       return $body;
    }

    function body()
    {
        echo '<body>';
        echo '<div class="note_BAR"><button action="reset">Reset</button></div>';
        echo sprintf('<div class="note_AREA" status="loading"><h1>%1$s</h1>%2$s</div>',$this->title,static::process_body());
    }
    
    function tail() {
        $nd = new \DateTimeImmutable($this->date);
        
        echo sprintf('<div class="tail_DIV">Copyright ©2022-%1$s -  %2$s "%3$s" (%4$s)</div>',
            date('Y'),
            static::author(),$this->title,$nd->format('M d, Y'));
        
     ?><script>
	    if (localStorage) {
	        localStorage.setItem('viewed_page',window.location.href);
	        localStorage.setItem('viewed_page_time',new Date().toString());
	    }
	    </script><?php 
        echo '</body></html>';
    }
}

class note_helper_tool
{
    static $note_table = 'notes';
    static $my_db = false;
    
    
    function require_admin()
    {
        return true;
    }
    
    function error_page(string $x)
    {
            echo 'Error: ' . $x;
            exit(0);
    }
    
    function handle_action(string $action, array $r)
    {
        if (!static::$my_db) { static::$my_db = new \query_object(); }
        
        switch ($action) {
            case 'update-note':             note_helper_tool::save($r); break;
            case 'copy-note':               $note_id = note_helper_tool::copy_from_request($r); note_helper_tool::note_tool_div($note_id);  break;
            
        }
    }
    
    function query(string $q)
    {
        if (!static::$my_db) { static::$my_db = new \query_object(); }
        static::$my_db->query($q);
    }
    
    function save(array $r)
    {
        static::query(sprintf('REPLACE INTO `%1$s` (note_id , note_title, note_body) VALUES (%2$u , "%3$s" , "%4$s")',
            static::$note_table,intval($r['note_id']),static::$my_db->escape_string($r['note_title']),static::$my_db->escape_string($r['note'])));
    }
    
    function copy_from_request(array $r)
    {
        static::query(sprintf('INSERT INTO `%1$s` ( note_id ,note_title, note_body) VALUES (%2$s , "%3$s" , "%4$s")',
            static::$note_table, 'NULL',static::$my_db->escape_string($r['note_title']),static::$my_db->escape_string($r['note'])));
        return static::$my_db->insert_id();
    }
    
    function copy_from_id( int $note_id)
    {
        static::query(sprintf('INSERT INTO `%1$s` ( note_title, note_body)
                                SELECT note_title, note_body FROM notes WHERE note_id = %2$u',  static::$note_table, $note_id));
    }
    
    function note_tool_div(int $note_id)
    {
        echo sprintf('<div class="note_tool" note_id="%1$u">New Note ID</div>',$note_id);
    }
}


if (file_exists($_SERVER['DOCUMENT_ROOT']. '/library/custom-note-library.php')) {
    require_once($_SERVER['DOCUMENT_ROOT']. '/library/custom-note-library.php');
 
} else {
    $my_db = new \mysqli();
    $student_id = 0;
    echo 'not called ...';
    class_alias('NoteToolBase\note_page','NoteTool\note_page');
    class_alias('NoteToolBase\maker_page','NoteTool\maker_page');
    class_alias('NoteToolBase\note_helper_tool','NoteTool\note_helper_tool');
}

?>
