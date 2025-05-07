#!/bin/sh

if [ "$#" -lt 6 ]; then
    echo "Usage: $0 [art|music] '<event_url>' '<date>' '<title>' '<when>' '<description>'"
    exit 1
fi

type=$1; shift
event_url=$1; shift
date=$1; shift
title=$1; shift
when=$1; shift
description=$1; shift

image_url="${event_url}/media/?size=l"
lower_title=$(echo $title | tr '[A-Z] ' '[a-z]-' | sed 's/[^a-z0-9-]//g')
file_name="${date}-${lower_title}"

curl "$image_url" > "/tmp/$$.jpg" || exit 1
file "/tmp/$$.jpg" | grep "JPEG image data" || exit 1
cp "/tmp/$$.jpg" "static/billboard/${file_name}.jpg"
cp "/tmp/$$.jpg" "static/events/${file_name}.jpg"
rm -f "/tmp/$$.jpg"

cat > "data/billboard/${file_name}.yaml" <<EOF
href: ${file_name}.jpg
date: ${date}
EOF

cat > "data/events/${type}/${file_name}.yaml" <<EOF
title: "${title}"
when: "${when}"
image: "/events/${file_name}.jpg"
date: ${date}
link: "${event_url}"
actionText: Share on Instagram
description: |
  ${description}
EOF


