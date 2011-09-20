var fs = require('fs'),
exec = require('child_process').exec;

exports.test = function(ops)
{
	var files = fs.readdirSync(ops.path);


	for(var i = files.length; i--;)
	{
		var file = files[i];

		if(file == 'package.json')
		{
			return true;
			/*try
			{
				var config = JSON.parse(fs.readFileSync(ops.path + '/' + file, 'utf8'));

				return config.main.split('.').pop() == 'js';
			}
			catch(e)
			{
				
			} 
			break;*/
		}
	}

	return false;
}


exports.link = function(ops, callback)
{
	console.log("Linking with npm: " + ops.path);

	exec('sudo npm link', { cwd: ops.path }, callback);
}