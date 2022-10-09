# DayBack Agenda Widget

<a href="https://dayback.com" target="_blank">DayBack</a> Agenda Widget is an iOS widget made in <a href="https://scriptable.app/" target="_blank">Scriptable.app</a>. It displays todays agenda and tomorrows agenda after a certain cutoff time with data being pulled from a <a href="https://dayback.com" target="_blank">DayBack</a> bookmark.

**Before getting started** it is recommended to create a bookmark just for you in <a href="https://dayback.com" target="_blank">DayBack</a> that filters just the events you want to see on your agenda. Some general guidelines for creating this bookmark are:
* Make sure the bookmark is created in day list view.
* Enable all calendars you want events to be shown from.
* Utilize text filters to filter only events that are important to you. This usually entails filtering based on your name. a good starting point is "YourName or holidays" for exaple to see events assigned to you and any national holidays in Google Calendar. Read the <a href="https://docs.dayback.com/article/114-filter-options" target="_blank">documentation on text filters</a> to get the filtering just right.
* It's recommended to close the sidebar when creating the bookmark for a better iPad experience.

To install this widget follow these steps:
1. Add a new "After Events Rendered" app action to DayBack:
    * Open <a href="https://raw.githubusercontent.com/tannerellen/dayback-widget/main/dayback-agenda-action.js" target="_blank">the action code here</a> and copy all the contents.
    * In DayBack navigate to "Administrator Settings", then "App Actions".
    * Click "Add New App Action".
    * Paste the code you copiedms into the "Javascript" edit box. Then select the type of "After Events Rendered". Optionaly you can give it a name of "Scriptable Widget" for easy identification.

2. <a href="https://scriptable.app/" target="_blank">Install Scriptable</a> on your iOS device.

3. Install the widget by completing the following steps:
    * Open <a href="https://raw.githubusercontent.com/tannerellen/dayback-widget/main/dayback-agenda-widget.js" target="_blank">the widget code here</a> and copy all the contents.
    * <a href="https://open.scriptable.app" target="_blank">Open the Scriptable App</a> and create a new script (+ Button in the top-right corner).
    * Name your script for example "DayBack Agenda" by simply tapping on "Untitled Script" in the top of the sreen.
    * Paste the code that you previously copied into the app and press "Done".

4. Add your DayBack user token to the config in Scriptable:
    * Access DayBack on your iOS device and navigate to Administrator settings, then to your account details (click on your email address). Copy the provided "User Token". 
    * <a href="https://open.scriptable.app" target="_blank">Naviate back to Scriptable</a> edit the script you added by pressing the 3 dots on the script you created. Find the config property "USER_TOKEN" and paste the value that you copied in between the single quotes.
    
    A good strategy for pasting on iOS is to hold your finger on the screen and drag to move the cursor just where you want it. Then let go, and briefly tap just slightly above the cursor to bring up the paste dialog.

5. Add your bookmark to the config in Scriptable:
    * Access DayBack on your iOS device and navigate to bookmarks, click manage bookmarks and click on the agenda bookmark you created.
    * Click "Copy URL" to copy the bookmark URL.
    * <a href="https://open.scriptable.app" target="_blank">Naviate back to Scriptable</a> find the config property "BOOKMARK" and paste the value that you copied in between the single quotes.
    * Press "Done".

6. Add the widget to your home-screen with the following steps:
    * Go to your home-screen and add a new widget.
    * Select the Scriptable App and choose the medium size widget.
    * Press "Add Widget" and back on your home-screen press on the newly added widget-space.
    * Select your script, and leave the rest blank, touch anywhere outside the widget when done.