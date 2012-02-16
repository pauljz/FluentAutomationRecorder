$(document).ready( function() {
	ViewModel = {
		labels: ko.observableArray([]),
		recordings: ko.observableArray([]),
		activeTab: ko.observable('All Recordings'),
		recording: ko.observable({}),
		localStorageUsage: ko.observable(FARDB.GetUsage()),
		settings: {
			uniqueAttributes: ko.observable()
		}
	};

	ko.applyBindings(ViewModel);
	
	ViewModel.LoadRecordingsOnTabChange = ko.dependentObservable( function() {
		// whenever the tab is changed, re-load the recordings
		FARManager.LoadRecordings();
		
		if ( ViewModel.activeTab() == 'Settings' ) {
			FARManager.UpdateSettings();
		}
		
		return ViewModel.activeTab();
	}, ViewModel );
	
	ViewModel.RefreshRecordingDetailsOnSelect = ko.dependentObservable( function() {
		// Resizes the JSON textarea to fit its contents
		
		// First null it out first so the scrollHeight is accurate
		$('#recording-json').height( 0 );
		// Now resize the textarea to the scrollHeight, -12px to account for the padding
		$('#recording-json').height( $('#recording-json')[0].scrollHeight - 12 );
		
		return ViewModel.recording();
	}, ViewModel );

	// Initialise the left hand labels and load the recordings
	ViewModel.labels( FARDB.GetLabels() );	
	FARManager.LoadRecordings();
	
	
	// Now attach non-KO events ...
	
	$('#recording-name').click( function() {
		$('#recording-name').hide();
		$('#recording-name-edit').show();
		$('#recording-name-edit').focus();
	});
	
	$('#recording-name-edit').change( function() {
		
		// Get the edited name and edit the record in the DB
		var name = $(this).val();
		FARDB.Name( ViewModel.recording().Created, name );
		
		// Update the recording in the ViewModel
		var recording = ViewModel.recording();
		recording.Name = name; 
		ViewModel.recording( recording );
		
		// Refresh the recodings in the ViewModel - easier than updating ViewModel.recordings
		FARManager.LoadRecordings();
		
	}).blur( function() {
		$('#recording-name').show();
		$('#recording-name-edit').hide();
	});
	
	$('#recording-json').click( function() {
		$(this).select();
	});
	
	$(window).focus( function() {
		// if the user has left and come back, reload data. 
		ViewModel.labels( FARDB.GetLabels() );	
		FARManager.LoadRecordings();
	});
	
	$('#run-test').click( FARManager.RunTest );
	
});

FARManager = {
	recordingsGetFn: FARDB.GetAll,
	
	LoadRecordings: function() {
		var recordings = FARManager.recordingsGetFn();
		recordings.reverse(); // newest first - TODO make this a settnig
		ViewModel.recordings( recordings );
	},
	
	ListAll: function() {
		FARManager.recordingsGetFn = FARDB.GetAll;
		ViewModel.activeTab('All Recordings');
	},
	
	ListStarred: function() {
		FARManager.recordingsGetFn = FARDB.GetStarred;
		ViewModel.activeTab('Starred');
	},
	
	ListNamed: function() {
		FARManager.recordingsGetFn = function() {
			var all = FARDB.GetAll();
			var named = [];
			for ( i in all ) {
				if ( all[i].Name ) {
					named.push( all[i] );
				}
			}
			return named;
		};
		ViewModel.activeTab('Named');
	},
	
	ListLabel: function(el) {
		var attr = $(el).attr( 'data-tabname' );
		var label = $(el).attr( 'data-labelname' );
		FARManager.recordingsGetFn = function() {
			return FARDB.GetLabel( label );
		};
		ViewModel.activeTab( attr );
	},
	
	ToggleStar: function(event) {
		var el = $(event.currentTarget);
		var id = $( el.parent() ).attr('data-key');
		
		var recordingHolder = FARDB.Get(id);
		if ( recordingHolder.Starred ) {
			FARDB.RemoveStar( id );
		} else {
			FARDB.AddStar( id );
		}
		
		FARManager.LoadRecordings();
	},
	
	RunTest: function(event) {
		
		var steps = JSON.parse( $('#recording-json').val() );
		var data = {
			ShowInterface: false,
			Commands: steps,
			ServiceModeEnabled: true
		};
		
		$.ajax({
			type: "POST",
			contentType: "application/json; charset=utf-8",
			url: "http://localhost:10001/RunTest",
			data: JSON.stringify(data)
		});
	},
	
	UpdateSettings: function() {
		ViewModel.localStorageUsage( FARDB.GetUsage() );
		ViewModel.settings.uniqueAttributes( FARDB.GetSetting('uniqueAttributes').join(',') );
	},
	
	SaveSettings: function() {
		FARDB.SetSetting( 'uniqueAttributes', $('#setting-uniqueAttributes').val().split(',') );
	},
	
	DateFormat: function( ms ) {
		var pad = function(n){return n<10 ? '0'+n : n}
		var date = new Date(ms);
		var dateStr = '';
		dateStr += date.getFullYear();
		dateStr += '-';
		dateStr += pad(date.getMonth()+1);
		dateStr += '-';
		dateStr += pad(date.getDate());
		dateStr += ' ';
		dateStr += pad(date.getHours());
		dateStr += ':';
		dateStr += pad(date.getMinutes());
		dateStr += ':';
		dateStr += pad(date.getSeconds());
		return dateStr;
	}
	
}
