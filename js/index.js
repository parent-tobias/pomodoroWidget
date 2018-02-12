/******
 * PomodoroTimerWidget()
 *  There is little interation with this widget, as it contains two functions:
 *  - .__init() will create all the DOM components, sub-widgets, and handle the
 *              event listeners.
 *  - .getHtml() will simply return that DOM structure, with everything in place
 *              and working together.
 *
 *  This is, more than anything, a working example of how to build a complex
 *    'widget' from a collection of 'sub-widgets'. There are a few moving parts
 *    to this: the plus/minus components and the timer component. They are fairly
 *    complex, but they are also complete in themselves. By this, I mean that we
 *    could take the ./widgets/timer/widget.js, include that into a new HTML page,
 *    instantiate it, and it will function in isolation. The plus/minus pieces too:
 *    the ./widgets/plus-minus/widget.js can be pulled into a page, instantiated,
 *    and dropped into the DOM as-is. With both, you'd have to set up listeners, but
 *    they were designed in isolation. It is only through the PomodoroTimerWidget that
 *    they talk to each other. It functions as a manager, taking signals from each sub
 *    component and acting on them appropriately.
 *
 *  Every bit of this, and each sub-widget, does depend on jQuery. It could have all been
 *    done with straight vanilla javascript, but it was more a 'proof-of-concept'.
 *
 *  The TimerWidget has no other dependencies, other than its own widget.css file. It
 *    has a number of events it will emit. All events include a 'tickTime' on the event object:
 *    - timer:start
 *    - timer:pause
 *    - timer:tick
 *    - timer:complete
 *    ...and we can listen to, and act on, each of these. The timer also has a few functions
 *    we can call:
 *    .getHtml() <-- to display the DOM node associated with the TimerWidget
 *    .getTime() <-- to get the current time of the TimerWidget
 *    .setTime() <-- to set the current time of the TimerWidget
 *    .clearTimer() <-- to stop and reset the clock to zero.
 *  On initializing the TimerWidget, it can be passed an id attribute, to set the DOM node's
 *    id attribute.
 *
 *  The PlusMinusWidget depends on fontAwesome, as it uses that for the left/right arrows. It
 *    has two events that it emits, with a custom 'step' property on the event object:
 *    - plusMinus:increment
 *    - plusMinus:decrement
 *    ... and we can listen to those as well. For our purposes, we listen for an increment or
 *    decrement, and use that to tell the TimerWidget to update its time at the given step. The
 *    PlusMinusWidget contains a single function, .getHtml(), in keeping with the others.
 *  On initializing the PlusMinusWidget, it can be passed an id and a step. The id functions as
 *    above, setting the DOM node's id. The step is what will be returned when the plusMinus events
 *    are triggered. This will allow for multiple instances of the PlusMinusWidget, each of which
 *    can be handled independently.
 *
 *****/

var PomodoroTimerWidget = function(properties){
  // Create the collection of pasta type/pasta time options
  this.timePair = {
      pappardelle: "7:00",
      penne: "10:00",
      farfalle: "11:00",
      bucatini: "8:00",
      angelhair: "4:00",
      gnocchi: "1:00",
      orecchiette: "10:00",
      justboiledeggs: "3:45",
    };
  /****
   * This is the actual DOM component we'll create on the fly for the pomodoro timer.
   *  Note that it only creates placeholders for the PlusMinusWidgets and the TimerWidget,
   *  it does not actually implement them!
   ****/
  this.domEl = $(`<div class="pomodoro-timer-widget">
      <h1>Pomodoro clock</h1>
      <div class="grid">
        <div class="box food">Set the timer for
          <select class="pasta-select">
            <option>I meant, pasta</option>
            <option>Pappardelle</option>
            <option>Penne</option>
            <option>Farfalle</option>
            <option>Bucatini</option>
            <option>Angel Hair</option>
            <option>Gnocchi</option>
            <option>Orecchiette</option>
            <option>Just boiled eggs</option>
            <option>Take me to Seamless already</option>
          </select>
        </div>
        <div class="box settimer">
        </div>
        <div class="box instructions">
          <p>Select a pasta, above, then click the timer to start. Click it again to pause. Add or remove time at any point using the ajusters at right.</p>
        </div>
        <div class="box clock"></div>
      </div>
    </div>`);
  // __init() is where we set up the initial state of the Pomodoro timer.
  this.__init(properties); 
}; //end PomodoroTimerWidget()

/****
 * All the custom functionality of the PomodoroTimerWidget itself happens here.
 *  The way its been written, this doesn't know much about the TimerWidget or the
 *  PlusMinusWidget, other than events and functions.
 ****/
$.extend(PomodoroTimerWidget.prototype, {
  // __init() is where we create sub-widgets, start our listeners, and call some of
  //   the sub-widget functions to get them started.
  __init: function(properties){
    // ugly hack to prevent losing context of this in inner funcs.
    var that = this;
    var domEl = this.domEl;
    var id = properties.id || "";
    this.timerPaused = true;
    
    // References to the three parts we need to listen to, or act on.
    //  - pastaSelect is the select el, we will need to listen for changes here.
    //  - adjustTimers is the PlusMinusWidget container, we'll listen here as well.
    //  - displayTimer is the TimerWidget container. We will be both listening and
    //    calling functions on stuff in here.
    var pastaSelect = domEl.find(".pasta-select");
    var adjustTimers = domEl.find(".settimer");
    var displayTimer = domEl.find(".clock");
    
    // Create the widgets themselves that we'll be using in the above containers.
    var plusMinusThirtyEl = new PlusMinusWidget({id: "thirty-seconds", step: 30});
    var plusMinusSixtyEl = new PlusMinusWidget({id: "sixty-seconds", step: 60});
    var displayTimerEl = new TimerWidget({id: "my-timer-widget"});
    
    // Each of my widgets have a function getHtml(), which is how we can display them.
    //  We'll use that .getHtml() in each of the containers to bring in the DOM.
    adjustTimers.append(plusMinusThirtyEl.getHtml(), plusMinusSixtyEl.getHtml());
    displayTimer.append(displayTimerEl.getHtml());
    
    /****
     * LISTENERS! There are a number of listeners in play here. Basically, the main
     *  app doesn't control the sub-widgets, they are totally autonomous. But the main
     *  app can listen for events on various parts, and call functions on the various
     *  sub-widgets if needed.
     ****/
    
    // PlusMinusWidgets have two events: plusMinus:increment and plusMinus:decrement
    //  Both return a property called 'step' on the event, which we can use here.
    adjustTimers.on("plusMinus:increment", function(event){
      
      // get the time from the TimerWidget, which is passed as MM:SS
      var currentTimeString = displayTimerEl.getTime().split(":");
      // Split it, parse it back to a number
      var currentTimeVal = Number(currentTimeString[0]*60)+Number(currentTimeString[1]);
      // increment that time by the given step (remember, from the event model above?)
      var adjustedTimeVal = currentTimeVal+Number(event.step);
      // Reverse it back into a string of the format MM:SS
      var min = Math.floor(adjustedTimeVal/60);
      var sec = adjustedTimeVal%60;
      
      // And lastly, tell the TimerWidget to update itself.
      displayTimerEl.setTime(min+":"+sec);
    });
    adjustTimers.on("plusMinus:decrement", function(event){
      // Get the current time from the timer itself
      var currentTimeString = displayTimerEl.getTime().split(":");
      
      // The time is returned as a string: MM:SS, and we want to convert that to a number
      var currentTimeVal = Number(currentTimeString[0]*60)+Number(currentTimeString[1]);
      
      // Decrement the value by the selected step
      var adjustedTimeVal = currentTimeVal-Number(event.step);
      
      // split the number into minutes/seconds
      var min = Math.floor(adjustedTimeVal/60);
        // - note the modulo operator. Use this to get solely the integer remainder of
        //   the division.
      var sec = adjustedTimeVal%60;
      
      // Update the timer to use the new time.
      displayTimerEl.setTime(min+":"+sec);    
    }); //end PlusMinusWidget listener handling
    
    /****
     * We have custom events for the timer piece as well. I've created
     *   triggers for start, pause, tick, and complete so the managing app can cause
     *   actions at each of these points. They all return an event.type and 
     *   event.tickTime, which we can use elsewhere as needed.
     ****/
      // Note that I'm not listening directly to the displayTimerEl, though I could.
      //  Events propagate as normal, bubbling up the DOM chain.
    displayTimer.on("timer:start", function(event){
      console.log("Timer started: "+event.tickTime);
    })
    .on("timer:pause", function(event){
      console.log("Timer paused: "+event.tickTime);
    })
    .on("timer:tick", function(event){
      // We could do something here, if we wished.
    })
    .on("timer:complete", function(event){
      alert("Your Pasta is done!");
    })
    .on("timer:reset", function(event){
      console.log("Timer was reset!"); 
    }); //end TimerWidget listener handling
    
    /****
     * When the select el is changed, I want to update the timer to display the
     *   appropriate time from the timePairs array WAAAAY up the top. If the selected
     *   option is the text for 'seamless', open a new tab and go there. If the
     *   selected option is not in the timePairs array, simply zero the timer.
     ****/
    pastaSelect.on("change", function(){
      // First, clear the timer,and stop the clock.
      displayTimerEl.clearTimer();
      
      // get the value from the timePair array above
      var pastaToUse = $(this).find(":selected").val().replace(/\s+/g,'').toLowerCase();
      var newTime = that.timePair[pastaToUse];
      // If we have a newTime, use it to update the timer
      if(newTime){
        displayTimerEl.setTime(newTime);
      } else {
        // If we don't have a newTime, we are either on the 'send me to seamless' option, or
        //   off the rails somehow. If its seamless, go there. Otherwise, simply zero the clock.
        if(pastaToUse.includes("seamless")) {
          window.open("https://www.seamless.com", "_blank");
        } else {
          displayTimerEl.setTime("00:00");
        }
      }
    }); //end pastaSelect listener handling
  }, //end __init(), widget should be ready to be placed.

  getHtml: function(){
    return this.domEl;
  }
})