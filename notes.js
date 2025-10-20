const note_tool =
{
	note_id : false,
	hp_ids : [],
	la: [],
	noteArea : false,
	load:function()
	{
		let params = new URL(window.location.href).searchParams;
		if (params.get("note_id") !== "null")  { this.note_id = parseInt(params.get("note_id"));  }		
		this.hp_ids = [];
		var hp_id_string  = localStorage.getItem('note_' + this.note_id);
		if (hp_id_string !== null) {	
			this.hp_ids = JSON.parse(hp_id_string); 
	
		} 
		this.noteArea = document.querySelector('.note_AREA');
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
		let multiply = 1;
		if (me.closest('h2')) {
		    multiply = 1.5;
		}
		return multiply;
	},
	set_correct:function(me,hp_id,answer)
	{
		note_tool.log('marked correct on' + hp_id + ' with answer ' + answer);
		me.classList.add('correct');
		

		document.querySelectorAll(`*[hp_id="${hp_id}"]`).forEach(async (hpi) => 
		{
			let fixed_answer = answer;
			const force = hpi.getAttribute('force');
			if (force == 'singular') {  fixed_answer = fixed_answer.slice(0,-1); }
			if (force == 'plural') {  
				if (fixed_answer.slice(0,-1) != 's') { fixed_answer += 's';}	
			}

			const multiply = note_tool.tag_adjust(hpi);

			const ts = note_tool.tw(fixed_answer, 'IM Fell Double Pica 24px')  * multiply;
			note_tool.log(hp_id + ' with ' + ts + ' from multiply ' + multiply );
			
			const computedStyle = getComputedStyle(hpi);
			const width = parseFloat(computedStyle.width);
			if (ts > width) {
			      hpi.style.width = `${ts}px`;
			      note_tool.log(`overflowing text detected "${fixed_answer}" is ${ts} wide and element is ${hpi.offsetWidth} wide for ${hpi.parentElement.innerHTML}`);
			  }
			  await new Promise(resolve => setTimeout(resolve, 0)); // Wait for DOM/event queue
			  if (hpi.isConnected && document.contains(hpi)) {
		         hpi.innerHTML = fixed_answer;
		     } 
		});
		note_tool.hp_ids[hp_id] = answer;
		note_tool.save();	
	},
	hide:function()
	{
		const title = this.noteArea.querySelector("h1").outerHTML;
		let content = title;
		if (localStorage.getItem('state_text')) {
			content += "<br />" + localStorage.getItem('state_text');
		}
		
		this.noteArea.setAttribute('status', 'hidden');
		this.noteArea.innerHTML = content;
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
	handle_refer:function(me,hp_id)
	{
		if (note_tool.has(hp_id)) { 
			note_tool.log('refer seen as true for ' + hp_id + ' setting correct" ');			
			note_tool.set_correct(me,hp_id,note_tool.hp_ids[hp_id]);  
			return true;
		}
		document.querySelectorAll(`.refer[hp_id="${hp_id}"]`).forEach(r => {
		    r.innerHTML = '&nbsp;';
		});
		return false;
	},
	make_fillin:function(me)
	{
		const hp_id =  me.getAttribute('hp_id');
		const h = me.innerHTML;

		me.setAttribute('answer', h.trim());
		let multiply = note_tool.tag_adjust(me);
		const answerLength = me.getAttribute('answerlength') ?? undefined;
		const meWidth = parseFloat(getComputedStyle(me).width);

		if (answerLength === undefined) {  
			me.style.width  = ((parseInt(meWidth) * multiply) + 5 ) +  "px";
		} else {
			multiply = answerLength;
			me.style.width  = ((10 * multiply) + 5 ) +  "px";
		}
		

		document.querySelectorAll(`*[hp_id="${hp_id}"]`).forEach((hpi) =>  { hpi.style.width = meWidth; } );

		if (!note_tool.handle_refer(me,hp_id)) {
			me.innerHTML = '<input type="text" class="fillin_INPUT" hp_id="'  + hp_id + '" value="" />';
		}

	},
	make_spoiler:function(me)
	{
		me.style.width = 'clamp(100px,'  +  getComputedStyle(me).width + ',100%)';
		me.setAttribute('content', me.innerHTML.trim());
		me.innerHTML = '&nbsp;';
		me.classList.add('spoiler_hide');
		me.addEventListener('click', (e) => {
			const t = e.currentTarget;
			e.preventDefault(); 
			t.classList.remove('spoiler_hide'); 
			t.innerHTML = t.getAttribute('content');
		});
	},
	make_select:function(me)
	{
		me.setAttribute('answer', me.innerHTML.trim());
		const hp_id =  me.getAttribute('hp_id');
		
		if (!note_tool.handle_refer(me,hp_id)) 
		{
			const options = ['<option value="...">...</option>'];
			const values = me.getAttribute('answers').split(',');
			values.forEach(item => {
			        const trimmedItem = item.trim();
			        options.push(`<option value="${trimmedItem}">${trimmedItem}</option>`);
		    });
			me.innerHTML= '<SELECT class="select_INPUT" hp_id="'  + hp_id + '" value="" >' + options.join('') + '</select>';
		}
	},
	init:function()
	{
		try {
			
			document.querySelectorAll('.note_BAR BUTTON').forEach( nbb => {
				nbb.addEventListener('click',(e) =>
			{
				const action = e.currentTarget.getAttribute('action');
				if (action == "reset") {  
					note_tool.empty(); 
					note_tool.reload();
				}
			});});
			
		if (localStorage) {
			if (localStorage.getItem('state') == 'test') {
				this.hide();
				console.log('localStorage test state ... blocking load');
				return false;
				
			}
		}
		document.querySelectorAll('.fillin').forEach((f) => note_tool.make_fillin(f));
		document.querySelectorAll('.spoiler').forEach((s) => note_tool.make_spoiler(s));
		document.querySelectorAll('.select').forEach((s) => note_tool.make_select(s));
		
		note_tool.hook();
		this.noteArea.setAttribute('status','ready');

	  } catch(e) {
		console.log(e);
		alert("something went wrong loading this note. Please contact your instructor!");
	  }
	},
	test_coded_answer(t,tp,hp_id,codedAnswer) {
		const pretty_answer = t.value.toUpperCase().trim();
		console.log(pretty_answer + ' correct = ' + codedAnswer +  ' ? given = ' + md5(pretty_answer)) ;
		if (md5(pretty_answer) == codedAnswer) {
			note_tool.set_correct(tp,hp_id,t.value);
		} else { t.classList.remove('correct');  }		
	},
	test_answer:function(e){
		const t = e.currentTarget;
		const tp =t.parentNode;
		const hp_id =  tp.getAttribute('hp_id');
		const codedAnswer = tp.getAttribute('codedanswer') ?? undefined;; 
		
		if (codedAnswer !== undefined)
		{
				console.log('uses coded answer test');
				note_tool.test_coded_answer(t,tp,hp_id,codedAnswer);
				return true;
		}
		const answer = tp.getAttribute('answer');

		if (t.value.toUpperCase().trim() == answer.toUpperCase()) {
			note_tool.set_correct(tp,hp_id,answer)
		} else { t.classList.remove('correct');  }
				
		},
	hook:function()
	{
		document.querySelectorAll('.select_INPUT, .fillin_INPUT').forEach(element => {
		    ['change', 'keyup'].forEach(event => {
		        element.removeEventListener(event, note_tool.test_answer);
		        element.addEventListener(event, note_tool.test_answer);
		    });
		});	}
	
}

document.addEventListener('DOMContentLoaded', () => {
	console.log('starting notes');
	note_tool.load();
	note_tool.init();
	window.addEventListener('focus',note_tool.focus);
	console.log('notes coded should be loaded');
});