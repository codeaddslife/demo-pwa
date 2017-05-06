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

