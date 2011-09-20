var fs = require('fs'),
exec = require('child_process').exec;

//checkout via file system. GREAT for testing locally first.

exports.test = function(ops)
{
	try
	{
		return fs.lstatSync(ops.source);
	}
	catch(e)
	{
		return null;
	}
}

exports.checkout = function(ops, callback)
{
	console.log(ops.source);

	exec('cp -r ' + ops.source + '* ' + ops.output, function(err, result)
	{
		console.log(err)

		callback(err, result);
	});
}