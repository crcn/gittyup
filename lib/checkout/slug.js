var slug = require('../slug'),
Url = require('url')

exports.test = function(ops)
{
	return (Url.parse(ops.source).pathname || '').split('.').pop() == 'slug';
}

exports.checkout = function(ops, callback)
{
	slug.checkout(ops.source, ops.output, function(err, result)
	{
		callback(err, result);
	});
}