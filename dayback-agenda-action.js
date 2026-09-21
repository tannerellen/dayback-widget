// DayBack Agenda Widget Service v2.0.0
// License: MIT

// Purpose:
// Gets all visible events currently loaded in the calendar and passes them to the Scriptable iOS widget

// Action Type: After Events Rendered
// Open in new window: No

if (playwright?.sendMessage) {
  try {
    const loadingEvents = seedcodeCalendar.get("loading-events");
    if (!loadingEvents) {
      const clientEvents = seedcodeCalendar
        .get("element")
        .fullCalendar("clientEvents");
      const agenda = clientEvents.filter((item) => {
        return dbk.isEventShown(item);
      });
      playwright.sendMessage({
        events: createWidgetData(agenda),
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    console.log(err);
  }
  function createWidgetData(events) {
    const eventResult = [];

    for (const event of events) {
      const timeDisplay = event.allDay
        ? ""
        : event.start.format("h:mm a") + " ";
      const title = event.title;
      const output = {
        eventID: event.eventID,
        calendarID: event.schedule.id,
        title: title.replace("\n", " | "),
        timeDisplay: timeDisplay,
        color: event.color,
        allDay: event.allDay,
        start: event.start.format(),
        end: event.end.format(),
        sort: event.start.valueOf(),
      };
      eventResult.push(output);
    }
    return eventResult;
  }
}
