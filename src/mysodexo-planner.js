// From https://stackoverflow.com/questions/28425132/how-to-calculate-number-of-working-days-between-two-dates-in-javascript-using

function getNumWorkDays(startDate, endDate) {
    var numWorkDays = 0;
    var currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        // Skips Sunday and Saturday
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            numWorkDays++;
        }
        currentDate = currentDate.addDays(1);
    }
    return numWorkDays;
}

// From http://partialclass.blogspot.com/2011/07/calculating-working-days-between-two.html

function workingDaysBetweenDates(startDate, endDate) {
  
    // Validate input
    if (endDate < startDate)
        return 0;
    
    // Calculate days between dates
    var millisecondsPerDay = 86400 * 1000; // Day in milliseconds
    startDate.setHours(0,0,0,1);  // Start just after midnight
    endDate.setHours(23,59,59,999);  // End just before midnight
    var diff = endDate - startDate;  // Milliseconds between datetime objects    
    var days = Math.ceil(diff / millisecondsPerDay);
    
    // Subtract two weekend days for every week in between
    var weeks = Math.floor(days / 7);
    days = days - (weeks * 2);

    // Handle special cases
    var startDay = startDate.getDay();
    var endDay = endDate.getDay();
    
    // Remove weekend not previously removed.   
    if (startDay - endDay > 1)         
        days = days - 2;      
    
    // Remove start day if span starts on Saturday but ends before Friday
    if (startDay == 6 && endDay != 5)
        days = days - 1  
            
    // Remove end day if span ends on Friday but starts after Saturday
    if (endDay == 5 && startDay != 6)
        days = days - 1  
    
    return days;
}

/////////////////////////////////////////////////////////////////

function endOfMonthDate()
{
	var d = new Date();
	var endOfMonth = new Date(1900 + d.getYear(), d.getMonth() + 1, 0);
	endOfMonth.setHours(23,59,59,999);
	return endOfMonth;
}

function workDaysUntilEndOfMonth()
{
	return workingDaysBetweenDates( new Date(), endOfMonthDate() );	
}

var mysodexo_planner = {
	'balance': null
};

function displayPerDayBudget()
{
	var daily = mysodexo_planner['balance'] / workDaysUntilEndOfMonth();
	
	var dest = jQuery( jQuery( ".full-name" ).parent()[0].children[3] );
	dest.append( " / \u20AA" + daily.toFixed(2) + " \u05DC\u05D9\u05D5\u05DD" );
}

function scrapeBalance()
{
	var welcome_text = jQuery( ".full-name" ).parent().text();
	var re = new RegExp( '\u20AA([0-9]+(\.[0-9]+)?)' );
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

