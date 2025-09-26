const note_tool =
{
	note_id : false,
	hp_ids : [],
	la: [],
	load:function()
	{
		let params = new URL(window.location.href).searchParams;
		if (params.get("note_id") !== "null")  { this.note_id = parseInt(params.get("note_id"));  }		
		this.hp_ids = [];
		var hp_id_string  = localStorage.getItem('note_' + this.note_id);
		if (hp_id_string !== null) {	
			this.hp_ids = JSON.parse(hp_id_string); 
	
		} 
	},
	log:function(x)
	{
		note_tool.la.push(x);
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
		localStorage.setItem('note_' + this.note_id,JSON.stringify(note_tool.hp_ids));	
	},
	tag_adjust(me)
	{
		var multiply = 1;
		if ($(me).closest('h2').length > 0) {
			multiply = 1.5;
		}	
		return multiply;
	},
	set_correct:function($me,hp_id,answer)
	{
		note_tool.log('marked correct on' + hp_id + ' with answer ' + answer);
		$me.addClass('correct');
		$('*[hp_id='  + hp_id +  ']').each((idx,hpi) =>
		{
			const $t = $(hpi);
			var fixed_answer = answer;
			if ($t.attr('force') == 'singular') {  fixed_answer = fixed_answer.slice(0,-1); }
			if ($t.attr('force') == 'plural') {  
				if (fixed_answer.slice(0,-1) != 's') { fixed_answer += 's';}	
			}

			const multiply = note_tool.tag_adjust($t);

			var ts = note_tool.tw(fixed_answer, 'IM Fell Double Pica 24px')  * multiply;
			note_tool.log(hp_id + ' with ' + ts + ' from multiply ' + multiply );

			if (ts > $t.innerWidth()) {
				$t.css('width',ts  + 'px');
    			note_tool.log('overflowing text detected "' + fixed_answer + '" is ' + ts + ' wide and element is ' + $t.innerWidth() + ' wide  for ' + $t.parent().html() );
			}
			
			$t.html(fixed_answer);	
		});
		note_tool.hp_ids[hp_id] = answer;
		note_tool.save();	
	},
	hide:function()
	{
		const title = document.querySelector(".note_AREA h1").outerHTML;
		let content = title;
		if (localStorage.getItem('state_text')) {
			content += "<br />" + localStorage.getItem('state_text');
		}
		
		const noteArea = document.querySelector(".note_AREA");
		noteArea.setAttribute('status', 'hidden');
		noteArea.innerHTML = content;
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
	has:function(hp_id)
	{
		const test_item = note_tool.hp_ids[hp_id];
		if (test_item === undefined) { return false; }
		if (test_item == null) { return false; }
		return true;
	},
	handle_refer:function($me,hp_id)
	{
		if (note_tool.has(hp_id)) { 
			note_tool.log('refer seen as true for ' + hp_id + ' setting correct" ');			
			note_tool.set_correct($me,hp_id,note_tool.hp_ids[hp_id]);  
			return true;
		}
		$('.refer[hp_id='  + hp_id +  ']').html('&nbsp;');
		return false;
	},
	make_fillin:function($me)
	{
			const hp_id =  $me.attr('hp_id');
			const h = $me.html();
			$me.attr('answer', h.trim());
			var multiply = note_tool.tag_adjust($me);
			if ($me.attr('answerlength') === undefined) {  
				$me.css('width',((parseInt($me.width()) * multiply) + 5 ) +  "px");
			} else {
				multiply = $me.attr('answerlength');
				$me.css('width',((10 * multiply) + 5 ) +  "px");
			}
			
			$('*[hp_id='  + hp_id +  ']').css('width', $me.width());
			if (!note_tool.handle_refer($me,hp_id)) {
				$me.html('<input type="text" class="fillin_INPUT" hp_id="'  + hp_id + '" value="" />');
			}

	},
	make_spoiler:function($me)
	{
		$me.css('width',$me.width());
		$me.attr('content', $me.html().trim());
		$me.html('&nbsp;');
		$me.addClass('spoiler_hide');
		$me.on('click', (e) => {
			e.preventDefault(); 
			const $t = $(e.currentTarget);
			$t.removeClass('spoiler_hide'); 
			$t.html($t.attr('content'));
		});
	},
	make_select:function($me)
	{
		$me.attr('answer', $me.html().trim());
		const hp_id =  $me.attr('hp_id');
		
		if (!note_tool.handle_refer($me,hp_id)) 
		{
			const options = ['<option value="...">...</option>'];
			const values = $me.attr('answers').split(',');
			values.forEach(item => {
			        const trimmedItem = item.trim();
			        options.push(`<option value="${trimmedItem}">${trimmedItem}</option>`);
		    });
			$me.html('<SELECT class="select_INPUT" hp_id="'  + hp_id + '" value="" >' + options.join('') + '</select>');
		}
	},
	init:function()
	{
		try {
			$(".note_BAR BUTTON").off('click').on('click',(e) =>
			{
				const action = $(e.currentTarget).attr('action');
				if (action == "reset") {  
					note_tool.empty(); 
					note_tool.reload();
				}
			});
			
			
		if (localStorage) {
			if (localStorage.getItem('state') == 'test') {
				this.hide();
				console.log('localStorage test state ... blocking load');
				return false;
				
			}
		}
		$(".fillin").each((idx,f) => note_tool.make_fillin($(f)));
		$('.spoiler').each((idx,s) => note_tool.make_spoiler($(s)));
		$(".select").each((idx,s) => note_tool.make_select($(s)));
		
		
		note_tool.hook();
		
		$(".note_AREA").attr('status','ready');

	  } catch(e) {
		console.log(e);
		alert("something went wrong loading this note. Please contact your instructor!");
	  }
	},
	test_coded_answer(me) {
		const $me = ($me);
		var coded_answer = $me.parent().attr('codedanswer');
		const hp_id =  $me.parent().attr('hp_id');
		var pretty_answer = $me.val().toUpperCase().trim();
		console.log(pretty_answer + ' correct = ' + coded_answer +  ' ? given = ' + md5(pretty_answer)) ;
		if (md5(pretty_answer) == coded_answer) {
			note_tool.set_correct($me.parent(),hp_id,$me.val())
		} else { $me.removeClass('correct');  }		
	},
	test_answer:function(e){
		const $t = $(e.currentTarget);
		const $p = $t.parent();
		var coded_answer = $p.attr('codedanswer'); 
		if (coded_answer !== undefined)
		{
				console.log('uses coded answer test');
				note_tool.test_coded_answer($t);
				return true;
		}

		const answer = $p.attr('answer');
		const hp_id =  $p.attr('hp_id');

		if ($t.val().toUpperCase().trim() == answer.toUpperCase()) {
			note_tool.set_correct($p,hp_id,answer)
		} else { $t.removeClass('correct');  }
				
		},
	hook:function()
	{
		$(".select_INPUT , .fillin_INPUT").off('change keyup').on('change keyup',note_tool.test_answer);
	}
	
}

document.addEventListener('DOMContentLoaded', () => {
	console.log('starting notes');
	note_tool.load();
	note_tool.init();
	window.addEventListener('focus',note_tool.focus);
	console.log('notes coded should be loaded');
});