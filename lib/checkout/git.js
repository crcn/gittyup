var child_process = require('child_process'),
exec = child_process.exec;

exports.test = function(ops)
{
	return ops.source.split('.').pop() == 'git';
}

exports.checkout = function(ops, callback)
{
	var dir = ops.dir || (ops.app.appDir + '/' + Date.now());

	console.log('using git to check out ' + ops.source);

	exec('git clone ' + ops.source + ' ' + dir, { cwd: __dirname }, function(err, result)
	{
		callback(err, { path: dir });
	});
}