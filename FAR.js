var FAR = {
	uniqueAttributes: [],
	hoverTarget: null,
	contextItem: null,
	
	SaveAction: function( action ) {
		
		if ( FARExpect.isOpen ) {
			// Don't track within the Expect Builder
			return;
		}
		
		var send = {
			Name: action.Name,
			Arguments: action
		};
		delete send.Arguments.Name;
		chrome.extension.sendRequest( { Method: 'SaveAction', Action: send } );
	},
	
	Listeners: {
		
		Change: function(event) {
			if ( event.target.tagName == 'TEXTAREA' ) {
				FAR.Listeners.Enter(event);
			} else if ( event.target.tagName == 'SELECT' ) {
				FAR.Listeners.Select(event);
			} else if ( event.target.type == 'text' 
				|| event.target.type == 'password'
				|| event.target.type == 'tel'
				|| event.target.type == 'email'
				|| event.target.type == 'url'
				|| event.target.type == 'number'
				|| event.target.type == 'range'
				|| event.target.type == 'search'
				|| event.target.type == 'color'
				|| event.target.type == 'date'
				|| event.target.type == 'datetime'
				|| event.target.type == 'datetime-local'
				|| event.target.type == 'time'
				|| event.target.type == 'month'
				|| event.target.type == 'week'
			) {
				FAR.Listeners.Enter(event);
			} else if ( event.target.type == 'checkbox' || event.target.type == 'radio'
			) {
				var selector = FAR.GetSelector( event.target );
				FAR.SaveAction({
					Name: 'Click', 
					Selector: selector
				});
			} else if ( event.target.type == 'file' ) {
				// TODO - figure out how this will work
				throw "File recording not yet implemented";
			} else {
				// default is for the browser to render as a text field
				FAR.Listeners.Enter(event);
			}
		},
		
		Select: function(event) {
			var selector = FAR.GetSelector( event.target );
			var value = $( event.target ).val();
			
			var action = {
				Name: 'Select',
				Selector: selector
			};
			
			// TODO - If no value, fall back on text
			
			if ( typeof value == 'object' ) {
				action.Values = value;
			} else {
				action.Value = value;
			}
			
			FAR.SaveAction( action )
		},
		
		Enter: function(event) {
			var selector = FAR.GetSelector( event.target );
			var value = $(event.target).val();
			
			FAR.SaveAction({
				Name: 'Enter', 
				Value: value,
				Selector: selector
			});			
		},
		
		Press: function(event) {
			if ( event.target.tagName == 'TEXTAREA'
				|| event.target.tagName == 'INPUT'
				|| event.target.tagName == 'SELECT'
				|| event.target.tagName == 'OPTION'
			) {
				// Keypress was inside a form element and will be handled via Change
				return true;
			}
			
			FAR.SaveAction({
				Name: 'Type', 
				Value: String.fromCharCode( event.which )
			});
		},
		
		Click: function(event) {
			
			// get a text representation of the button press
			switch (event.which) {
				case 1:
					var whichButton = 'left';
					break;
				case 2:
					var whichButton = 'middle';
					break;
				case 3:
					var whichButton = 'right';
					break;
				default:
					var whichButton = 'other:' + event.which;
			}
			
			if ( whichButton == 'right' ) {
				FAR.contextItem = event.target;
			}
			
			if ( whichButton == 'left' ) {
				// depending on what we're clicking on the behaviour might be a bit different
				
				if ( event.target.tagName == 'TEXTAREA'
					|| event.target.tagName == 'SELECT'
					|| event.target.tagName == 'OPTION'
					|| event.target.tagName == 'LABEL'
					|| ( event.target.tagName == 'INPUT'
						&& event.target.type != 'button'
						&& event.target.type != 'submit'
						&& event.target.type != 'image'
						&& event.target.type != 'reset'
					)
				) {
					// clicking into a textarea/select/input. Let the onchange handler deal with it.
					// Skip <label> clicks too as these theoretically just focus a form field
					
			
					return;
				} else {
					// track a normal click
					var selector = FAR.GetSelector( event.target );
					FAR.SaveAction({
						Name: 'Click', 
						Selector: selector
					});
				}
			}
		},
		
		Hover: function(event) {
			FAR.hoverTarget = event.target;
		},
		
		KeyDown: function(event) {
			// unlike other listeners, this is used internally to trigger
			// some things like Hover and Drag and Drop events
			
			if ( String.fromCharCode( event.which ) == 'H'
				&& event.ctrlKey && event.shiftKey
			) {
				var selector = FAR.GetSelector( FAR.hoverTarget );
				FAR.SaveAction({
					Name: 'Hover', 
					Selector: selector
				});
			}
			
		}
	},
		
	GetSelector: function( target ) {
		$target = $(target);
		
		// don't try to look higher than these root level nodes, or something bizarre
		if ( target.tagName == 'BODY' || target.tagName == 'HTML' || target.tagName == '' ) {
			return target.tagName;
		}
		
		// if it has an ID, use that
		var id = $target.attr('id');
		if ( id ) {
			// shouldn't need the :eq(n) here but worth a check.
			var selector = '#' + id;
			return FAR.ResolveUniqueSelector( selector, target );
		}
		
		// next, check the name field
		var name = $target.attr('name');
		if ( name ) {
			var selector = '[name="'+name+'"]';
			return FAR.ResolveUniqueSelector( selector, target );
		}
		
		// check user-specified unique attributes
		var selector = '';
		for ( var i in FAR.uniqueAttributes ) {
			var attribute = FAR.uniqueAttributes[i];
			var value = $target.attr( attribute );
			if ( value ) {
				selector += '['+attribute+'="'+value+'"]';
			}
		}
		if ( selector !== '' ) {
			return FAR.ResolveUniqueSelector( selector, target );
		}
		
		// for input[type=radio] we should match on [value=]
		if ( typeof target.type !== 'undefined' && target.type == 'radio' ) {
			return selector + '[value="' + target.value +'"]';
		}		
		
		// try the parent selector
		var tagName = target.tagName;
		var parent = $target.parent().get(0);
		if ( parent ) {
			var selector = FAR.GetSelector( parent ) + ' ' + tagName;
			return FAR.ResolveUniqueSelector( selector, target );
		}
		
		return FAR.ResolveUniqueSelector( tagName, target );
	},
	
	ResolveUniqueSelector: function( selector, target ) {
		$nodes = $( selector );
		
		// if the selector is unique, we don't need to :eq it
		if ( $nodes.length == 1 ) {
			return selector;
		}
				
		// iterate over selector and get eq(n)
		for ( n in $nodes ) {
			if ( $nodes[n] == target ) {
				return selector + ':eq('+n+')';
			}
		}
		
		// This codepath shouldn't execute. Means no match was found.
		throw "Selector could not be resolved uniquely.";
		return selector;
	},
	
	Init: function() {
		
		chrome.extension.onRequest.addListener( function( request, sender, sendResponse ) {
				switch( request.Method ) {
					case 'OpenExpectDialog':
						FARExpect.ShowDialog( FAR.GetSelector( FAR.contextItem ) );
						sendResponse({});
					break;
				}
		});
		
		chrome.extension.sendRequest( { Method: 'GetSetting', Setting: 'uniqueAttributes' }, function(response) {
			FAR.uniqueAttributes = response;
		});
		
		$(document).mousedown( FAR.Listeners.Click );
		$(document).keypress( FAR.Listeners.Press );
		$(document).keydown( FAR.Listeners.KeyDown );
		$("body *").live( 'hover', FAR.Listeners.Hover );
		$("input, textarea, select").live( 'change', FAR.Listeners.Change );
	}
	
};

FAR.Init();