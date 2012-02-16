var FARExpect = {
	
	isOpen: false,
	
	ShowDialog: function(selector) {
		selector = typeof selector === 'undefined' ? '' : selector;
		
		FARExpect.isOpen = true;
		
		// Create dialog overlay holder, background
		$('<div>').attr('id','far-dialog-holder')
			.appendTo('body');
		
		$('<div>').attr('id','far-dialog-background')
			.appendTo('#far-dialog-holder');
		
		$('<div>').attr('id','far-dialog')
			.appendTo('#far-dialog-holder');
		
		// Populate via HTML so we don't have to build all the HTML in jQuery
		$.ajax({ 
			url: chrome.extension.getURL( '/expect-dialog.html' ),
			cache: false,
			dataType: 'html'
		}).success( function(data) {
			$('#far-dialog').html( data ).ready( FARExpect.BindActions );
			$('#far-dialog input[name=far-expect-selector]').val(selector);
			$('#far-dialog input[name=far-expect-url]').val(window.location.href);
		});
		
	} /* ShowDialog */
	,
	
	Save: function() {
		
		var type = $('#far-dialog [name=far-expect-type]').val();
		var text = $('#far-dialog [name=far-expect-text]').val();
		var count = $('#far-dialog [name=far-expect-count]').val();
		var selector = $('#far-dialog [name=far-expect-selector]').val();
		var url = $('#far-dialog [name=far-expect-url]').val();
		
		var action = {
			Name: 'Expect' + type,
			Selector: selector
		};
		
		if ( type == 'Class' || type == 'Text' || type == 'Value' ) {
			action.Value = text;
		} else if ( type == 'Count' ) {
			 action.Value = count;
		} else if ( type == 'Alert' ) {
			action.Text = text;
			delete action.Selector;
		} else if ( type == 'Url' ) {
			action.URL = url;
			delete action.Selector;
		}
		
		FARExpect.Shutdown();
		FAR.SaveAction(action);
		
	} /* Save */
	,
	
	Shutdown: function() {
		$('#far-dialog-holder').remove();
		FARExpect.isOpen = false;
	} /* Shutdown */
	,
	
	BindActions: function() {
		
		// Show/hide form elements depending on expect type
		var redraw = function() {
			$( '[data-farmode]' ).hide();
			$( '[data-farmode*=' + $('#far-expect-type').val() + ']' ).show();
		};
		$('#far-expect-type').change( redraw );
		redraw(); // Do it now to set the form up properly
		
		// Close the form when you cancel.
		$('#far-dialog .far-cancel').click( FARExpect.Shutdown );
		$('#far-dialog .far-submit').click( FARExpect.Save );
		
	}  /* BindActions */
	
};
