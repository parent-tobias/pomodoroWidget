/*****
 * TimerWidget()
 *   A standalone timer component, this can be used within other, more complex, components
 *  or by itself.
 *
 *
 *****/
var TimerWidget = function(properties){
  // First, I want to see if we have a content property being passed in.
  //   If so, then we can use that to fill our domEl. This will allow
  //   us to use custom content prior to anything happening.
  var contents = properties.content ? properties.content : "00:00";
  this.domEl = $(`<div class="timerWidget"></div>`).html(contents);
  
  // Initialize the TimerWidget instance.
  this.__init(properties); 
};

$.extend(TimerWidget.prototype, {
  __init: function(properties){
    // ugly hack to prevent losing context of this in inner funcs.
    var that = this;
    var domEl = this.domEl;
    var id = properties.id || "";
    // If we have a custom ID for this instance, we'll use it.
    if(id) domEl.attr("id", id);

    // we have the timerPaused boolean, simply so that we can check
    //  if the timer is paused or not.
    this.timerPaused = true;
    
    // we want to bind the context in the sub-functions, so we can continue
    //  to reference 'this' in them and have it refer to the TimerWidget instance.
    this.startTimer = this.startTimer.bind(this);
    this.pauseTimer = this.pauseTimer.bind(this);
    this.runTimer = this.runTimer.bind(this);
    
    // Listen for a click on the TimerWidget instance. This is only run until
    //  the first click! See the startTimer function to see why.
    domEl.on("click", this.startTimer)
         .on("mouseenter", function(){
            // If we mouse over the timer instance, toggle the display
            var textValue = that.timerPaused ? "Start" : "Pause";
            that.domEl.data("timer", $(this).text() ).text(textValue);
          }).on("mouseleave", function(){
            that.domEl.text($(this).data("timer"));
          });
  },
  
  /***
   * .startTimer() -- function to start the timer. This triggers the timer:start
   *    event, then promptly stops itself from listening. The reason for this is,
   *    at this point, I want a click on the timer to be passed to the pauseTimer
   *    function. In the pauseTimer function, this is reversed: I turn the pauseTimer
   *    handling off, and turn this one back on. Thus, I can't click on the timer
   *    and have the setInterval firing off many many times.
   *
   ***/
  startTimer: function(){
    this.timerPaused = false;
    
    // trigger our custom event, and pass the tickTime to the event object
    this.domEl.trigger({type: "timer:start", tickTime: this.domEl.data("timer") });
    // turn off the startTimer handler, turn ON the pauseTimer handler.
    this.domEl.off("click", this.startTimer)
              .on("click", this.pauseTimer);
    
    // Get the timer instance, and parse the time from MM:SS back to a number
    var domEl = $(this.domEl);
    var timeBits = domEl.data("timer").split(":");
    var minutes = parseInt(timeBits[0]), seconds = parseInt(timeBits[1]);
    this.timerCounter = (minutes*60)+seconds;
    
    // Call runTimer, which will be triggered every second
    this.timerInstance = setInterval(this.runTimer, 1000);
  },
  
  /***
   * .runTimer() -- function that should only be called from startTimer()
   *    It decrements a given timerCounter to zero, and updates the timer
   *    display as appropriate. It also handles the 'timer:tick' and
   *    the 'timer:complete' events.
   ***/
  runTimer: function(){
    var domEl = $(this.domEl);
    // If the clock has not reached zero yet...
    if (this.timerCounter > 0)
    {
      // decrement our timerCounter...
      this.timerCounter = this.timerCounter-1;
      // use the timerCounter to create the MM:SS format the timer displays
      var minutes = Math.floor(this.timerCounter/60),
          seconds = this.timerCounter%60;
      seconds = seconds.toString().length == 1 ? "0"+seconds : seconds;
      
      // Set the data-timer and the text of the timer to the current time
      domEl.data("timer", minutes+":"+seconds)
        .text(minutes+":"+seconds);
      
      // trigger the custom 'timer:tick' event, with the custom event property
      this.domEl.trigger({type: "timer:tick", tickTime: minutes+":"+seconds})
      
      return this.timerCounter;
    } else {
      // We have reached zero, so we want to  stop the clock and trigger the
      //  'timer:complete' event.
      clearInterval(this.timerInstance);
      // The clock has zeroed, so it's paused.
      this.timerPaused = !this.timerPaused;
      this.domEl.trigger({type: "timer:complete", tickTime: "00:00"});
       return;
    }
  },
  
  /***
   * .pauseTimer() -- function to pause the timer. This is only enabled within
   *    the startTimer() handler.
   ***/
  pauseTimer: function(){
    this.timerPaused = true;
    
    // Emit our custom 'timer:pause' event, with the 'tickTime' property on the event object.
    this.domEl.trigger({type: "timer:pause", tickTime: this.domEl.data("timer") });
    // Turn off this handler, turn the startTimer back on for the click event.
    this.domEl.off("click", this.pauseTimer)
              .on("click", this.startTimer);

    // And pause the clock.
    return clearInterval(this.timerInstance);
  },
  /***
   * .clearTimer() -- a utility function to stop the clock, and reset everything.
   *
   ***/
  clearTimer: function(){
    // First, zero the time on the clock, then stop the clock itself.
    this.setTime("00:00");
    clearInterval(this.timerInstance);
    
    // The clock has been zeroed, so it's paused.
    this.timerPaused = true;
    // Turn off the pause handler, turn the startTimer back on for the click event.
    this.domEl.off("click", this.pauseTimer)
              .on("click", this.startTimer);
    // Trigger our custom 'timer:reset. event, with a tickTime on the event object.
    this.domEl.trigger({type: "timer:reset", tickTime: "00:00"});
    return;
  },
  
  
  /***
   * .getTime() -- a utility function that returns the current time remaining
   *    in the MM:SS format.
   ***/
  getTime: function(){
    return this.domEl.data("timer") ? this.domEl.data("timer") : this.domEl.text();

  },
  /***
   * .setTime() -- a utility function that sets the current time remaining
   *    in the MM:SS format.
   *  In order to avoid a crash of sorts, the setTime function pauses the timer,
   *    updates the time, and restarts the timer, but only if the timer is running.
   *    If it isn't, it simply goes ahead and updates the timer.
   ***/
  setTime: function(newTime){
    // This first part is to handle the possibility of MM:S rather than MM:SS
    // I will update the seconds to SS by padding with a zero if needed.
    var timeBits = newTime.split(":");
    if (timeBits[1].toString().length == 1)
      newTime = timeBits[0]+":0"+timeBits[1]
    
    // create a boolean isPaused, as the this.timerPaused boolean will be changing
    //  when we start the clock back up.
    var isPaused = this.timerPaused;
    
    // If the clock is running, pause the timer.
    if(!isPaused)
      this.pauseTimer();
    // Either way, update the time, both on the data-timer attribute and displayed
    this.domEl.data("timer", newTime).text(newTime);
    
    // Again, if the timer is runnning, start the timer back up. It will use the
    //  new time value.
    if(!isPaused)
      this.startTimer();
  },
  
  getHtml: function(){
    return this.domEl;
  }
})