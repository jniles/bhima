const api = require('express').Router();

// GET /v2/depots/:uuid/levels/current-stock
// GET /v2/depots/:uuid/levels/expired-stock
// GET /v2/depots/:uuid/average-monthly-consumption

// GET /v2/depots/:uuid/movements/incoming-transfers
// GET /v2/depots/:uuid/movements/outgoing-transfers

// This one gets everything.
// GET /v2/stock/

// This is 
// GET /v2/depots/:uuid/dashboard

// AMC - Average monthly consumption 
// GET /v2/inventory/:uuid/stock-value

module.exports = api;
