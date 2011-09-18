var fs = require('fs'),
handlers = [];


fs.readdirSync(__dirname).forEach(function(file)
{
	if(file.substr(0, 5) == 'index' || file.split('.').pop() != 'js') return;

	handlers.push(require('./' + file));
});


module.exports = function(ops, callback)
{
	for(var i = handlers.length; i--;)
	{
		var h = handlers[i];

		if(h.test(ops)) return h.checkout(ops, callback);
	}
}



