#!/bin/sh

if [ "$#" -lt 8 ]; then
    echo "Usage: $0 '<image_url>' '<event_url>' '<file_date>' '<event_expiration_date>' '<billboard_expiration_date>' '<title>' '<when>' '<description>'"
    exit 1
fi

image_url=$1; shift
event_url=$1; shift
file_date=$1; shift
event_expiration_date=$1; shift
billboard_expiration_date=$1; shift
title=$1; shift
when=$1; shift
description=$1; shift

lower_title=$(echo $title | tr '[A-Z] ' '[a-z]-' | sed 's/[^a-z0-9-]//g')
file_name="${file_date}-${lower_title}"

curl "$image_url" > "/tmp/$$.jpg"
cp "/tmp/$$.jpg" "static/billboard/${file_name}.jpg"
cp "/tmp/$$.jpg" "static/events/${file_name}.jpg"
rm -f "/tmp/$$.jpg"

cat > "data/billboard/${file_name}.yaml" <<EOF
href: ${file_name}.jpg
expiration: ${billboard_expiration_date}
EOF

cat > "data/events/${file_name}.yaml" <<EOF
title: "${title}"
when: "${when}"
image: "/events/${file_name}.jpg"
expiration: ${event_expiration_date}
link: "${event_url}"
actionText: RSVP and share on Facebook
description: |
  ${description}
EOF


