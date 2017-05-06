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