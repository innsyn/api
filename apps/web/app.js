/* Copyright 2019 Schibsted */

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const routes = require('./routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

app.use(routes);

// error handler - will echo stacktrace on development
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(res.statusCode || 500);
    res.json({ message: err.message, error: err });
  });
}

// production error handler - no stacktraces leaked to caller
app.use(function(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({ message: err.message });
});

module.exports = app;
