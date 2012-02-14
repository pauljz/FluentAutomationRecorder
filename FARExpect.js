var FARExpect = {
	
	ShowDialog: function() {
		
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
		});
		
	} /* ShowDialog */
	,
	
	Shutdown: function() {
		
		// Destroy the dialog overlay
		$('#far-dialog-holder').remove();
		
		// TODO - Reattach listeners
		
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
		
	}  /* BindActions */
	
};
