'use strict';

var async    = require('async'),
    env      = require('require-env'),
    pg       = require('pg'),
    gpsUtil  = require('gps-util'),
    numeral  = require('numeral');

var instagram = require('../lib/instagram');

var DATABASE_URL = env.require('DATABASE_URL');

var hashtags = require('../public/data/hashtagsBySuId.json'),
    contexts = {},
    cpadModified;

contexts.tweets = require('../public/data/context-tweets.json');
contexts.foursquareCheckins = require('../public/data/context-foursquare-checkins.json');
contexts.foursquareVenues = require('../public/data/context-foursquare-venues.json');
contexts.flickrPhotos = require('../public/data/context-flickr-photos.json');
contexts.instagramPhotos = require('../public/data/context-instagram-photos.json');

module.exports = function(req, res, data, callback) {
    var park_id = req.params.id,
        positions = {};

    var template  = 'park',
        foursquare_checkins = 0,
        foursquare_tips     = 0,
        instagramPreload    = [],
        instagramPostload   = [],
        tweetsPreload       = [],
        tweetsPostload      = [],
        flickrPreload       = [],
        flickrPostload      = [],
        title,
        thisOne,
        centroid;

    //
    // Get positions
    //
    contexts.tweets.forEach(function(pos, i) {
      if ((pos.superunit_id | 0) === (park_id | 0)) {
        positions.tweets = i;
      }
    });
    contexts.foursquareCheckins.forEach(function(pos, i) {
      if ((pos.superunit_id | 0) === (park_id | 0)) {
        positions.foursquareCheckins = i;
      }
    });
    contexts.foursquareVenues.forEach(function(pos, i) {
      if ((pos.superunit_id | 0) === (park_id | 0)) {
        positions.foursquareVenues = i;
      }
    });
    contexts.flickrPhotos.forEach(function(pos, i) {
      if ((pos.superunit_id | 0) === (park_id | 0)) {
        positions.flickrPhotos = i;
      }
    });
    contexts.instagramPhotos.forEach(function(pos, i) {
      if ((pos.superunit_id | 0) === (park_id | 0)) {
        positions.instagramPhotos = i;
      }
    });

    //
    // Get special template if one exists
    //
    if (data.overrideTemplates[park_id]) {
      template = data.overrideTemplates[park_id].template;
      title    = data.overrideTemplates[park_id].title;
    }

    return pg.connect(DATABASE_URL, function(err, client, done) {
      if (err) {
        done();
        return callback(err);
      }

      var query = client.query.bind(client);

      return async.parallel({
        result: async.apply(query, 'select *, ST_AsGeoJSON(ST_Centroid(geom)) as centroid from cpad_superunits_4326 where superunit_id = $1 limit 9000', [park_id]),
        flesult: async.apply(query, 'select photoid, owner, secret, server, farm, title, latitude, longitude, accuracy, woeid, tags, dateupload, datetaken, ownername, description, license, o_width, o_height, url_l, height_l, width_l from site_park_flickr_photos where containing_park_id = $1 limit 9000', [park_id]),
        instasult: async.apply(instagram.getPhotosForPark, park_id),
        foursult: async.apply(query, 'select id,venueid,name,lat,lng,address,postcode,city,state,country,cc,categ_id,categ_name,verified,restricted,referral_id,checkinscount,tipcount,likescount,mayor_id,mayor_firstname,mayor_lastname from site_foursquare_venues_activity where su_id = $1 limit 9000', [park_id]),
        tweetsult: async.apply(query, 'select id_str, place, coords, username, fullname, client, date, retweet_count, favorite_count, lang, content from site_tweets where su_id = $1 limit 9000', [park_id]),
        hipcampsult: async.apply(query, 'select * from site_hipcamp_activities where su_id=$1', [park_id])
      }, function(err, apiResponse) {
        done();

        if (err) {
          return callback(err);
        }

        var result      = apiResponse.result,
            flesult     = apiResponse.flesult,
            instasult   = apiResponse.instasult,
            foursult    = apiResponse.foursult,
            tweetsult   = apiResponse.tweetsult,
            hipcampsult = apiResponse.hipcampsult;

        //
        // Was a park found? if not, just 404
        //
        if (result.rows[0]) {

          //
          // Get checkins and tips count from Foursquare
          //
          foursult.rows.forEach(function(venue) {
            foursquare_checkins += venue.checkinscount;
            foursquare_tips += venue.tipcount;
          });

          var venues_count               = numeral(foursult.rows.length).format('0,0'),
              venues_checkins            = numeral(foursquare_checkins).format('0,0'),
              venues_tips                = numeral(foursquare_tips).format('0,0'),
              hasHipcamp                 = (hipcampsult.rows.length > 0),
              hipcampActivities          = (hasHipcamp) ? hipcampsult.rows[0].activities : null,
              hipcampActivitiesOrganized = [];


          //separate the instagram into preload and post load
          // preloading 32
          var instographer_count = {};
          instasult.forEach(function(photo, i) {

            instographer_count[photo.username] = true;

            thisOne = photo;
            thisOne.thumb = thisOne.standard_resolution.split('_7').join('_5');
            thisOne.thumb = thisOne.standard_resolution.split('_7').join('_5');

            if(i < 32) {
              instagramPreload.push(photo);
            } else {
              instagramPostload.push(photo);
            }
          });

          //separate the tweets into preload and post load
          // preloading 10
          var tweeter_count = {};
          tweetsult.rows.forEach(function(tweet, i) {

            tweeter_count[tweet.username] = true;

            if(i < 10) {
              tweetsPreload.push(tweet);
            } else {
              tweetsPostload.push(tweet);
            }
          });

          //separate flickr into preload and post load
          // preloading 5
          var flotographer_count = {};
          flesult.rows.forEach(function(photo, i) {

            flotographer_count[photo.ownername] = true;

            if(i < 5) {
              flickrPreload.push(photo);
            } else {
              flickrPostload.push(photo);
            }
          });

          //
          // Get the centroid of the CPAD geometry
          //
          try {
            centroid = JSON.parse(result.rows[0].centroid).coordinates;
          } catch (err) {
            return callback(err);
          }

          //
          // If the park has hipcamp activities, organize them
          //
          if (hasHipcamp) {

            //
            // Filter out non activities
            //
            delete hipcampActivities['cpadparkname'];
            delete hipcampActivities['hipcampparkname'];
            delete hipcampActivities['cpadSunma'];
            delete hipcampActivities['activityCount'];
            delete hipcampActivities['other'];

            for(var i in hipcampActivities) {
              if (hipcampActivities.hasOwnProperty(i) && hipcampActivities[i]) {
                hipcampActivitiesOrganized.push({'name':i});
              }
            }

          }

          //
          // Modify CPAD to work better as an API output
          //
          cpadModified            = result.rows[0];

          return callback(null, {
            appTitle         : 'California Open Spaces > ' + result.rows[0].unit_name,
            park_id          : result.rows[0].superunit_id,
            name             : result.rows[0].unit_name,
            agency_slug      : result.rows[0].mng_agncy.split(' ').join('+'),
            totalPhotos      : flesult.rows.length ? flesult.rows.length : 0,
            flickrPhotos     : flickrPreload,
            flotographer_count : Object.keys(flotographer_count).length,
            queue_flickr_photos : JSON.stringify(flickrPostload),
            noFlickrScroll   : (flesult.rows.length < 2),
            coverPhoto       : flesult.rows.length ? flesult.rows[0] : null,
            locationDisplay  : {
              lat : gpsUtil.getDMSLatitude(centroid[1]),
              lon : gpsUtil.getDMSLongitude(centroid[0])
            },
            centroid               : [centroid[1], centroid[0]],
            centroid_longitude     : centroid[0],
            centroid_latitude      : centroid[1],
            cpadPark               : result.rows[0],
            hashtag                : hashtags[result.rows[0].superunit_id],
            tweets                 : tweetsPreload,
            tweets_queue           : JSON.stringify(tweetsPostload),
            tweets_queue_count     : tweetsPostload.length,
            tweet_count            : tweetsult.rows.length,
            tweeter_count          : Object.keys(tweeter_count).length,
            empty_right_column     : !(tweetsult.rows.length > 0) && !instasult.length,
            has_tweets             : (tweetsult.rows.length > 0),
            has_instagram_photos   : (instasult.length > 0),
            top_instagram_photos   : instagramPreload,
            instographer_count     : Object.keys(instographer_count).length,
            hasHipcamp             : hasHipcamp,
            hipcampActivities      : hipcampActivitiesOrganized,
            total_any_photos       : (flesult.rows.length + instasult.length),
            queue_instagram_photos : JSON.stringify(instagramPostload),
            queue_instagram_length : instagramPostload.length,
            instagram_count        : instasult.length,
            has_foursquare         : (venues_count > 0),
            venues_activity        : foursult.rows,
            venues_count           : foursult.rows.length < 1000000 ? venues_count : '1 M +',
            venues_checkins        : foursquare_checkins < 1000000 ? venues_checkins : '1 M +',
            venues_tips            : foursquare_tips < 1000000 ? venues_tips : '1 M +'
          });

        } else {
          return callback();
        }
      });
    });
};
