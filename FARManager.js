$(document).ready( function() {
	ViewModel = {
		labels: ko.observableArray([]),
		recordings: ko.observableArray([]),
		activeTab: ko.observable('All Recordings')
	};

	ko.applyBindings(ViewModel);
	
	ViewModel.LoadRecordingsOnTabChange = ko.dependentObservable( function() {
		FARManager.LoadRecordings();
		return ViewModel.activeTab();
	}, ViewModel );

	ViewModel.labels( FARDB.GetLabels() );	
	FARManager.LoadRecordings();
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
