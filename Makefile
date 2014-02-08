#SHELL := /bin/bash
DATED=$(shell date '+%Y-%m-%d')

all: geojson topojson


glop:
	ssh studio.stamen.com "cd /var/www/com.stamen.studio/openspaces/show/latest && git pull"

latest:
	ssh studio.stamen.com "cd /var/www/com.stamen.studio/openspaces/show/latest && git pull"

dated-latest:
	ssh studio.stamen.com "cd /var/www/com.stamen.studio/openspaces/show \
	&& mkdir -p $(DATED) \
	&& cp -r latest/www/ $(DATED)"


show:
	ssh studio.stamen.com "cd /var/www/com.stamen.studio/openspaces/show \
	&& mkdir -p $(DATED) \
	&& cp -r --parents fractured_atlas/play $(DATED)"

# These geojson and topojson commands are obsolete.
geojson:
	cd data/ && rm -f superunits_hashtags_counts.geojson && ogr2ogr -s_srs EPSG:900913 -t_srs EPSG:4326 -f geojson superunits_hashtags_counts.geojson pg:"host=geo.local user=openspaces" -sql "select a.unit_name, a.hashtag, a.agncy_id, b.venuecount, b.checkinscount, a.geom from superunits_hashtags a left join (select park_name, count(park_name) as venuecount, sum(checkinscount) as checkinscount from park_contains_all group by park_name order by venuecount desc, checkinscount desc) as b on a.unit_name = b.park_name where a.hashtag is not null group by a.unit_name, a.hashtag, a.agncy_id, b.venuecount, b.checkinscount, a.geom;"

topojson:
	cd data && rm -f superunits_hashtags_counts.topojson && topojson -o superunits_hashtags_counts.topojson superunits_hashtags_counts.geojson -p -q 1e5

geojson2:
	cd data/ && rm -f superunits_hashtags_counts2.geojson && ogr2ogr -s_srs EPSG:900913 -t_srs EPSG:4326 -f geojson superunits_hashtags_counts2.geojson pg:"host=geo.local user=openspaces" -sql "select a.unit_name, a.hashtag, a.agncy_id, b.venuecount, b.checkinscount, a.geom from superunits_hashtags a left join (select park_name, count(park_name) as venuecount, sum(checkinscount) as checkinscount from park_contains_all group by park_name order by venuecount desc, checkinscount desc) as b on a.unit_name = b.park_name where a.hashtag is not null OR a.agncy_id = 108 OR a.agncy_id = 109 group by a.unit_name, a.hashtag, a.agncy_id, b.venuecount, b.checkinscount, a.geom;"

topojson2:
	cd data && rm -f superunits_hashtags_counts2.topojson && topojson -o superunits_hashtags_counts2.topojson superunits_hashtags_counts2.geojson -p -q 1e5

#TODO: include command to create flickrHarvesterTable

twitterdbtable:
	psql -U openspaces -h geo.local -c "drop table park_tweets;" \
	&& psql -U openspaces -h geo.local -c "create table park_tweets as select park.su_id as su_id, park.unit_name as su_name, tweet.* from cpad_2013b_superunits_ids as park join tweets as tweet on ST_Contains(park.geom,tweet.the_geom);"

#TODO: include step to uniquify
flickrdbtable:
	psql -U openspaces -h geo.local -c "drop table park_flickr_photos;" \
	&& psql -U openspaces -h geo.local -c "create table park_flickr_photos as select park.su_id as su_id, park.unit_name as su_name, photo.* from cpad_2013b_superunits_ids as park join flickr_photos_distinct as photo on ST_Contains(park.geom,photo.the_geom);"

# obsolete
flickrgeojson:
	cd data/ && rm -f park_flickr_photos.json \
	&& ogr2ogr -f geojson park_flickr_photos.json pg:"host=geo.local user=openspaces" -sql "select containing_park_id::int, photoid::text, owner, secret, server, farm, title, woeid, the_geom from park_flickr_photos;"

# The venues returned from the harvester (not cropped to parks)
foursquareHarvesterTable:
	psql -U openspaces -h geo.local -c "drop table foursquare_venues;" \
	&& psql -U openspaces -h geo.local -c "create table foursquare_venues (id serial, venueid varchar(80), name varchar(255), lat numeric(15,12), lng numeric(15,12), address varchar(255), postcode varchar(20), city varchar(80), state varchar(40), country varchar(40), cc varchar(10), categ_id varchar(80), categ_name varchar(80), verified boolean, restricted boolean, referral_id varchar(80), harvested_park_id bigint, harvested_park_name varchar(80));" \
	&& psql -U openspaces -h geo.local -c "select AddGeometryColumn('foursquare_venues','the_geom',4326,'POINT',2);"
# Later, populate the_geom after importing.

foursquareHarvesterTableUpdate:
	psql -U openspaces -h geo.local -c "UPDATE foursquare_venues SET the_geom = ST_SetSRID(ST_MakePoint(lng,lat), 4326);"


# This keeps track of all the harvester queries
foursquareMetadataTable:
	psql -U openspaces -h geo.local -c "drop table foursquare_metadata;" \
	&& psql -U openspaces -h geo.local -c "create table foursquare_metadata (latMin float, lngMin float, latMax float, lngMax float, date timestamp, count int);" \
	&& psql -U openspaces -h geo.local -c "select AddGeometryColumn('foursquare_metadata','the_geom',4326,'POLYGON',2);"
# Later, populate the_geom after importing.

foursquareMetadataTableUpdate:
	psql -U openspaces -h geo.local -c "UPDATE foursquare_metadata SET the_geom = ST_MakeEnvelope(lngMin,latMin,lngMax,latMax,4326);"

foursquareActivityTable:
	psql -U openspaces -h geo.local -c "drop table foursquare_venue_activity;" \
	&& psql -U openspaces -h geo.local -c "create table foursquare_venue_activity (venueid varchar(80), timestamp timestamp default NOW(), checkinscount bigint, userscount bigint, tipcount bigint, likescount bigint, mayor_id varchar(20), mayor_firstname varchar(80), mayor_lastname varchar(80));" \

foursquaredbtable:
	psql -U openspaces -h geo.local -c "drop table foursquare_venues_distinct;" \
	&& psql -U openspaces -h geo.local -c "create table foursquare_venues_distinct as select distinct on (venueid) * from foursquare_venues;" \
	&& psql -U openspaces -h geo.local -c "drop table park_foursquare_venues;" \
	&& psql -U openspaces -h geo.local -c "create table park_foursquare_venues as select park.su_id as su_id, park.unit_name as su_name, venue.* from cpad_2013b_superunits_ids as park join foursquare_venues_distinct as venue on ST_Contains(park.geom,venue.the_geom);"

foursquareVenuesActivityView:
	psql -U openspaces -h geo.local -c "create view park_foursquare_venues_activity as select a.*, b.timestamp, b.checkinscount, b.userscount, b.tipcount, b.likescount, b.mayor_id, b.mayor_firstname, b.mayor_lastname from park_foursquare_venues a left join (select distinct on (venueid) * from foursquare_venue_activity order by venueid, timestamp desc) as b on a.venueid = b.venueid;"
