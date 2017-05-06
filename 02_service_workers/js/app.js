var app = new Vue({
    el: '#app',
    data: {
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

