var play = function () { console.log("sound engine not loaded") }
new function (){
	var sounds = {};
	var audio;
	window.addEventListener('load', init, false)
	function init() {
	  try {
	    // Fix up for prefixing
	    window.AudioContext = window.AudioContext||window.webkitAudioContext
	    audio = new AudioContext()
	    loadSound("TheLibrarybyMTC_Robo_LaserBlast_Medium_027.webm", "shoot") //shot
		loadSound("explosion_large_no_tail_03.webm", "playerExplode") //exp
	    loadSound("Robot_Footstep_Single_v2_01.webm", "pickup") //pickup???
	    loadSound("Selection_Ukelele chord 04.webm", "score") //significant event
	    loadSound("Metal_Hit_Crash_199.webm", "playerHit")
	    loadSound("bullet_impact_concrete_brick_01.webm", "hitPrize")
	    loadSound("punch_general_body_impact_03.webm", "hitRock")
	    loadSound("TECH WEAPON Gun Shot Phaser Down 02.webm", "respawn")

		var gainNode = audio.createGain()
		gainNode.connect(audio.destination)
		gainNode.gain.value = 0.04

	    play = function (name){
	      if (!sounds[name]) {
	      	console.log("sound " + name + " does not exist")
	      	return
	      }
          var source = audio.createBufferSource();
		  source.buffer = sounds[name];                 
		  source.connect(gainNode);
		  source.start(0);    
		}
	  }
	  catch(e) {
	    alert('Web Audio API is not supported in this browser')
	  }
	}

	function onError(e) {
		console.log(e)
	}

	function loadSound(url, name) {
	  var request = new XMLHttpRequest()
	  request.open('GET', url, true)
	  request.responseType = 'arraybuffer'

	  // Decode asynchronously
	  request.onload = function() {
	    audio.decodeAudioData(request.response, function(buffer) {
	      sounds[name] = buffer
	    }, onError)
	  }
	  request.send()
	}
}()