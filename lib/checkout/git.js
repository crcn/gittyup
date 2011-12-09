var child_process = require('child_process'),
exec = child_process.exec,
spawn = child_process.spawn,
EventEmitter = require('events').EventEmitter;

exports.test = function(ops) {
	return ops.source.split('.').pop() == 'git';
}

function execute(args, ops, callback) {

	var git = spawn(args.shift(), args, { cwd: ops.cwd }),
	em = ops.em,
	err = false;


	git.stdout.on('data', function(data) {
		em.emit('data', data.toString());
	});

	git.stderr.on('data', function(data) {
		em.emit('error', data.toString());
		// err = true;
	})

	git.on('exit', function() {
		callback(err, { result: true, link: true });
	});
}


exports.checkout = function(ops, callback) {
	console.log('using git to check out ' + ops.source);

	var em = new EventEmitter();


	execute(['git'].concat([ 'clone', ops.source, ops.output]), { cwd: __dirname, em: em }, function(err, result) {

		if(err) return callback(err, result);


		if(ops.branch) {
			console.log('Switching branch');

			execute(['git','checkout', ops.branch], { cwd: ops.output, em: em }, callback);
		} else {
			callback(err, result);
		}
	})
	

	return em;
}