

var http = require('http');
var https = require('https');
var url = require('url');

var portnum = Number(process.env.PORT || 42042);

http.createServer(function (req,res) {

	// Find header: X-Exosite-CIK: <CIK>
	var CIK = req.headers['x-exosite-cik'];

	var uparsed = url.parse(req.url, true);
	var query = uparsed['query'];

	// TODO: Turn more of the read req params into query items.
	var onepReadReq = {
		procedure: "read",
		arguments: [
			{alias: query['alias']},
			{
				limit: 15
			}
		],
		id: 1
	};
	var onepReqBody = {
		auth: { cik: CIK },
		calls: [
			onepReadReq
			]
	};
	var options = {
		hostname: 'm2.exosite.com',
		path: '/onep:v1/rpc/process',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
	};
	var onepReq = https.request(options, function(onepRes) {
		res.writeHead(onepRes.statusCode);

		var data='';
		onepRes.on('data', function(chunk) {
			data += chunk;
		});
		onepRes.on('end', function(){
			var obj = JSON.parse(data);
			var result = obj[0]['result'];
			res.write('<?xml version="1.0"?>\n<rss version="2.0">\n<channel>\n');
			for(var i=0; i < result.length; i++) {
				res.write('\t<item>');
				res.write('<pubDate>' + result[i][0] + '</pubDate>');
				res.write('<title>' + result[i][1] + '</title>');
				res.write('</item>\n');
			}
			res.write('</channel>\n</rss>\n');
			res.end();
		});
	});
	onepReq.on('error', function(err) {
		console.log('ERROR:');
		console.log(err);
		console.log("\n");
	});
	//console.log('asking: ' + JSON.stringify(onepReqBody) );
	onepReq.write( JSON.stringify(onepReqBody) );
	onepReq.end();

}).listen(portnum);
console.log('Server running on ' + portnum + '\n');

// vim: set cin sw=4 ts=4 :
