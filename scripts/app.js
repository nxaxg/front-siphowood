$(function($){
	$("#button-cotizar").on("modal.complete", function(evento, $modal, response ){
		$modal.find('[data-module="common-form"]').commonForm();
	});
});