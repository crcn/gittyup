var Structr = require('structr'),
exec = require('child_process').exec,
nodefs = require('node-fs'),
fs = require('fs'),
http = require('http'),
Url = require('url');

exports.write = function(input, output, callback) {
	exec('cd ' + input + '; tar -pczf ' + output + ' ./*;', callback);
}

//read locally, or from stream
exports.checkout = function(source, output, callback) {

	function onStream(input) {
		var tmpFile = '/tmp/gittyup/slugs/',
		tmpPath = tmpFile + Date.now() + '.tar.gz';


		nodefs.mkdirSync(tmpFile, 0666, true);


		var stream = fs.createWriteStream(tmpPath, { flags: 'w+', encoding: 'binary', mode: 0755 });

		input.on('data', function(chunk) {
			stream.write(chunk);
		});

		input.on('end', function() {
			stream.end();

			exec('cd ' + output + '; sudo tar -xf ' + tmpPath + '; rm ' + tmpPath + ';', function(err, result) {
				callback(err, result);
			})
		});	
	}


	if(typeof source == 'string') {
		if(source.indexOf("://") > -1) {
			var hostParts = Url.parse(source),
			ops = {
				host: hostParts.hostname,
				port: hostParts.port,
				path: hostParts.pathname + hostParts.search
			}

			http.get(ops, onStream).on('error', function(e) {
				callback(e);
			})	
		} else {
			onStream(fs.createReadStream(input));
		}
	} else 
	if(source.on) {
		onStream(source);
	}

	 
}


