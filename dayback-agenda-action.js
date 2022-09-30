// DayBack Agenda Widget Service v 0.1
// License: MIT

// Purpose:
// Gets all visible events currently loaded in the calendar and passes them to the Scriptable iOS widget

// Action Type: After Events Rendered
// Open in new window: No

if (typeof agendaCheck !== "undefined" && !params.data.fromViewChange) {
  try {
    // Only run if the agendaCheck function has been defined from Scriptable
    agendaCheck(function () {
      const config = seedcodeCalendar.get("config");
      const events = seedcodeCalendar
        .get("element")
        .fullCalendar("clientEvents");
      let eventResult = [];

      for (let i = 0; i < events.length; i++) {
        if (!config.eventShown(events[i])) {
          // If the event isn't shown don't add it to to the list
          continue;
        }
        const timeDisplay = events[i].allDay
          ? ""
          : events[i].start.format("h:mm a") + " ";
        const title = events[i].title;
        const event = {
          title: title.replace("\n", " | "),
          timeDisplay: timeDisplay,
          color: events[i].color,
          allDay: events[i].allDay,
          start: events[i].start.format(),
          end: events[i].end.format(),
          sort: events[i].start.valueOf(),
        };
        eventResult.push(event);
      }
      // Send results back to scriptable
      completion(JSON.stringify(eventResult));
    });
  } catch (error) {
    if (typeof completion !== "undefined") {
      completion(error);
    }
  }
}
