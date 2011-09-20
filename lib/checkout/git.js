var child_process = require('child_process'),
exec = child_process.exec;

exports.test = function(ops)
{
	return ops.source.split('.').pop() == 'git';
}

exports.checkout = function(ops, callback)
{
	console.log('using git to check out ' + ops.source);

	exec('git clone ' + ops.source + ' ' + ops.output, { cwd: __dirname }, function(err, result)
	{
		callback(err, result);
	});
}