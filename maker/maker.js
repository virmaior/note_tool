function isValidHTML(html) {
  const parser = new DOMParser();
  html = '<div>' +  html.replaceAll('&nbsp;', ' ').replaceAll('& ','&amp;').trim() + '</div>';
  if (html === '<div></div>') { return true; }
  const doc = parser.parseFromString(html.toLowerCase(), 'text/xml');
  if (doc.documentElement.querySelector('parsererror')) {
	var error_message = doc.documentElement.querySelector('parsererror').innerText.replace('This page contains the following errors:','');
    return error_message.substring(0,error_message.indexOf("Below")).replace('Found errors:','');
  } 
      return true;
}


var nm_tool = 
{
	orphans: [],
	line_finder : /line\s(\d+)/,
	collisions: 0,
	max_id: 0,
	min_id: 0,
	prev_id : 0,
	prev_item : null,
	nis: [],
	iids : [],
	url: '/notes/maker/helper.php',
	context: '[context=nm]',
	ta_width:function()
	{
		var fakeEl = $('<span class="note_test">ABCDE12345</span>').hide().appendTo(document.body);
		var width =  fakeEl.width();
		fakeEl.remove();
		//	console.log('10 characters = ' + width);
		return width;
	},
	new_lines:function(part_id) {
		var me = $('.note_text[part_id=' + part_id + '][side=text]');
		var x = $(me).find('TEXTAREA');
		var lines = x.val().split("\n");	
		var line_width = Math.floor( ( x.width() / nm_tool.ta_width() ) * 10 ); 
		//console.log('calculated as ' + line_width);
		out = [];
		var y = 0;
		for (let i = 0; i < lines.length; i++) {
			out.push( '<div class="row" style="--y:' + y +  '" line="' + (i + 1) +  '" >' + (i + 1).toString().padStart(3,'0') +  '</div>');
			y = y + (Math.ceil((lines[i].length + 1) / line_width));
		}		
		$(me).find('.row_nums').html(out.join(''));
			
	},
	leave_test:function()
	{
		if (nm_tool.changed) {
			return "There are changes. Abandon changes?"; 
		}
		return true;
	},
	refresh_all()
	{
		$('.note_text[side=HTML]').each(function(){ nm_tool.refresh_by_id($(this).attr('part_id')); })
	},	
 	refresh_by_id :function(part_id)
	 {
		$('.note_text[part_id=' + part_id + '][side=HTML]').html($('.note_text[part_id=' +  part_id + '][side=text] TEXTAREA').val());
		$('.note_text[part_id=' + part_id + '][side=text] TEXTAREA').attr('id','ntt_' + part_id);
	//	$(this).on('change', nm_tool.refresh);		
		nm_tool.show_info(part_id);
		nm_tool.new_lines(part_id);

	},
	 edited: function( )
	 {
		$(window).off('beforeunload').on('beforeunload',nm_tool.leave_test);	//add hook to show page change
		var part_id = $(this).attr('part_id');
		nm_tool.refresh_by_id(part_id);
	},
	enable()
	{
		$('.note_text[side=HTML]').find('.fillin , .select').each(function(){
			if ($(this).hasClass('fillin')) 
			{
				note_tool.make_fillin($(this));
			} else if ($(this).hasClass('select')) 
			{
				note_tool.make_select($(this));
			}
			});
			note_tool.hook();
	},
	submit(my_action)
	{
		var note_id = $('.note_AREA').attr('note_id');
		var note_title = $('.note_title[side=text] TEXTAREA').val();
		var message_text =  ' Note #' + note_id + note_title;
		var full = nm_tool.make_full_text();
		$('.body_row , .action_BUTTON , .row').removeClass('HTML_error');
		$('.error_message').remove();
		if (my_action != 'copy-note') {		//allow copy of invalid HTML.
			if (full.errors.length > 0) {
				full.errors.forEach((value, index) =>	{
						console.log(index + ' as ' + value);
						 $('.body_row[part_id=' + index + ']').addClass('HTML_error');
						 
						 
						 var line = nm_tool.line_finder.exec(value)[1];
						 var ln_row = $('.note_text[part_id=' + index + '][side=text] .row_nums .row[line=' + line  + ']');
						 ln_row.addClass('HTML_error').append('<div class="error_message">' + value + '</div>')
				 } 
				);
				$('.action_BUTTON[action=submit]').addClass('HTML_error');
				return false;
			}
		}

		$.ajax({
			  type: "POST",
   			   		url			:	nm_tool.url,
					"fmessage"	:	'submitting' + message_text,
					"smessage"	:	'submitted' + message_text,
			    	"data"		:	{
						'action': my_action,
						'note_title' : note_title,
						'note': full.text,
						'note_id':note_id
					},
				 	success		: 	function(data) {
					$(window).off('beforeunload');
					if (my_action == 'copy-note') {
						 window.location.href = 'maker.php?note_id='  + $('<div>' + data + '</div>').find('.note_tool').attr('note_id'); 
					}
				}
		});
			
	},
	row_info(part_id,me)
	{
				var hp_id = $(me).attr('hp_id');
				if (hp_id < nm_tool.prev_id) {
					$(nm_tool.prev_item).addClass('seq_break');
				}
				nm_tool.prev_id = hp_id;
				nm_tool.prev_item = $(me);
	
				if ($(me).hasClass('select')) {
					var answers = $(me).attr('answers');
					if (answers) {
						if (answers.indexOf($(me).html()) === -1) {
							$(me).addClass('no_answer');
						}
					} else  { $(me).addClass('no_answers');  }
				}
	
				var row = '<td class="hp_TD" hp_id="' + hp_id + '">'  + hp_id + '</td><td>' + $(me).attr('class') + '</td><td>' + $(me).html() + '</td></tr>';
				if (nm_tool.find_hp_id(hp_id)) {
					nm_tool.collisions = nm_tool.collisions + 1;
					$(me).addClass('collide_item');
					nm_tool.nis[part_id].push('<tr class="collided">' +  row);
				} else {
					nm_tool.nis[part_id].push( '<tr>' + row );
				}
				nm_tool.iids[part_id].push(hp_id);
		
	},
	getMax:function(a){
		return Math.max(...a.flat());
	},	
	getMin:function(a){
		return Math.min(...a.flat());
	},		
	find_hp_id(hp_id){
		return nm_tool.iids.flat().includes(hp_id);
	},
	highlight_html(){
		var part_id = $(this).attr('part_id');
		$('.note_text[part_id=' + part_id +  ']').addClass('ni_picked');
		$(this).on('mouseout',function(){ $('.note_text[part_id=' + part_id +  ']').removeClass('ni_picked'); });
	},
	show_info(xpart_id)
	{
		nm_tool.nis[xpart_id] = [];
		nm_tool.iids[xpart_id] = [];
		nm_tool.orphans[xpart_id] = 0;
		nm_tool.collisions =0;

		$('.note_text[side=HTML][part_id=' + xpart_id + ']').each(function(){
			var part_id = $(this).attr('part_id');
			$(this).find('.fillin , .select').removeClass('collide_item').each(function () {nm_tool.row_info(part_id,$(this)); }
			);
			
			
			$(this).find('.refer').removeClass('orphan_item').each(function(){
				var hp_id = $(this).attr('hp_id');
				if (!nm_tool.find_hp_id(hp_id)) {
					nm_tool.orphans[xpart_id] = nm_tool.orphans[xpart_id] + 1;
					nm_tool.nis[xpart_id].push('<tr class="orphaned"><td>' + hp_id + '</td><td>' + $(this).attr('class') + '</td><td>' + this.outerHTML + '</td></tr>'	);
					$(this).addClass('orphan_item');
					$('.note_text[side=text][part_id=' + xpart_id +']').addClass('orphan_item');
				}
	
			});
			$('.note_info[part_id=' + part_id + ']' ).remove();
			if (nm_tool.nis[xpart_id].length === 0)  { nm_tool.nis[xpart_id].push('<tr class="empty_info"><td colspan=3>No Items</td></tr>'); }
			
			$('.note_infos').append('<div class="note_info" style="order:' + part_id + '" part_id="' + part_id +'"><table class="ni_TABLE" part_id="' + xpart_id + '"><tr class="header_TR"><td>Type</td><td>#</td><td>Item</td></tr>' + nm_tool.nis[xpart_id].join('\n') + '</table></div>');
		});
		var pmin = Math.min(...  nm_tool.iids[xpart_id]);
		var pmax = Math.max(... nm_tool.iids[xpart_id]);
		if (pmin == Infinity) { pmin = 0; pmax = 0; }
		$('.body_row[part_id=' + xpart_id + ']').attr('min',pmin).attr('max',pmax);
		
		
		$('.hp_TD').off('click').on('click',function(){
			var hp_id = $(this).attr('hp_id');
		    $([document.documentElement, document.body]).animate({
        scrollTop: $('span[hp_id=' + hp_id + ']').offset().top - 100
    		}, 500);
		});
	


		$('.gi_item[ntype=orphans]').attr('count', nm_tool.orphans.reduce(
			function getSum(total, num) {
  					return total + (num * 1)
			}		
		));
		nm_tool.max_id = nm_tool.getMax(nm_tool.iids);
		nm_tool.min_id = nm_tool.getMin(nm_tool.iids);
		if (nm_tool.min_id == Infinity) { nm_tool.max_id = 0; nm_tool.min_id = 0; }
		$('.gi_item[ntype=max_id]').attr('count',nm_tool.max_id);
		$('.gi_item[ntype=min_id]').attr('count',nm_tool.min_id);
		$('.gi_item[ntype=collisions]').attr('count',nm_tool.collisions);
		
		$('.note_info[part_id=' + xpart_id + ']').off('mouseover').on('mouseover',nm_tool.highlight_html);
		
	},
	fix_title()
	{
		$('.note_title[side=HTML]').text($('.note_title[side=text]').val());	
	},
	make_full_text()
	{
		var f_text = [];
		var errors = [];
		$('.note_text[side=text] TEXTAREA').each(function(){  
			var part_id = $(this).parent().attr('part_id');
			var html_state = isValidHTML($(this).val());
			if (html_state !== true) { 
					if ( typeof html_state !== "undefined" ) {
					errors[part_id] =  html_state;
					}
			} 
			f_text[part_id] =  $(this).val(); 
		});
		console.log(errors);
		return  { text : f_text.join(''),
				  errors : errors }
	},
	split_areas()
	{
		console.log('called split areas');

		var na = $('.note_AREA');
		var full_text = nm_tool.make_full_text().text;
		var parts = full_text.split('<h');
		$('.note_text').remove();
		
		parts.forEach(function(item,index ){
			if (item.length == 0) { return false; }
			
			na.append('<div class="body_row" part_id="' + index + '">' + 
						'<div class="note_text" side="text" part_id="' + index + '" id="ntt_' + index + '"><div class="row_nums">&nbsp;</div>' +
						'<div class="speed_add"><button onclick="nm_tool.add_fillin(this);">Fillin</button>'  +
						'<button onclick="nm_tool.add_refer(this);">Refer</button><input type="number" class="ar_hp" value="" /></div>' + 
						'<textarea>&lt;h' + item +  '</textarea>' + 
						'</div>' +
					   	'<div class="note_text" side="HTML" part_id="' + index + '" id="nth_' + index + '"> [loading]</div>' +
					   '<div>');
			nm_tool.new_lines(index);
		});
	},
	bind()
	{
		$('.note_text[side=text]').off('change , keyup').on('change keyup',nm_tool.edited);
		$('.note_title[side=text]').off('change , keyup').on('change keyup',nm_tool.fix_title);
		$('.action_BUTTON' + nm_tool.context).off('click').on('click',function(e){
			e.preventDefault();
			var action = $(this).attr('action');
			if (action == 'enable' ) { nm_tool.enable(); }
			if (action == 'copy' ) { nm_tool.submit('copy-note'); }
			if (action == 'submit' ) { nm_tool.submit('update-note'); }
			nm_tool.bind();
		});
	},
	first_init()
	{
		nm_tool.split_areas();
		nm_tool.refresh_all();
		nm_tool.bind();
	},
	add_text(me,text)
	{
		
		var mee = $(me).get(0);
		mee.setRangeText(text,mee.selectionStart,mee.selectionEnd,'end');		
	},
	shift_hp_ids(part_id,hp_id)
	{
		console.log('called shift on ' + hp_id + ' added into ' + part_id);
	},
	add_fillin(me)
	{
		var p = $(me).closest('.body_row');
		var part_id = p.attr('part_id');
		var hp_id = parseInt(p.attr('max') *1 ) + 1;
		console.log('P:' + part_id + ' hp ' + hp_id);
		var text  = '<span class="fillin" hp_id="' + hp_id + '"></span>';
		nm_tool.add_text(p.find('.note_text[side=text] TEXTAREA'),text);
		nm_tool.shift_hp_ids(part_id,hp_id);
		nm_tool.refresh_by_id(part_id);
	},
	add_refer(me)
	{

		var p = $(me).closest('.body_row');
		var part_id = p.attr('part_id');

		var hp_id = p.find('.ar_hp').val();
		if (hp_id == 0) { console.log('no hp id'); return false; }
		if ($('*[hp_id=' + hp_id + ']').length == 0) { console.log('that hp_id is not used!'); return false; }		
		var text  = '<span class="refer" hp_id="' + hp_id + '">&nbsp;</span>';
		nm_tool.add_text(p.find('.note_text[side=text] TEXTAREA'),text);
		nm_tool.refresh_by_id(part_id);
	}
}

$(document).ready(function(){
	nm_tool.first_init();
});