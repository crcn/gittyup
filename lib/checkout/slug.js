var slug = require('../slug');

exports.test = function(ops)
{
	return ops.source.split('.').pop() == 'slug';
}

exports.checkout = function(ops, callback)
{
	slug.checkout(ops.source, ops.output, function(err, result)
	{
		callback(err, result);
	});
}