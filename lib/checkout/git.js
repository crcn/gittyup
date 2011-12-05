var child_process = require('child_process'),
exec = child_process.exec,
spawn = child_process.spawn,
EventEmitter = require('events').EventEmitter;

exports.test = function(ops) {
	return ops.source.split('.').pop() == 'git';
}

exports.checkout = function(ops, callback) {
	console.log('using git to check out ' + ops.source);
	
	var git = spawn('git',[ 'clone',ops.source,ops.output], { cwd: __dirname }),
	em = new EventEmitter(),
	err = false;


	git.stdout.on('data', function(data) {
		em.emit('data', data.toString());
	});

	git.stderr.on('data', function(data) {
		em.emit('error', data.toString());
		err = true;
	})

	git.on('exit', function() {
		callback(err, { result: true, link: true });
	});

	return em;
}