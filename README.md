# SRCC Web Site

https://srccpaart.org/

Build the site with [Hugo](https://gohugo.io/).

## Events

Events are created
by adding a YAML file
to `data/events/`
and uploading the image to `static/events/`.

Billboard/marquee images are created
by adding a YAML file
to `data/billboard/`
and upload the image to `static/billboard/`.

There's a babashka script that runs periodically
to sync events from Venue Pilot to this site:
`./update-event-images.bb`

The page is rebuilt every 5 minutes
on the server
to show changes
and additionally once nightly
to remove expired events
from the main page.
