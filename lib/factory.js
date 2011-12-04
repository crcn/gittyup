var fs = require('fs');

module.exports = function(directory, factory)
{
	var modules = [];

	fs.readdirSync(directory).forEach(function(file)
	{
		if(file.substr(0, 5) == 'index' || file.split('.').pop() != 'js') return;

		modules.push(require(directory + '/' + file));
	});


	return function(ops, callback)
	{
		for(var i = modules.length; i--;)
		{
			var m = modules[i];

			if(m.test(ops))
			{
				return factory(ops, m, callback) || true;
			}
		}

		return false;
	}
}