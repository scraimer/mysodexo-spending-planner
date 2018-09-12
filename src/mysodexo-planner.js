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

function loadVacationDays()
{
	// TODO: load from localStorage or an ICS file
	var vacation = new DayList();
	vacation.add( new Date( Date.UTC( 2018,  9 - 1, 18, 0,0,0) ).valueOf() );
	vacation.add( new Date( Date.UTC( 2018,  9 - 1, 19, 0,0,0) ).valueOf() );
	vacation.add( new Date( Date.UTC( 2018,  9 - 1, 23, 0,0,0) ).valueOf() );
	vacation.add( new Date( Date.UTC( 2018,  9 - 1, 24, 0,0,0) ).valueOf() );
	vacation.add( new Date( Date.UTC( 2018,  9 - 1, 30, 0,0,0) ).valueOf() );
	vacation.add( new Date( Date.UTC( 2018, 10 - 1,  1, 0,0,0) ).valueOf() );
	return vacation;
}

function loadWorkingDays( props )
{
	return new DayList( props );
}

/////////////////////////////////////////////////////////////////

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

var mysodexo_planner = {
	'balance': null
};

function displayPerDayBudget()
{
	var daily = mysodexo_planner['balance'] / workDaysUntilEndOfMonth();

	var dest = jQuery( jQuery( ".full-name" ).parent()[0].children[3] );
	//dest.append( " / \u20AA" + daily.toFixed(2) + " \u05DC\u05D9\u05D5\u05DD" );
	dest.text( "יש לך \u20AA" + mysodexo_planner['balance'] + ", או \u20AA" + daily.toFixed(2) + " ליום" );
}

function scrapeBalance()
{
	var welcome_text = jQuery( ".full-name" ).parent().text();

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

function keepTryingToScrapeBalance()
{
	var balance = scrapeBalance();
	if( balance )
	{
		console.log( "Balance found: " + balance );
		mysodexo_planner['balance'] = balance;
		displayPerDayBudget();
	}
	else
	{
		console.log(" Balance not found, waiting...");
		window.setTimeout( keepTryingToScrapeBalance, 1000 );
	}
}

function onload()
{
	console.log("mysodexo-planner.js loaded");
	keepTryingToScrapeBalance();
}


jQuery(document).ready(function() {
      onload();
});

