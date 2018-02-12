/******
 * Constructor for my plusMinusWidget complex input element.
 *  At this point, it contains two functions:
 *  -- __init() initializes the DOM elements and the event listeners for
 *            the current PlusMinusWidget. The double-underscore is a
 *            lazy attempt at hiding the function.
 *  -- getHtml() returns the DOM content, so we can append that into
 *            the DOM itself.
 *
 * It is designed to be used within a containing element, as i use that
 *    to handle the recalculation event. I don't want the PlusMinusWidgets
 *    to have to be aware of much. Ideally, I would have created a container
 *    complex widget to handle the event listening for the recalculate
 *    event, but this was purely a prototype. More refinement is always
 *    an option.
 ******/
 
var PlusMinusWidget = function(properties){
  // when the new PlusMinusWidget gets created, we
  //  create the DOM node containing everything, and then
  //  we initialize the DOM content and the listeners.
  this.DOMEl = $("<div>").addClass("plusMinusWidget");
  this.__init(properties);
};

$.extend(PlusMinusWidget.prototype, {
  // init() gets called above, when we create the DOM structure and
  //   set up the listeners.
  __init: function(properties){
    // create a reference to the DOMEl. This isn't necessary for creating
    //  the structures, but within the listeners, we can't use 'this.DOMEl'
    //  as the value of 'this' has changed. Thus, we create a reference here.
    var domEl = this.DOMEl;
    // If we don't get an ID, we don't want to error out, so set it to "".
    var id = properties.id || "";
    var step = properties.step || 30;
    
    // The three DOM components that will be part of the PlusMinusWidget
    var decrementHTML = "<div class='decrement icon'><i class='fas fa-caret-left'></i></div>";
    var incrementHTML = "<div class='increment icon'><i class='fas fa-caret-right'></i></div>"
    var mins = Math.floor(step/60);
    var secs = (step%60);
    secs = secs.toString().length == 1 ? "0"+secs : secs;
    var displayValHTML = "<div id='mins'>"+mins+":"+secs+"</div>";
    
    var minusEl = $(decrementHTML);
    var valueEl = $(displayValHTML);
    var plusEl = $(incrementHTML);
    
    // set the ID of the PlusMinusWidget, and insert the DOM els.
    domEl.attr("id", id).append(minusEl, valueEl, plusEl);
    
    /*****
     * Setting up the listeners. There are three events that
     *  are integral to this PlusMinusWidget, and one that is
     *  more external and could be handled elsewhere.
     *  .minusBtn.click
     *  .plusBtn.click
     *  .quantity.change / .quantity.keyup
     *
     *  ... and the external listener is the parent node's
     *      'plusMinus:recalculate', a custom event that we can
     *      monitor and handle.
     *****/
    domEl.on("click", ".decrement", function(){
      // Here, we have to decrement the current timer val.
      domEl.trigger({
        type: "plusMinus:decrement",
        step: step,
      });  
    }).on("click", ".increment", function(){
      domEl.trigger({
        type: "plusMinus:increment",
        step: step,
      });
    });
  },
  getHtml: function(){
    return this.DOMEl;
  }
})
