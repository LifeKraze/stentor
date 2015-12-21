<img align="right" alt="Build Status" src="https://travis-ci.org/SpireTeam/yodel.svg?branch=master">

![Yodel Logo](http://i.imgur.com/iUCHOMU.png)

A lightweight Android and iOS push notification server that reads from a simple
Redis API and delivers notifications via GCM and APN.

## Sample Redis API Requests

##### Subscribe
```
rpush yodel:subscribe '{"user_id":5, "token":"sample", "platform":"ios"}'
```

##### Unsubscribe
```
rpush yodel:unsubscribe '{"user_id":5, "token":"sample", "platform":"ios"}'
```

##### Notify
```
rpush yodel:notify '{"user_id":5, "message":"This is a test", "payload": {"sample": "payload"}}'
```

## Getting Started
Yodel is meant to run as an independent Node service on Node 0.10.x and up to Node 5.x. It
requires connections to Redis and MySQL servers.



### Adding Config Files
Of the 7 supported config files, only 1 is required. All have corresponding sample
files in the config directory.

* knexfile.js (required)
* redis.json (optional)
* redis_events.json (optional)
* apn.json (optional)
* gcm.json (optional)
* sentry.json (optional)
* ping.json (optional)

When writing apn.json, keep in mind that all of the options in that file are passed directly
to the [node-apn](https://github.com/argon/node-apn) package. You can see a [list of supported options](https://github.com/argon/node-apn/blob/master/doc/connection.markdown) in their documentation.

### DB and Package Setup
Ensure that you have MySQL and Redis running, and that you're MySQL server has a database
matching you're knexfile. At that point, install npm packages and run the DB migration:

```
npm install
tasks/migrate
```

### Starting Yodel
You should be ready to start Yodel now. At the most basic level, that can be accomplished
with the following command.

```
node app.js
```

Yodel does also support the following options:
```
    -h, --help               output usage information
    -e, --environment <env>  Node Environment (defaults to development)
    -w, --workers <n>        Number of workers (defaults to number of CPUs)
```

## Android User Notification Options

Yodel maintains an updated notification key for each user's Android devices. Once provided to the Android client, the notification key can be used to implement GCM upstream messaging. For more information on user notifications, check out the [official docs](http://developer.android.com/google/gcm/notifications.html) and this [handy guide](https://medium.com/@Bicx/adventures-in-android-user-notifications-e6568871d9be).

##### Subscribe
Add option `"push_notification_key":true` to have Yodel send a key-bearing push notification to the subscribed device. This notification will provide the `notification_key` as a data element for use on the client.
```
rpush yodel:subscribe '{
  "user_id":5,
  "token":"sample",
  "platform":"android",
  "push_notification_key":true
}'
```

##### Notify
Add option `"include_notification_key":true` to include the `notification_key` data element in the resulting push notification. This is particularly useful when implementing cross-device notification dismissal.
```
rpush yodel:notify '{
  "user_id":5,
  "message":"This is a test",
  "payload": {"sample": "payload"},
  "include_notification_key":true
}'
```

## iOS Feedback
Yodel automatically takes advantage of APN's Feedback Service and unsubscribes devices who have not re-registered or updated since your last failed notification to the device. This is discussed in the APN documentation [here](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/CommunicatingWIthAPS.html#//apple_ref/doc/uid/TP40008194-CH101-SW3).

By default, Yodel will query the service once every 12 hours. You can change this by setting a new `interval` in `config/apn.json` as seconds. For example, to query for feedback every hour -  `"interval": 3600`.

## Importing Devices from Urban Airship

Yodel includes a basic import script for Urban Airship. It relies on your aliases being
integers. If you need to parse a different alias format, it should be relatively easy
to modify.
```
tasks/import_from_urban_airship -k ua_app_key -m ua_master_secret -e development
```

## Ping

If a valid `ping` config is present for the current environment, Yodel will ping the run and complete URLs at the specified frequency. This can be helpful to ensure that Yodel is running and connected to the necessary databases.


## Events

If a `redis_events` config is present for the current environment, Yodel will publish
events to the `yodel:events` key. Those will be JSON strings in the following format:

```
{
    "user_id": 1,
    "action": "create_device|update_device|delete_device|notify",
    "platform": "android|ios",
    "successful": true|false
}
```

![Yodel Stats Logo](http://i.imgur.com/6wmu6co.png)

We've created a project to aggregate and display data from Yodel. Yodel Stats reads data
from `yodel:events`, aggregates it in MySQL, and displays the data with a simple Express
app. For more information, visit the [Yodel Stats repository](https://github.com/SpireTeam/yodel-stats).
