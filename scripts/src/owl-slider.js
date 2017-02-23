$(document).ready(function() {
 
  //Sort random function
  function random(owlSelector){
    owlSelector.children().sort(function(){
        return Math.round(Math.random()) - 0.5;
    }).each(function(){
      $(this).appendTo(owlSelector);
    });
  }
 
  $("#owl-slider").owlCarousel({
    items: 3,
    itemsDesktop : [1199,3],
    itemsDesktopSmall : [949,3],
    itemsTablet : [870, 2],
    itemsTabletSmall : [760, 1],
    itemsMobile : [570, 1],
    pagination: false,
    navigation: true,
    navigationText: [
      "<i class='icon-elem icon-elem--arrow_drop_left'></i>",
      "<i class='icon-elem icon-elem--arrow_drop_right'></i>"
      ],
    beforeInit : function(elem){
      //Parameter elem pointing to $("#owl-slider")
      random(elem);
    }
 
  });
 
});
