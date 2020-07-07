'use strict';

/////////////////////////////////////////////////////////////////

function DayList( props )
{
	this.list = [];

	if( !props ) {
		// This is an empty list. Do no more.
		return;
	}

	/** Convert day names to numbers 0-6, or -1 on error */
	function DayNameToNumber( name )
	{
		if( name === 'Sun' ) { return 0; }
		if( name === 'Mon' ) { return 1; }
		if( name === 'Tue' ) { return 2; }
		if( name === 'Wed' ) { return 3; }
		if( name === 'Thr' ) { return 4; }
		if( name === 'Fri' ) { return 5; }
		if( name === 'Sat' ) { return 6; }
		return -1;
	}

	if( !props.startDate ) { throw "Missing startDate"; }
	if( !props.endDate ) { throw "Missing endDate"; }
	if( !props.weekend ) { throw "Missing weekend"; }
	for( let day in props.weekend ) {
		if( DayNameToNumber( props.weekend[day] ) == -1 ) {
			throw "Invalid day name: '" + day + "'. Expecting one of: [Sun, Mon, Tue, Wed, Thr, Fri, Sat]";
		}
	}

	let weekend = [];
	for( let day in props.weekend ) {
		weekend.push( DayNameToNumber( props.weekend[day] ) );
	}

	/** fill the list with all the days that aren't weekend days */

	this.list = [];
	// Start 1 milliseconds after midnight
	//let startDate = new Date( Date.UTC( 1900 + props.startDate.getYear(), props.startDate.getMonth(), props.startDate.getDate(), 0,0,0,1) );
	let startDate = new Date( Date.UTC( 1900 + props.startDate.getYear(), props.startDate.getMonth(), props.startDate.getDate(), 0,0,0,0) );
	// End 1 milliseconds before midnight
	//let endDate = new Date( Date.UTC( 1900 + props.endDate.getYear(), props.endDate.getMonth(), props.endDate.getDate(), 23,59,59,999) );
	let endDate = new Date( Date.UTC( 1900 + props.endDate.getYear(), props.endDate.getMonth(), props.endDate.getDate(), 0,0,0,0) );

   const millisecondsPerDay = 60 * 60 * 24 * 1000;
	for( var date = startDate; endDate - date > 0; date = new Date( date.valueOf() + millisecondsPerDay )) {
		let day = date.getDay();
		if( weekend.indexOf( day ) != -1 ) {
			continue;
		}
		this.add( date.valueOf() );
	}
}

DayList.prototype.length = function() {
	return this.list.length;
};

DayList.prototype.toJSON = function() {
	return this.list;
};

DayList.prototype.removeDays = function( other ) {
	this.list = this.list.filter( day => (other.list.indexOf( day ) == -1) );
}

DayList.prototype.add = function( date ) {
	var val = new Date(date).valueOf()
   const millisecondsPerDay = 60 * 60 * 24 * 1000;
	this.list.push( val - (val % millisecondsPerDay ) );
}

function loadWorkingDays( props )
{
	return new DayList( props );
}

/////////////////////////////////////////////////////////////////

var mysodexo_planner = {
	'balance': null,
	vacations: null
};

function loadVacationDays()
{
	var vacation = new DayList();
	if( mysodexo_planner.vacations ) {
		mysodexo_planner.vacations.forEach(
			date => vacation.add( date ) );
	}
	return vacation;
}

function onMessage( message, sender, callback )
{
	if( message && message.type && message.type == "config-changed" )
	{
		if( message.vacations )
		{
			mysodexo_planner.vacations = message.vacations;
		}
		console.log("Configuration changed. Updating daily budget");
		keepTryingToScrapeBalance();
	}
}

function endOfMonthDate()
{
	var d = new Date();
	var endOfMonth = new Date(Date.UTC( 1900 + d.getYear(), d.getMonth() + 1, 0, 23,59,59,999));
	return endOfMonth;
}

function workDaysUntilEndOfMonth()
{
	var vacationDays = loadVacationDays();
	var workingDays = loadWorkingDays( {startDate: new Date(), endDate: endOfMonthDate(), weekend: ['Fri', 'Sat']} );
	workingDays.removeDays( vacationDays );
	return workingDays.length();
}

function displayPerDayBudget()
{
	var daily = mysodexo_planner['balance'] / workDaysUntilEndOfMonth();
	var content = mysodexo_planner['balance'] + ", או \u20AA" + daily.toFixed(2) + " ליום";

	// Up to 20200531:
	//var content = "יש לך \u20AA" + mysodexo_planner['balance'] + ", או \u20AA" + daily.toFixed(2) + " ליום";
	//var dest = jQuery( findContainerParent()[0].children[3] );
	
	var dest = jQuery( findContainerParent()[0].children[4] );
	
	dest.text( content );
}

function findContainerParent_before20200530()
{
	return jQuery( ".full-name" ).parent();
}

function scrapeBalance_before20200530()
{
	var welcome_text = findContainerParent().text();

	// First attempt: Look for numbers after the "New Israeli Shekel" sign
	var re = new RegExp( '\u20AA([0-9]+(\.[0-9]+)?)' );
	var matches = re.exec( welcome_text );
	if( matches && matches.length >= 2 )
	{
		return matches[1];
	}


	// Second attempt: Look for numbers that look like money:
	//  1-5 digits, optionally followed by ".", followed by 1-2 digits
	var re = new RegExp( /\b([0-9]{1,5}(?:\.[0-9]{1,2}))\b/ );
	var matches = re.exec( welcome_text );
	if( matches && matches.length >= 2 )
	{
		return matches[1];
	}

	return null;
}

function findContainerParent()
{
	return jQuery( ".f-name" ).parent();
}

function scrapeBalance_after20200601()
{
	var welcome_text = findContainerParent().text();

	// First attempt: Look for numbers after the "New Israeli Shekel" sign
	var re = new RegExp( '\u20AA([0-9]+(\.[0-9]+)?)' );
	var matches = re.exec( welcome_text );
	if( matches && matches.length >= 2 )
	{
		return matches[1];
	}


	// Second attempt: Look for numbers that look like money:
	//  1-5 digits, optionally followed by ".", followed by 1-2 digits
	var re = new RegExp( /\b([0-9]{1,5}(?:\.[0-9]{1,2}))\b/ );
	var matches = re.exec( welcome_text );
	if( matches && matches.length >= 2 )
	{
		return matches[1];
	}

	return null;
}

function scrapeBalance()
{
	var balance = scrapeBalance_after20200601();
	
	// For users who haven't rolled over to the new version, use the old version
	// scraping
	if( balance == null )
	{
		balance = scrapeBalance_before20200530();
	}
	
	return balance;
}


function keepTryingToScrapeBalance()
{
	var balance = scrapeBalance();
	if( balance )
	{
		console.log( "Balance found: " + balance );
		mysodexo_planner['balance'] = balance;
		displayPerDayBudget();
		
		init_mutation_observer();
	}
	else
	{
		console.log(" Balance not found, waiting...");
		window.setTimeout( keepTryingToScrapeBalance, 1000 );
	}
}

var observer = null;
var balance_regex = new RegExp( /\b([0-9]{1,5}(?:\.[0-9]{1,2}))\b/ );
	

function disconnect_mutation_observer()
{
	if( observer )
	{
		observer.disconnect();
		observer = null;
	}
}

function init_mutation_observer()
{
	var dom_container = findContainerParent();
	if( dom_container == null )
	{
		return false;
	}
	dom_container = dom_container[0];

	const mutationConfig = { attributes: false, childList: true, subtree: true, characterData: false,
    	characterDataOldValue: false};

	var onMutate = function(mutationsList) {
    	mutationsList.forEach(mutation => {
			if( mutation.type != "childList" )
			{
				return;
			}
			mutation.addedNodes.forEach(newNode => {
				if( newNode.nodeType == Node.TEXT_NODE )
				{
					var matches = balance_regex.exec( newNode.nodeValue );
					if( matches && matches.length >= 1 )
					{
						mysodexo_planner['balance'] = matches[0];
						
						disconnect_mutation_observer();
						displayPerDayBudget();
						init_mutation_observer();
					}
				}
			});
    	});
	};
	
	observer = new MutationObserver(onMutate);
	observer.observe(dom_container, mutationConfig);	
}


function onload()
{
  	chrome.storage.sync.get({
     	vacations: [] // TODO: add defaults
  	}, function(items) {
		mysodexo_planner.vacations = items.vacations;
		setTimeout( keepTryingToScrapeBalance, 250 );
  	});
}


jQuery(document).ready(function() {
      onload();
		chrome.runtime.onMessage.addListener( onMessage );
});

