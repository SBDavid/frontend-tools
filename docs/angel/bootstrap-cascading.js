(function($) {
	$(function() {
		$(document).on('click', function(e) {
			var $target = $(e.target);
			var $pc = $target.parents('.cascading');
			if (!!$pc.length) {
				$target.parent().siblings('.open').andSelf('.open').removeClass('open');
				$target.parent().addClass('open');

				$('.cascading').not($pc).find('.open').andSelf('.open').removeClass('open');
			} else {
				$('.cascading-item.open, .cascading.open').removeClass('open');
			}
		});
	});
})(jQuery);
	