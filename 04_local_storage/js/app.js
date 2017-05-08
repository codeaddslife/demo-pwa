var app = new Vue({
    el: '#app',
    data: {
        lastUpdated: null,
        stations: []
    },
    beforeMount: function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
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
            axios.get('/stations.json')
                .then(function (response) {
                    this.stations = response.data;
                    this.lastUpdated = new Date().toLocaleString();
                    localStorage.lastUpdated =  this.lastUpdated;
                }.bind(this))
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
});

