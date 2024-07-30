#!/bin/sh

echo -n "Image URL: "
read image_url

echo -n "Event URL: "
read event_url

echo -n "File Date (yyyy-mm-dd): "
read date

echo -n "Expiration Date (yyyy-mm-dd): "
read expiration_date

echo -n "Title: "
read title

echo -n "When: "
read when

echo -n "Description: "
read description

lower_title=$(echo $title | tr '[A-Z] ' '[a-z]-')
file_name="${date}-${lower_title}"

curl "$image_url" > "/tmp/$$.jpg"
cp "/tmp/$$.jpg" "static/billboard/${file_name}.jpg"
cp "/tmp/$$.jpg" "static/events/${file_name}.jpg"
rm -f "/tmp/$$.jpg"

cat > "data/billboard/${file_name}.json" <<EOF
href: ${file_name}.jpg
expiration: ${expiration_date}
EOF

cat > "data/events/${file_name}.json" <<EOF
title: "${title}"
when: "${when}"
image: "/events/${file_name}.jpg"
expiration: ${expiration_date}
link: "${event_url}"
actionText: RSVP and share on Facebook
description: |
  ${description}
EOF


