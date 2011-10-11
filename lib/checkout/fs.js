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
	console.log('Copying local repository to tmp directory');
	
	exec('cp -r ' + ops.source + '/* ' + ops.output, function(err, result)
	{                     
		console.log('Done copying');
		
		callback(err, result);
	});
}