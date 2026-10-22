jQuery(function($){
	var s14_slide = $('.s14 .wrap').bxSlider({
		adaptiveHeight:true,
		pagerCustom:'.s14_pager .dep1_wrap'
	});

	$(document).ready(function(){
		var sub_split = current_mid.split('_');
		var a_num = sub_split[1];
		var b_num = sub_split[2];		
		$('#sv .s_nav .dep1_con').eq(b_num - 1).addClass('active');
		$('.gnb > ul > li').eq(a_num - 1).addClass('active').find('li').eq(b_num - 1).addClass('active');
		//console.log(sub_split);
		//console.log(a_num);
		//console.log(b_num);

	});


	$(window).load(function(){
		$('.s14_pager .dep1_wrap').isotope({
			// options
			itemSelector: '.s14_pager .dep1_wrap .dep1_con',
		});
	});
	

});

