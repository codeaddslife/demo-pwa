# Progressive web apps
The term [Progressive web apps](https://developers.google.com/web/progressive-web-apps/) was coined in
[june 2015](https://infrequently.org/2015/06/progressive-apps-escaping-tabs-without-losing-our-soul/) by Alex Russell
and Frances Berriman to bridge the gap between web apps and native apps. In this article, we will create a fully
functioning progressive web app to show the main concepts in more detail.

## What are progressive web apps?
Progressive web apps (PWA) are web applications that _progress over time_. If you happen to visit a website a lot, it
can be great to cache some of these assets offline or to install it on the homescreen.

It is build on the foundation of [progressive enhancement](https://alistapart.com/article/understandingprogressiveenhancement) and
[responsive web design](https://www.smashingmagazine.com/2011/01/guidelines-for-responsive-web-design). Like any modern
website, it should work for anybody anywhere and use more modern browser features when they are available.

Progressive web apps differ from hybrid apps as they are not installed via an app store (A process where you typically
[loose a lot of potential users](http://blog.gaborcselle.com/2012/10/every-step-costs-you-20-of-users.html)).

They are updated on the server, which costs less to maintain since all users are on the same version. PWA's rely heaviliy on service workers to provide
a native app-like experience.

## Example
In this project we build a progressive web app for my hometown's
[bike renting service Velo](https://www.velo-antwerpen.be/en). A lot of cities have such a renting service nowadays as
part of their public transport system. In our app, we want to show the availability of bikes per station (And also show the closest
station, if you wanted to hop onto a bike right away).

[image:velo](./img/velo.jpg)

I used [Vue.js](vuejs.org) for this. This application is kept as simple as possible to focus on the PWA-specific parts.
For a real world Vue.js application, you might want to check out Vue's [CLI tool](https://github.com/vuejs/vue-cli).

## Getting Started
First off, we start with a basic web application. The index.html-file will look like this:

```
<!DOCTYPE html>
<html>
    <head>
        <title>MyBike</title>
        <link rel="icon" type="image/png" href="img/favicon.png">
        <link rel="stylesheet" href="main.css" media="all" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#ffffff">
    </head>
    <body>
        <div id="app">
            <div id="logo">
                <img src="img/logo.png" alt="MyBike" />
            </div>
            <ul class="stations">
                <li v-for="station in stations">
                    <div class="station">
                        <div class="status">
                            <img v-if="station.bikes == station.slots" src="img/status-full.png" alt="{{station.address}}" />
                            <img v-else-if="station.bikes > 0" src="img/status-available.png" alt="{{station.address}}" />
                            <img v-else-if="station.bikes == 0" src="img/status-empty.png" alt="{{station.address}}" />
                            <img v-else-if="station.status != OPN" src="img/status-closed.png" alt="{{station.address}}" />
                        </div>
                        <strong>{{station.address}} {{station.addressNumber}}</strong>
                        <div>Bikes: {{station.bikes}} - Slots {{station.slots}}</div>
                    </div>
                </li>
            </ul>
        </div>
        <script src="js/axios.min.js"></script>
        <script src="js/vue.min.js"></script>
        <script src="js/app.js"></script>
    </body>
</html>
```

As you can see we load vue.js here, which will load a view for us based on the data that is coming back from
our http request. To keep things simple, this data is a local JSON file.

```
var app = new Vue({
    el: '#app',
    data: {
        stations: []
    },
    beforeMount: function () {
        this.loadStations();
    },
    methods: {
        loadStations: function () {
            var self = this;
            axios.get('/stations.json')
                .then(function (response) {
                    self.stations = response.data;
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
});
```

We will also have some CSS for a basic design and to make this app responsive.

```
body { color: #242729; font: 15px/1.3 Arial,"Helvetica Neue",Helvetica,sans-serif; margin: 40px 0; }
small { color: #999; }
#app { margin: 0 auto; max-width: 700px; }
#logo { margin-bottom: 40px; text-align: center; }
#logo img { width: 100px; height: auto; }
ul.stations { list-style: none; margin: 0 20px; padding: 0; position: relative; }
ul.stations li { border-bottom: 1px solid #e4e6e8; }
ul.stations li div.station { margin-bottom: 10px; margin-top: 10px; margin-left: 58px; }
ul.stations li div.station:after { content: ''; display: block; clear: both; }
ul.stations li div.station div.status { border-radius: 50%; float: left; margin-left: -58px; width: 48px; }
ul.stations li div.station div.status img { width: 48px; }
div.info {background-color: #d9edf7; color: #31708f; border-radius: 16px; word-wrap: break-word; padding: 20px; margin-bottom: 20px;}
```

To see the example for yourself, type the following commands:

```
npm install -g browser-sync
npm start
```

The app will now render beautifully on the different browsers.

[image:getting started](./img/getting_started.png)

# Service workers
[Service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) are a 
big part of PWAs. They allow you to develop [offline first](http://offlinefirst.org/).
A service worker is a javascript process that runs separately and acts as a programmable proxy
between your application and the network. To avoid 
[man-in-the-middle attacks](https://en.wikipedia.org/wiki/Man-in-the-middle_attack), service workers 
have to run over https.


In order to notify the browser that you have a service worker available, you have to register it on load. 
We do this in the our `app.js` file. We also check if serviceWorker is a know feature in our browser, so when it's not, 
the app will not crash.

```
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function() {
        console.log('ServiceWorker registration successful');
    }).catch(function(err) {
        console.log('ServiceWorker registration failed: ', err);
    });
}
```

If you look at the code, you see that we register a seperate javascript file here. This is necassary as the service worker will run 
seperate from your other javascript code. The service worker also has no access to your DOM. `sw.js` should be created at the root-level, so 
not inside the js-folder. 

Let's create `sw.js`:

```javascript
var CACHE_NAME = 'my-bike-v1 ';
var CACHED_URLS = [
    '/',
    '/img/favicon.png',
    '/img/icon-120.png',
    '/img/icon-144.png',
    '/img/icon-152.png',
    '/img/icon-192.png',
    '/img/icon-384.png',
    '/img/logo.png',
    '/img/status-available.png',
    '/img/status-closed.png',
    '/img/status-empty.png',
    '/img/status-full.png',
    '/js/axios.min.js',
    '/js/vue.min.js',
    '/js/app.js',
    '/main.css'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(CACHED_URLS);
        })
    );

});
```

What happens here? A service worker has a specific [lifecycle](https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/lifecycle)
When a service worker is found, the browser will try to install it. `CACHED_URLS` contains all url's that need to be cached. This idea 
follows the [app shell architecture](https://developers.google.com/web/fundamentals/architecture/app-shell), where you cache all static assets, to startup the 
application very quickly. In our case, these are all used files, without the station.json file, as this is the dynamic data here. 

If you try to cache a file that cannot be retrieved, the service worker won't be installed

[image:Service Worker failed to install](./img/error_sw.png)

Once the ServiceWorker is installed, we can listen to the activate-event. 

```javascript
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            cacheNames.map(function(cacheName) {
                if (CACHE_NAME !== cacheName && cacheName.startsWith('my-bike')) {
                    return caches.delete(cacheName);
                }
            })
        })
    );
});
```

There is a difference between a ServiceWorker being installed and the ServiceWorker becoming activated. 
In our code, we want to listen to activate-events, because when a new version of the ServiceWorker becomes active, we want 
to delete our old cache. This is also why `CACHE_NAME` has a version (v1) in it's name. A new version will become v2. 

The last part are fetch 'events'. When the service worker is installed, every request will trigger a fetch event. Inside this event, we can now
return our cached resource, if we have one available. 

Keep in mind that cached resource are only returned the second time
you visit the application, as the first time you were still installing it. Also keep in mind that when you develop,
especially on localhost, that the cache will kick it. Don't forget to clear the cache, or just to open a private window
so you don't get confused.

```javascript
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});
```

There are a lot of [examples](https://github.com/tjoskar/service-worker-exercises) available for service workers.
Keep in mind that service workers are a relatively new feature, so
[not all browsers support all features yet](https://jakearchibald.github.io/isserviceworkerready)

== Web App Manifest
A web app manifest is a JSON file that follows the [W3C’s specification](https://www.w3.org/TR/appmanifest). It gives
some metadata and notifies the browser that this application can be installed on the home screen.

The file should be added as a link-tag in the html file:

```
<link rel="manifest" href="manifest.json">
```

The file itself is a json-file with the options that you specify.

```
{
  "name": "MyBike",
  "short_name": "MyBike",
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#fff",
  "background_color": "#fff",
  "orientation": "portrait",
  "description": "An app for renting bikes",
  "icons": [{
    "src": "img/icon-120.png",
    "sizes": "120x120",
    "type": "image/png"
  }, {
    "src": "img/icon-144.png",
    "sizes": "144x144",
    "type": "image/png"
  }, {
    "src": "img/icon-152.png",
    "sizes": "152x152",
    "type": "image/png"
  }, {
    "src": "img/icon-192.png",
    "sizes": "192x192",
    "type": "image/png"
  },{
    "src": "img/icon-384.png",
    "sizes": "384x384",
    "type": "image/png"
  }]
}
```

The display option represents the preferred display mode, once it is opened from the home screen.
In most cases, standalone will be the best option for a progressive web app.


If you configured the web app manifest correctly, the browser might decide to show an
[Install Banner](https://developers.google.com/web/fundamentals/engage-and-retain/app-install-banners/). When and if
the install banner is opened is browser-specifc and can be changed over time.

[image:install banner](./img/install_banner.png)

## Local Storage
The web has many features available that help create an app-like experience, like 
[LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). We will now keep 
track of the lastUpdate-date. This date is only updated when we fetch the stations from our server. 

```
var app = new Vue({
    el: '#app',
    data: {
        lastUpdated: null,
        stations: []
    },
    beforeMount: function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function() {
                console.log('ServiceWorker registration successful');
            }).catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        }

        this.loadStations();
        this.lastUpdated = localStorage.lastUpdated;
    },
    methods: {
        loadStations: function () {
            var self = this;
            axios.get('/stations.json')
                .then(function (response) {
                    self.stations = response.data;
                    self.lastUpdated = new Date().toLocaleString();
                    localStorage.lastUpdated =  self.lastUpdated;
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
});
```

This will be shown on the `index.html`-file below the logo: 

```
<div id="logo">
    <img src="img/logo.png" alt="MyBike" />
    <p><small>Last Updated: {{lastUpdated}}</small></p>
</div>
```

== Geolocation
We can now install our app and make sure that it loads fast and works offline. Next step is to find the closest station.
We can use the [Geolocation API](https://developers.google.com/maps/documentation/javascript/examples/map-geolocation) and 
get the current position. Once we retrieve it, we can sort the list based on the closest station. 

I used this [Stackoverflow Answer](http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula) 
to calculate the number of kilometers between my coordinations and the ones described for the station.
The distance is set dynamically, so we need to use the [Vue-set method](https://vuejs.org/v2/guide/reactivity.html) and we round it to 1 decimal.

We add the distance to the view: 

```
<small v-if="station.distance">{{station.distance}}km</small>
```

And then we add all functionality to the app.js file to get the current location and sort the stations accordingly.

```
var app = new Vue({
    el: '#app',
    data: {
        position: null,
        lastUpdated: null,
        stations: []
    },
    beforeMount: function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function() {
                console.log('ServiceWorker registration successful');
            }).catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        }
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(this.locatePosition);
        }

        this.loadStations();
        this.lastUpdated = localStorage.lastUpdated;
    },
    methods: {
        deg2rad: function (deg) {
            return deg * (Math.PI / 180)
        },
        getDistanceFromLatLonInKm: function (lat1, lon1, lat2, lon2) {
            var R = 6371;
            var dLat = this.deg2rad(lat2 - lat1);
            var dLon = this.deg2rad(lon2 - lon1);
            var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            return d;
        },
        loadStations: function () {
            axios.get('/stations.json')
                .then(function (response) {
                    this.stations = response.data;
                    this.lastUpdated = new Date().toLocaleString();
                    localStorage.lastUpdated =  this.lastUpdated;
                }.bind(this))
                .catch(function (error) {
                    console.log(error);
                });
        },
        locatePosition: function (position) {
            this.position = position.coords;
            this.sort();
        },
        sort: function() {
            for(var i in this.stations) {
                var distance = this.getDistanceFromLatLonInKm(this.stations[i].lat, this.stations[i].lon, this.position.latitude, this.position.longitude);
                Vue.set(this.stations[i], 'distance', Math.round(distance * 10) / 10);
            }
            this.stations.sort(function(a, b) {
                return a.distance - b.distance;
            });
        }
    }
});
```

## Push Notifications
For our final touch, we implement push notifications to engage users to use our app. Push notifications for progressive web apps work in 2 parts: [Web Notifications](https://notifications.spec.whatwg.org) and the [Push API](https://w3c.github.io/push-api).
Web notifications look like this: 

[image:Web Notifications](./img/notifications.png)

We can show this, when a push-event is triggered in our service worker:

```
self.addEventListener('push', function(event) {
    event.waitUntil(self.registration.showNotification('MyBike', {
        body: event.data.text(),
        icon: 'img/icon-192.png'
    }));
});
```
Service workers can be triggered, even if the user is not using our app at the moment. If the user clicks on the push notification, we want him to go 
back to the app. 

```
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://www.velo-antwerpen.be/en/news')
    );
});
```

Now that we have to notification part right, we should subscribe our user to push notifications from our app. First we change the index.html: 

```
<div id="logo">
    <img src="img/logo.png" alt="MyBike" />
    <p>
        <small v-if="lastUpdated">Last Updated: {{lastUpdated}} -
            <a v-if="!subscription" href="javascript:void(0)" v-on:click="subscribe()">Enable notifications</a>
            <a v-if="subscription" href="javascript:void(0)" v-on:click="unsubscribe()">Disable notifications</a>
        </small>
    </p>
</div>

<div v-if="subscription" class="info">
    {{subscription}}
</div>
```

We now show enable/disable push notifications so the user can toggle his subscription. If we have a subscription we 
show it on the page, so we can later copy it to test the push notification. As you can see, there are 2 new functions here: subscribe() and unsubscribe(). 
Let's implement this in our app.js: 

```
subscribe: function() {
    const publicKey = "<YOUR_PUBLIC_KEY>"
    const applicationServerKey = this.urlB64ToUint8Array(publicKey);
    this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    }).then(function(subscription) {
        console.log('User is subscribed.');
        this.subscription = subscription;
    }.bind(this));
},
unsubscribe: function() {
    this.swRegistration.pushManager.getSubscription()
        .then(function(subscription) {
            if (subscription) {
                subscription.unsubscribe();
                this.subscription = null;
                console.log('User is unsubscribed.');
            }
        }.bind(this))
},
urlB64ToUint8Array: function (base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
```
In order to send push notifications, we need to have a push notification server. We will use Google's [Push Companion](https://web-push-codelab.appspot.com/) website for this. 
In the above code, replace "<YOUR\_PUBLIC\_KEY>" with the public key that is generated for you on the Push Companion website: 

[image:web companion site](./img/web_companion_site.png)

Reload the MyBike-application and press 'Enable notifications'. After a few moments, the text should switch to 'Disable notifications', meaning that we are now subscribed, and you can 
disable them again when needed. The subscription itself is shown in blue.

[image:subscription info](./img/push_subscription_info.png)

Copy the subscription and paste it in the Push Companion site:

[image:send push message](./img/send_push_message.png)

You should now see the same notification message as before, but then triggered by the push notification service. 

## Conclusion
PWAs are not a replacement for native apps. Native apps will always have better integration with the mobile OS. Where PWAs will help, is anwser the 
question if it is still relevant to build a native apps that is just a container around already existing web content. This means we both 
get better quality web apps and better quality native apps. 

You can transform any web application to a progressive web app in a few hours. While they won't work on all platforms yet, they can 
add value today we're they do work. PWAs, but especially service workers, are an exciting development to make the web better. 
