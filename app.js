var express = require('express');
var app = express();
var path = require('path');
require("jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }

    var $ = require("jquery")(window);
});
app.use(express.static(path.join(__dirname, 'lib')));

//our only route
app.get('/', function (req, res) {
   res.sendFile(__dirname + '/index.html');
})
app.get('/consulta', function (req, res) {
   res.sendFile(__dirname + '/paginaConsulta.html');
})

var server = app.listen(process.env.PORT || 5000, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
