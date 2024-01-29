var note_tool =
{
	note_id : false,
	hp_ids : [],
	load:function()
	{
		let params = new URL(window.location.href).searchParams;
		if (params.get("note_id") !== "null")  { this.note_id = parseInt(params.get("note_id"));  }		
		this.hp_ids = [];
		var hp_id_string  = localStorage.getItem('hp_id');
		if (hp_id_string !== null) {	
			this.hp_ids = JSON.parse(hp_id_string); 
	
		} 
	},
	log:function(x)
	{
		console.log('nt - ' + x);	
	},
	tw:function(text, fontProp)
	{
		//https://stackoverflow.com/questions/6406843/detect-if-text-has-overflowed#6406886
	    var tag = document.createElement('div')
	    tag.style.position = 'absolute'
	    tag.style.left = '-99in'
	    tag.style.whiteSpace = 'nowrap'
	    tag.style.font = fontProp
	    tag.innerHTML = text
	
	    document.body.appendChild(tag)
	    var result = tag.clientWidth
	    document.body.removeChild(tag)
	    return result;
	},
	
	empty:function()
	{
		this.hp_ids = [];
		this.save();	
	},
	reload:function()
	{
		window.location.href = window.location.href.split('?')[0] + "?note_id=" + note_tool.note_id + "&reset="  + new Date().getTime();

	},
	save:function()
	{
			localStorage.setItem('hp_id',JSON.stringify(note_tool.hp_ids));	
	},
	tag_adjust(me)
	{
		var multiply = 1;
		if ($(me).closest('h2').length > 0) {
			multiply = 1.5;
		}	
		return multiply;
	},
	set_correct:function(me,hp_id,answer)
	{
		note_tool.log('marked correct on' + hp_id + ' with answer ' + answer);
		$(me).addClass('correct');
		$('*[hp_id='  + hp_id +  ']').each(function()
		{
			var fixed_answer = answer;
			if ($(this).attr('force') == 'singular') {  fixed_answer = fixed_answer.slice(0,-1); }
			var multiply = note_tool.tag_adjust($(this));

			var ts = note_tool.tw(fixed_answer, 'IM Fell Double Pica 24px')  * multiply;
			note_tool.log(hp_id + ' with ' + ts + ' from multiply ' + multiply );

			if (ts > $(this).innerWidth()) {
				$(this).css('width',ts  + 'px');
    			note_tool.log('overflowing text detected "' + fixed_answer + '" is ' + ts + ' wide and element is ' + $(this).innerWidth() + ' wide  for ' + $(this).parent().html() );
			}
			
			$(this).html(fixed_answer);	
		});
		note_tool.hp_ids[hp_id] = answer;
		note_tool.save();	
	},
	hide:function()
	{
		var title = $(".note_AREA H1")[0].outerHTML;
		if (localStorage.getItem('state_text')) {
			title += "<BR />" + localStorage.getItem('state_text');
		}
		
		$(".note_AREA").attr('status','hidden').html(title);
	},
	focus:function()
	{
			if (localStorage) {
				if (localStorage.getItem('state') == 'test') {
					note_tool.hide();
					return false;
			} 
		}	
	},
	handle_refer:function(me,hp_id)
	{
			if (note_tool.hp_ids[hp_id] !== undefined) { 
				note_tool.log('refer seen as true for ' + hp_id + ' setting correct" ');			
				note_tool.set_correct($(me),hp_id,note_tool.hp_ids[hp_id]);  
				return true;
			}
			$('.refer[hp_id='  + hp_id +  ']').html('&nbsp;')
	},
	make_fillin:function(me)
	{
			var hp_id =  $(me).attr('hp_id');
			$(me).attr('answer', $(me).html().trim());
			var multiply = note_tool.tag_adjust($(me));
			if ($(me).attr('answerlength') === undefined) {  
					$(me).css('width',((parseInt($(me).width()) * multiply) + 5 ) +  "px");

			} else {
				multiply = $(me).attr('answerlength');
					$(me).css('width',((10 * multiply) + 5 ) +  "px");

			}
			
			$('*[hp_id='  + hp_id +  ']').css('width', $(me).width());
			if (!note_tool.handle_refer($(me),hp_id)) {
				$(me).html('<input type="text" class="fillin_INPUT" hp_id="'  + hp_id + '" value="" />');
			}

	},
	make_spoiler:function(me)
	{
		$(me).css('width',$(me).width());
		$(me).attr('content', $(me).html().trim());
		$(me).html('&nbsp;');
		$(me).addClass('spoiler_hide');

		$(me).on('click',
		function(e){ 
			e.preventDefault(); 
			$(this).removeClass('spoiler_hide'); 
			$(this).html($(this).attr('content'));
		});
	},
	make_select:function(me)
	{
				$(me).attr('answer', $(me).html().trim());
				var hp_id =  $(me).attr('hp_id');
				
				
				if (!note_tool.handle_refer($(me),hp_id)) 
				{
				var options = [];
				options.push('<option value="...">...</option>');
				var values = $(me).attr('answers').split(',');
				values.forEach(
					function(item) {
						options.push('<option value="' + item.trim() + '">' + item.trim() + '</option>');		
					} 
				)
				$(me).html('<SELECT class="select_INPUT" hp_id="'  + hp_id + '" value="" >' + options.join('') + '</select>');
			}
	},
	init:function()
	{
		if (localStorage) {
			if (localStorage.getItem('state') == 'test') {
				this.hide();
				return false;
				
			}
		}
		$(".fillin").each(	function(){	note_tool.make_fillin($(this)); 	});
		$('.spoiler').each(	function() { note_tool.make_spoiler($(this)) 	});
		$(".select").each(	function(){	note_tool.make_select($(this)); 	});
		
		
		note_tool.hook();
		
		$(".note_AREA").attr('status','ready');
		$(".note_BAR BUTTON").off('click').on('click',function()
		{
			var action = $(this).attr('action');
			if (action == "reset") {  
				note_tool.empty(); 
				note_tool.reload();
			}
		})
	},
	test_coded_answer(me) {
				var coded_answer = $(me).parent().attr('codedanswer');
				var hp_id =  $(me).parent().attr('hp_id');
				var pretty_answer = $(me).val().toUpperCase().trim();
				console.log(pretty_answer + ' correct = ' + coded_answer +  ' ? given = ' + md5(pretty_answer)) ;
				if (md5(pretty_answer) == coded_answer) {
					note_tool.set_correct($(me).parent(),hp_id,$(me).val())
				} else { $(me).removeClass('correct');  }		
	},
	test_answer:function(e){
				var coded_answer = $(this).parent().attr('codedanswer'); 
				if (coded_answer !== undefined)
				{
						console.log('uses coded answer test');
						note_tool.test_coded_answer($(this));
						return true;
				}
		
				var answer = $(this).parent().attr('answer');
				var hp_id =  $(this).parent().attr('hp_id');

				if ($(this).val().toUpperCase().trim() == answer.toUpperCase()) {
					note_tool.set_correct($(this).parent(),hp_id,answer)
				} else { $(this).removeClass('correct');  }
				
		},
	hook:function()
	{
		$(".select_INPUT , .fillin_INPUT").off('change keyup').on('change keyup',note_tool.test_answer);
	}
	
}


$(document).ready(
function() {

	note_tool.load();
	note_tool.init();
	window.addEventListener('focus',note_tool.focus)

});
	