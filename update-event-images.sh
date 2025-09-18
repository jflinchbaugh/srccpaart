#!/bin/bash

cd static/billboard

START_DATE=$(date +%Y-%m-%d)

QUERY=$(echo '{"operationName":null,"variables":{"accountIds":[3338],"startDate":"DATE","endDate":null,"search":"","searchScope":"","page":1},"query":"query ($accountIds: [Int!]!, $startDate: String!, $endDate: String, $search: String, $searchScope: String, $limit: Int, $page: Int) { paginatedEvents(arguments: {accountIds: $accountIds, startDate: $startDate, endDate: $endDate, search: $search, searchScope: $searchScope, limit: $limit, page: $page}) {collection {id name date doorTime startTime endTime ...AnnounceImages __typename } metadata { currentPage limitValue totalCount totalPages __typename } __typename } }  fragment AnnounceImages on PublicEvent { announceImages { name versions { cover { src __typename } __typename } __typename } __typename } "}' | sed "s/DATE/$START_DATE/")

rm -f cover_*

curl 'https://www.venuepilot.co/graphql' \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0' \
  -H 'Accept: */*' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Referer: https://srccpaart.org/' \
  -H 'content-type: application/json' \
  -H 'Origin: https://srccpaart.org' \
  -H 'Sec-GPC: 1' \
  -H 'Connection: keep-alive' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'Priority: u=4' \
  -s \
  --data-raw "$QUERY" \
| jq '.data.paginatedEvents.collection[].announceImages[].versions.cover.src' \
| grep "cover_" \
| xargs curl -s --remote-name-all

git pull
git add .
git commit -m 'automatic event images'
git push
