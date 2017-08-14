#!/usr/bin/env node
'use strict';

var fs = require('fs');
var	path = require('path');
var app = require('express')();
// var https = require('https');
var qs = require('querystring');

var options = {
  port: 3000,
  // base_path: "/",
}

var getopts = require("node-getopt").create([
	// ['d', 'door', 'GPIO pins to open the door'],
	['s', 'server=', 'Connect to server at address'],
	['t', 'token=', 'Connect to server with token'],
	['p', 'port=',  'Set listen port'],
	['h', 'help',   '']
]).bindHelp();
var opt = getopts.parseSystem();

if (opt.argv.length > 0) {
  console.error("ERROR: Unexpected argument(s): " + opt.argv.join(', '));
  console.error(getopts.getHelp());
  process.exit(1);
}

// Merge opts into options
for (var attrname in opt.options) { options[attrname] = opt.options[attrname]; }

// Load middleware
app.use(require('body-parser').urlencoded({extended: false}));

// app.use(options.base_path)
// app.locals('base_path', options.base_path)

// app.post(options.base_path+'user', function(req, res) {
//   if (!req.body.email) {
//     res.writeHead(400);
//     res.write("must pass email address");
//     res.end();
//     return;
//   }
//
//   var post_data = qs.stringify({
//     email: req.body.email,
//     token: options.token,
//     set_active: true,
//   });
//
//   var post_opts = {
//     method: 'POST',
//     host: options.org + '.slack.com',
//     path: '/api/users.admin.invite?'+post_data,
//   }
//
//   var post = https.request(post_opts, function(p_res) {
//     if (p_res.statusCode !== 200) {
//       res.writeHead(400);
//       res.write("Got unexpected status: " + p_res.statusCode.toString());
//       res.end();
//       return;
//     }
//     var body = ''
//     p_res.setEncoding('utf8');
//     p_res.on('data', function (chunk) {
//       body += chunk;
//     });
//     p_res.on('end', function() {
//       var p_body = JSON.parse(body)
//       res.setHeader('Access-Control-Allow-Origin', options.cors_domain);
//       res.setHeader('Access-Control-Allow-Method', 'POST OPTIONS');
//       if (p_body.ok || p_body.error === 'already_in_team' || p_body.error === 'already_invited') {
//         res.writeHead(200);
//         res.write('invite sent');
//         res.end();
//       } else {
//         // console.log("ERROR:", p_body.error, p_body.warning)
//         res.writeHead(400);
//         res.write(body);
//         res.end();
//       }
//     });
//   });
//   post.end();
// });

// Load all controllers from the api directory.
var controllers = path.join(__dirname, 'api');
fs.readdirSync(controllers).forEach(function(file) {
  require(path.join(controllers, file))(app);
});

app.use(function errorHandler(err, request, response, next) {
  console.log("XXX",err);
  next(err);
});

app.listen(options.port, function() {
  console.log("listening on", options.port);
});

var error = require('./lib/errors')
process.on('unhandledRejection', function(err, promise) {
  if (!(err instanceof error.HandledError))
    console.error("UHR", err, promise);
});
