var my_options = {};

// Saves options to chrome.storage
function save_options() {
  	var vacationDays = $('#vacation-days').multiDatesPicker('value');
	let vacations = JSON.parse("[" + vacationDays + "]");
  	chrome.storage.sync.set({
    	vacations: vacations
  	}, function() {
    	// Update status to let user know options were saved.
    	var status = document.getElementById('status');
    	status.textContent = 'Options saved.';
    	setTimeout(function() {
      	status.textContent = '';
    	}, 750);

		// Send config update to extension
		chrome.runtime.sendMessage({type: "config-changed", config: {vacations: vacations}});
  	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options(callback) {
	// Defaults:
	let vacationDays = [
		/*
		new Date( Date.UTC( 2018,  9 - 1, 18, 0,0,0) ),
		new Date( Date.UTC( 2018,  9 - 1, 19, 0,0,0) ),
		new Date( Date.UTC( 2018,  9 - 1, 23, 0,0,0) ),
		new Date( Date.UTC( 2018,  9 - 1, 24, 0,0,0) ),
		new Date( Date.UTC( 2018,  9 - 1, 30, 0,0,0) ),
		new Date( Date.UTC( 2018, 10 - 1,  1, 0,0,0) ),
		*/
	];
	let vacations = vacationDays.map( date => date.valueOf() );

  	chrome.storage.sync.get(
     	['vacations'],
  		function(items) {
	  		my_options = Object.assign({}, items);

			// Send config update to extension
			chrome.runtime.sendMessage({type: "config-changed", config: {vacations: items.vacations}});

  		  	callback();
  		}
	);

}
document.getElementById('save').addEventListener('click',
   save_options);

function after_options() {
	let mdp = $('#vacation-days');
	mdp.multiDatesPicker({
		addDates: JSON.parse("[" + my_options.vacations + "]"),
		numberOfMonths: 2,
		dateFormat: '@', // Output unix timestamps (ms since 1970)
		onSelect: function() { console.log( $('#vacation-days').multiDatesPicker('value') ); }
	});
}

$( function() {
	restore_options(after_options);
});

