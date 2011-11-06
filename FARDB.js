var RecordingHolder = function(recording) {
	return {
		Created:   (new Date).getTime(),
		Recording: recording,
		Name:      null,
		Starred:   false,
		Labels:    []
	};                      
}

var FARDB = {
	
	Put: function( recording ) {
		var recordingHolder = RecordingHolder(recording);
		
	},
	
	Get: function( id ) {		
		
	},
	
}
