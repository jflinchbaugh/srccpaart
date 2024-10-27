# SRCC Web Site

https://srccpaart.org/

Build with Hugo.

## Events

Events are created 
by adding a YAML file 
to `data/events/`
and uploading the image to `static/events/`.

Billboard/marquee images are created
by adding a YAML file 
to `data/billboard/`
and upload the image to `static/billboard/`.

Copy an existing file and customize.

There's also a script
for copying events from Facebook:
`./new-event.sh`
Run it by itself,
and it'll show its usage.


The page is rebuilt every 5 minutes 
on the server
to show changes 
and additionally once nightly 
to remove expired events
from the main page.
