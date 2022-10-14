/* *****************************************
Name	: dayback-agenda-widget.js
Author	: Tanner Ellen
Version	: 1.0.3
Desc	: An iOS widget to display a daily agenda from DayBack using Scriptable.app
***************************************** */

// ---------------------------------
// Configuration ------------------>
// ---------------------------------

const USER_TOKEN = 'Replace With User Token';  // The DayBack user token used to sign in

const BOOKMARK = 'Replace With Bookmark URL'; // The DayBack bookmark URL or bookmark ID to retrieve events

const HOUR_THRESHOLD_FOR_NEXT_DAY = 19; // The hour to switch to the next day, a number 0 - 23 (7pm default)

const MAX_LINES = 3; // How many vertical lines of data are allowed to display

const REFRESH_INTERVAL = 60; // How many minutes between widget data updates

const ALL_DAY_ON_TOP = true; // Sort all day events to the top

const SHOW_PAST_EVENTS = false; // Show events that have already ended

const NOTIFICATIONS_ENABLED = false; // Set to true to show upcoming event notifications on your device

const NOTIFICATIONS_MINUTES_BEFORE = 5; // How many minutes before event start to trigger notifications

const NOTIFICATIONS_ALL_DAY_HOUR = 8; // The hour to notify for all day events 0 - 23 (since they don't have times)

const COLORS = { // All colors are hex values
	background: '#171717', // Widget background (use dark colors)
	textHeader: '#fe9e0a', // Header text and primary icon color
	textPrimary: '#ffffff', // Primary bright text like the date and time
	textSecondary: '#878787', // Secondary text like the event title
	label: '#5a5a5a', // Labels and background info like the term more
};

const TRANSLATIONS = {
	// Change the term on the right side to translate
	'Today': 'Today',
	'Tomorrow': 'Tomorrow',
	'more': 'more',
	'No events scheduled': 'No events scheduled',
	'No events remaining': 'No events remaining',
};

// ----------------------------------
// End Configuration <---------------
// ----------------------------------


// ------------------------------------------
// You shouldn't need to edit below this line
// ------------------------------------------

const domain = 'https://app.dayback.com';

const now = new Date();

// Get valid bookark id from url or just the ID itself
let bookmarkID = BOOKMARK.split('bookmarkID=');

if (bookmarkID && bookmarkID[1]) {
	bookmarkID = bookmarkID[1];
}
else {
	bookmarkID = bookmarkID[0];
}

// Get tomorrows date
let tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);

// Determine if tomorrow or today should be used
const showTomorrow = now.getHours() >= HOUR_THRESHOLD_FOR_NEXT_DAY ? true : false;
const useDate = showTomorrow ? tomorrow : now;

// Build date string to use for query
const year = useDate.toLocaleString('default', {year: 'numeric'});
const month = useDate.toLocaleString('default', {month: '2-digit'});
const day = useDate.toLocaleString('default', {day: '2-digit'});

const viewDate = year + '-' + month + '-' + day;

const url = domain + '?userToken=' + USER_TOKEN + '/#/?date=' + viewDate + '&bookmarkID=' + bookmarkID;
const loadUrl = url + '&saveState=false';

const webview = new WebView();
await webview.loadURL(loadUrl);

const widget = new ListWidget();
widget.setPadding(0, 0, 0, 0);
widget.url = url; // Where to go when the widget is clicked
widget.backgroundColor  = new Color(COLORS.background);

// Set refresh date to one hour from now
let refreshDate = new Date(now);
// Add refresh interval
refreshDate.setMinutes(now.getMinutes() + REFRESH_INTERVAL);

// Refresh at the hour exactly if we are close to a threshold
if ((now.getHours() <= 23 && refreshDate.getHours() >= 0) || (thresholdForNextDay !== 0 && now.getHours() < HOUR_THRESHOLD_FOR_NEXT_DAY && refreshDate.getHours() >= HOUR_THRESHOLD_FOR_NEXT_DAY)) {
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
	let footerSet;
  
	setWidgetHeader();
  
	for (let i = 0; i < events.length; i++) {
		const title = stripHtmlTags(events[i].title);
		const endDate = new Date(events[i].end);
    	if (!SHOW_PAST_EVENTS && !events[i].allDay && sortTimes(now, endDate) > 0) {
			// Don't show events that have already happened
    		continue;
		}
  		if (linesShown < MAX_LINES) {
    		setWidgetEntry(events[i], title);
    		linesShown++;
    	
    		if (!refreshDateUpdated && !events[i].allDay && sortTimes(refreshDate, endDate) > 0) {
				refreshDateUpdated = true;
    			refreshDate = endDate;
    		} 
  		}
  		else {
			if (!footerSet) {
    			setWidgetFooter(TRANSLATIONS['more'] + '...');
				footerSet = true;
			}
    	}
		// Set notifications
		if (NOTIFICATIONS_ENABLED) {
			let notificationDate = new Date(events[i].start);
			if (events[i].allDay) {
				notificationDate.setHours(NOTIFICATIONS_ALL_DAY_HOUR);
			}

			notificationDate.setMinutes(notificationDate.getMinutes() - NOTIFICATIONS_MINUTES_BEFORE, 0, 0);

			const notificationOptions = {	
				id: events[i].calendarID + '-' + events[i].eventID,
				subtitle: 'Starts @ ' + events[i].timeDisplay,
				body: title,
				date: notificationDate,	
			}

				scheduleNotification(notificationOptions);
		}
	}

	if (!linesShown) {
		setNoEvents();	
	}
}

// Widget building functions

function setNoEvents() {
	const noEventsText = showTomorrow ? TRANSLATIONS['No events scheduled'] : TRANSLATIONS['No events remaining'];
	const stack = contentStack.addStack();
	stack.layoutVertically();
	stack.setPadding(0, 0, 0, 0);
	stack.borderWidth = 0;
	const txt = stack.addText(noEventsText);
	txt.textColor = new Color(COLORS.label);
	txt.font = Font.systemFont(16);

	contentStack.addSpacer(10);
}

function setWidgetHeader() {
  	const headerText = showTomorrow ? TRANSLATIONS['Tomorrow'] : TRANSLATIONS['Today'];
	const stack = contentStack.addStack();
	stack.layoutHorizontally();
	stack.setPadding(0, 0, 0, 0);
	stack.borderWidth = 0;
	const txt = stack.addText(headerText);
	txt.textColor = new Color(COLORS.textHeader);
	txt.font = Font.systemFont(24);

	stack.addSpacer();

	const calendarIcon = showTomorrow ? SFSymbol.named('calendar.circle') : SFSymbol.named('clock');
	//calendarIcon.applyFont(Font.systemFont(24)); // Doesn't appear to be needed, at least not at the current size
	const calendarImg = stack.addImage(calendarIcon.image);
	calendarImg.tintColor = new Color(COLORS.textHeader);
	calendarImg.imageSize = new Size(30, 30);

	contentStack.addSpacer(10);
	
}

function setWidgetFooter(footerText) {
	const stack = contentStack.addStack();
	stack.layoutVertically();
	stack.setPadding(0, 0, 0, 0);
	stack.borderWidth = 0;
	const txt = stack.addText(footerText);
	txt.textColor = new Color(COLORS.label);
	txt.font = Font.systemFont(14);
	
}

function setWidgetEntry(event, titleText) {
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
	time.textColor = new Color(COLORS.textPrimary);
	time.font = Font.systemFont(14);

	// Title
	const txt = rowStack.addText(titleText);
	txt.lineLimit = 1;
	txt.textColor = new Color(COLORS.textSecondary);
	txt.font = Font.systemFont(14);
	
	contentStack.addSpacer(6);
}

// Utility functions

function scheduleNotification(options) {
	// options object properies
	// id: string
	// title: string
	// subtitle: string
	// body: string
	// notifyDate: date
	
	let notification = new Notification();
	
	notification.threadIdentifier = 'dbk-widget-agenda';
	notification.identifier = options.id;
	
	notification.title = options.title ? options.title : 'DayBack Upcoming Event';
	notification.subtitle = options.subtitle ? options.subtitle : '';
	notification.body = options.body ? options.body : '';
	
	notification.sound = 'event';
	notification.setTriggerDate(options.date);
	
	notification.schedule();
}

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
  	
  	if (!ALL_DAY_ON_TOP) {
    	// Put all day events on the bottom of the list
  		return Number(a.allDay) - Number(b.allDay) || a.sort - b.sort;
  	}
  	else {
    	// Put all day events on the top of the list
		return a.sort - b.sort || Number(a.allDay) - Number(b.allDay);
	}
}

function stripHtmlTags(text) {
	if (!text) {
		text = '';
	}
	text = text.replace(/(<([^>]+)>)/gi, '');

	return decodeHtmlEntity(text);
}

function decodeHtmlEntity(text) {
	text = text
	.replace(/&nbsp;/g, ' ')
	.replace(/&amp;/g, '&')
	.replace(/&lt;/g, '<')
	.replace(/&gt;/g, '>')
	.replace(/&quot;/g, '"')
	.replace(/&apos;/g, '\'')
	.replace(/&#(\d+);/g, function(match, dec) {
	  return String.fromCharCode(dec);
	});

	return text;
};