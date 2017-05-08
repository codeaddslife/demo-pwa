var app = new Vue({
    el: '#app',
    data: {
        position: null,
        lastUpdated: null,
        stations: [],
        subscription: null,
        swRegistration: null
    },
    beforeMount: function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('ServiceWorker registration successful');
                this.swRegistration = registration;
                registration.pushManager.getSubscription()
                    .then(function(subscription) {
                        this.subscription = subscription;
                    }.bind(this));

            }.bind(this)).catch(function(err) {
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
        },
        subscribe: function() {
            const applicationServerKey = this.urlB64ToUint8Array("BBguu1xylfbRVZa3LYuaIgg5wqDa4bGUE4DGY4ZSLehyfn4e7ZEv3IO9gmxWkpzBJHoNyCxJICRm_E7_uKLUtJ0");
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
    }
});

