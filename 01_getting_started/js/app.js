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
            axios.get('/stations.json')
                .then(function (response) {
                    this.stations = response.data;
                }.bind(this))
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
});