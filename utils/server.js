// init express
var express = require('express');
var app = express();

// create an error with .status.
function error(status, msg) {
    var err = new Error(msg);
    err.status = status;
    return err;
}

// routes
app.get('/', function(req, res){
    res.sendfile('index.html');
});

// serves all the static files
app.get(/^(.+)$/, function(req, res){ 
    // console.log('static file request : ' + req.params);
    res.sendfile( __dirname + req.params[0]); 
});

app.use(function(err, req, res, next){
    // whatever you want here, feel free to populate
    // properties on `err` to treat it differently in here.
    res.status(err.status || 500).send({ error: err.message });
});

app.use(function(req, res){
    res.status(404).send({ error: "404 Error." });
});

// start the server
var server = app.listen(8080, function() {
    console.log('Listening on port %d', server.address().port);
});
