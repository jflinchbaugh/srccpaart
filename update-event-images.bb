#!/usr/bin/env bb

(ns update-event-images
  (:require
   [babashka.process :as proc]
   [clojure.string :as str]
   [cheshire.core :as json]
   [clj-yaml.core :as yaml]
   [org.httpkit.client :as http])
  (:import
    (java.time LocalDate LocalTime)
    (java.time.format DateTimeFormatter)))

(def query
  "query (
    $accountIds: [Int!]!,
    $startDate: String!,
    $endDate: String,
    $search: String,
    $searchScope: String,
    $limit: Int,
    $page: Int
  ) {
    paginatedEvents(
      arguments: {
        accountIds: $accountIds,
        startDate: $startDate,
        endDate: $endDate,
        search: $search,
        searchScope: $searchScope,
        limit: $limit,
        page: $page
      }
    ) {
      collection {
        id
        name
        date
        doorTime
        startTime
        endTime
        minimumAge
        promoter
        support
        description
        websiteUrl
        twitterUrl
        instagramUrl
        ...AnnounceImages
        status
        announceArtists {
          applemusic
          bandcamp
          facebook
          instagram
          lastfm
          name
          songkick
          spotify
          twitter
          website
          wikipedia
          youtube
        }
        artists {
          bio
          createdAt
          id
          name
          updatedAt
        }
        venue {
          name
        }
        footerContent
        ticketsUrl
      }
    }
  }
  fragment AnnounceImages on PublicEvent {
    announceImages {
      name
      highlighted
      versions {
        cover {
          src
        }
      }
    }
  }")

(def df (DateTimeFormatter/ofPattern "EEEE, MMMM d, y"))

(def tf (DateTimeFormatter/ofPattern "h:mma"))

(defn when-str [date start-time end-time]
  (str (.format df (LocalDate/parse date))
    (when start-time
      (str ", "
        (str/lower-case (.format tf (LocalTime/parse start-time)))
        (when end-time
          (str
            "-"
            (str/lower-case (.format tf (LocalTime/parse end-time)))))))))

(defn get-image-url [event]
  (->>
    event
    :announceImages
    (map
      (fn [i] (get-in i [:versions :cover :src])))
    (remove nil?)
    first))

(defn parse-event [event]
  {:title (:name event)
   :when (when-str (:date event) (:startTime event) (:endTime event))
   :date (:date event)
   :link (:ticketsUrl event)
   :actionText (:status event)
   :image (str/replace (get-image-url event) #".*/cover_" "events/cover_")
   :description (str
                  (when (seq? (:support event))
                    (str "<p>" (:support event) "</p>\n"))
                  (:description event))
   })

(defn file-name [date title]
  (let [title-slug (-> (or title "")
                       (str/lower-case)
                       (str/replace #"[^a-zA-Z0-9]+" "-")
                       (str/replace #"^-|-$" ""))
        parts (cond-> []
                (not (str/blank? date)) (conj date)
                (not (str/blank? title-slug)) (conj title-slug))]
    (str/join "-" parts)))

(defn write-event [e]
  (spit
    (str "data/events/venuepilot/" (file-name (:date e) (:title e)) ".yaml")
    (yaml/generate-string e
      :dumper-options {:flow-style :block
                       :scalar-style :folded})))

(defn download-images [dir urls]
  (when (seq urls)
    (apply proc/shell
      {:dir dir
       :out :string}
      (concat ["curl" "-s" "--remote-name-all"] urls))))

;; commit the changes to build site
(proc/shell "sh" "-c" "git pull")

(let [
      start-date "2025-10-01" #_(str (LocalDate/now))
      billboard-dir "static/billboard"
      event-dir "static/events"
      query (json/generate-string
              {:operationName nil
               :variables {:accountIds [3338]
                           :startDate start-date
                           :endDate nil
                           :search ""
                           :searchScope ""
                           :limit 1000
                           :page 1}
               :query query})
      headers {"User-Agent" "Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0"
               "Accept" "*/*"
               "Accept-Language" "en-US,en;q=0.5"
               "Accept-Encoding" "gzip, deflate, br, zstd"
               "Referer" "https://script.org/"
               "Content-type" "application/json"
               "Origin" "https://srccpaart.org"
               "Sec-GPC" "1"
               "Connection" "keep-alive"
               "Sec-Fetch-Dest" "empty"
               "Sec-Fetch-Mode" "cors"
               "Sec-Fetch-Site" "cross-site"
               "Priority" "u=4"}
      response @(http/post
                  "https://www.venuepilot.co/graphql"
                  {:body query
                   :headers headers})
      body (:body response)
      data (json/parse-string body true)
      events (get-in data [:data :paginatedEvents :collection])]

  ;; download the images for events
  (->>
    events
    (map get-image-url)
    (filter (partial re-matches #".*/cover_.*.jpg"))
    ( download-images event-dir))

  ;; write yaml files for past events
  (->>
    events
    (map parse-event)
    (map write-event)
    (doall))

  ;; remove old events from billboard images
  (proc/shell {:dir billboard-dir} "sh" "-c" "rm -f cover_*")

  ;; download the images for the billboard
  (->>
    events
    (filter (fn [e] (<= 0 (compare (:date e) (str (LocalDate/now))))))
    (map get-image-url)
    (filter (partial re-matches #".*/cover_.*.jpg"))
    (download-images billboard-dir)))

;; commit the changes to build site
(proc/shell "sh" "-c"
  "git pull
   git add data static
   git commit -m 'automatic event sync'
   git push")
