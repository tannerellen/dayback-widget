// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: calendar;

//
// Configuration ------------>
//

const userToken = '';

const bookmarkID = ''; // The DayBack bookmark ID used to filter events

const hourThresholdForNextDay = 19; // The hour to switch to the next day, a number 0 - 23

const maxLines = 3; // How many vertical lines of data are allowed to display

const refreshInterval = 60; // How many minutes between widget data updates

const allDayOnTop = true; // Sort all day events to the top

const showPastEvents = false; // Show events that have already ended

const widgetColor = '#171717'; // Hex color for widget background (use dark colors)

const translations = {
	// Change the term on the right side to translate
	'Today': 'Today',
	'Tomorrow': 'Tomorrow',
	'more': 'more',
	'No events scheduled': 'No events scheduled',
	'No events remaining': 'No events remaining',
}

//
// End Configuration <--------------
//


// You shouldn't need to edit below this line
// =============================================
//

const now = new Date();

// Get tomorrows date
let tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);

// Determine if tomorrow or today should be used
const showTomorrow = now.getHours() >= hourThresholdForNextDay ? true : false;
const useDate = showTomorrow ? tomorrow : now;

// Build date string to use for query
const year = useDate.toLocaleString('default', {year: 'numeric'});
const month = useDate.toLocaleString('default', {month: '2-digit'});
const day = useDate.toLocaleString('default', {day: '2-digit'});

const viewDate = year + '-' + month + '-' + day;

const url = 'https://app.dayback.com?userToken=' + userToken + '/#/?date=' + viewDate + '&bookmarkID=' + bookmarkID;

const webview = new WebView();
await webview.loadURL(url);

const widget = new ListWidget();
widget.setPadding(0, 0, 0, 0);
widget.url = url; // Where to go when the widget is clicked
widget.backgroundColor  = new Color(widgetColor);


// Set refresh date to one hour from now
let refreshDate = new Date(now);
// Add refresh interval
refreshDate.setMinutes(now.getMinutes() + refreshInterval);

// Refresh at the hour exactly if we are close to a threshold
if ((now.getHours() <= 23 && refreshDate.getHours() >= 0) || (thresholdForNextDay !== 0 && now.getHours() < hourThresholdForNextDay && refreshDate.getHours() >= hourThresholdForNextDay)) {
	refreshDate.setHours(now.getHours() + 1); // Set to the next hour from now
	refreshDate.setMinutes(0, 0, 0); // Set minutes, seconds and miliseconds to zero
}

const script = 'window.agendaCheck = function(callback) {callback()}; "load";'; // The load string is set because the evaluate javascript function needs some type of content set 

let eventsPayload = await webview.evaluateJavaScript(script, true);

//webview.present();


// Create main parent stack
const widgetStack = widget.addStack();
widgetStack.layoutHorizontally();
widgetStack.setPadding(0, 0, 0, 0);

// Create content stack to hold vertical data
const contentStack = widgetStack.addStack();
contentStack.layoutVertically();
contentStack.setPadding(20, 20, 20, 20); 


buildWidget(eventsPayload);

log(refreshDate);

// Set next widget refresh date / This may be updated when building the widget
widget.refreshAfterDate = refreshDate;

Script.setWidget(widget);
Script.complete();

// Won't show when using as widget
if (config.runsInApp) {
	widget.presentLarge();
}

return eventsPayload;


function buildWidget(eventsPayload) {
	const events = JSON.parse(eventsPayload).sort(compare);
	let linesShown = 0;
	let refreshDateUpdated;
  
	setWidgetHeader();
  
	for (let i = 0; i < events.length; i++) {
		const endDate = new Date(events[i].end);
    	if (!showPastEvents && !events[i].allDay && sortTimes(now, endDate) > 0) {
			// Don't show events that have already happened
    		continue;
		}
  		if (linesShown < maxLines) {
    		setWidgetEntry(events[i]);
    		linesShown++;
    	
    		if (!refreshDateUpdated && !events[i].allDay && sortTimes(refreshDate, endDate) > 0) {
				refreshDateUpdated = true;
    			refreshDate = endDate;
    		} 
  		}
  		else {
    		setWidgetFooter(translations['more'] + '...');
    		break;
    	}
	}

	if (!linesShown) {
		setNoEvents();	
	}
}

// Widget building functions

function setNoEvents() {
	const noEventsText = showTomorrow ? translations['No events scheduled'] : translations['No events remaining'];
	const stack = contentStack.addStack();
	stack.layoutVertically();
	stack.setPadding(0, 0, 0, 0);
	stack.borderWidth = 0;
	const txt = stack.addText(noEventsText);
	txt.textColor = Color.gray();
	txt.font = Font.systemFont(16);

	contentStack.addSpacer(10);
}

function setWidgetHeader() {
  	const headerText = showTomorrow ? translations['Tomorrow'] : translations['Today'];
	const stack = contentStack.addStack();
	stack.layoutHorizontally();
	stack.setPadding(0, 0, 0, 0);
	stack.borderWidth = 0;
	const txt = stack.addText(headerText);
	txt.textColor = Color.orange();
	txt.font = Font.systemFont(24);

	stack.addSpacer();

	const calendarIcon = showTomorrow ? SFSymbol.named('calendar.circle') : SFSymbol.named('clock');
	//calendarIcon.applyFont(Font.systemFont(24)); // Doesn't appear to be needed, at least not at the current size
	const calendarImg = stack.addImage(calendarIcon.image);
	calendarImg.tintColor = Color.orange();
	calendarImg.imageSize = new Size(30, 30);

	contentStack.addSpacer(10);
	
}

function setWidgetFooter(footerText) {
	const stack = contentStack.addStack();
	stack.layoutVertically();
	stack.setPadding(0, 0, 0, 0);
	stack.borderWidth = 0;
	const txt = stack.addText(footerText);
	txt.textColor = Color.gray();
	txt.font = Font.systemFont(14);
	
}

function setWidgetEntry(event) {
	const stack = contentStack.addStack();
	stack.layoutVertically();
	stack.setPadding(0, 0, 0, 0);
	stack.borderWidth = 0;

	const rowStack = stack.addStack();
	rowStack.layoutHorizontally();
	rowStack.setPadding(0, 0, 0, 0);
	rowStack.borderWidth = 0;

	// Convert original event color rgb or hex string to scriptable color
	const color = rgbStringToHex(event.color);
	const indicatorColor = new Color(color);  

	// Event color indicator
	const indicator = rowStack.addText('| ');
	indicator.textColor = indicatorColor;
	indicator.font = Font.heavyRoundedSystemFont(14);
	
	// Time
	const time = rowStack.addText(event.timeDisplay);
	time.lineLimit = 1;
	time.textColor = Color.white();
	time.font = Font.systemFont(14);

	// Title
	const txt = rowStack.addText(event.title);
	txt.lineLimit = 1;
	txt.textColor = Color.lightGray();
	txt.font = Font.systemFont(14);
	
	contentStack.addSpacer(6);
}

// Utility functions

function sortTimes(timeA, timeB) {
	return timeA.getTime() - timeB.getTime();
}

function rgbStringToHex(rgbString) {
	const regExp = /\(([^)]+)\)/;
	const matches = regExp.exec(rgbString);
	if (!matches || !matches[1]) {
		return rgbString;
	}
	let rgbValues = matches[1].split(',');
	
	return rgbToHex(rgbValues[0], rgbValues[1], rgbValues[2]);

}

function rgbToHex(r, g, b) {
    var rgb = (r << 16) | (g << 8) | b
    // return '#' + rgb.toString(16) // #80c0
    // return '#' + (0x1000000 + rgb).toString(16).slice(1) // #0080c0
    // or use [padStart](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart)
    return '#' + rgb.toString(16).padStart(6, 0)  
}

function compare(a,b) {
  	if (!a || !b) {
    	return;
  	}
  	
  	if (!allDayOnTop) {
    	// Put all day events on the bottom of the list
  		return Number(a.allDay) - Number(b.allDay) || a.sort - b.sort;
  	}
  	else {
    	// Put all day events on the top of the list
		return a.sort - b.sort || Number(a.allDay) - Number(b.allDay);
	}
}