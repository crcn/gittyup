var Structr = require('structr'),
beet = require('beet');


var Process = module.exports = Structr({
	
	/**
	 */

	'__construct': function(current)
	{
		this.current = current;
		this.group = beet.group(current.group);
	},

	/**
	 */

	'start': function(callback)
	{
		this.group.add({ directory: this.current.path, command: 'node ./', name: this.current.name }, callback);
	},

	/**
	 */

	'stop': function(callback)
	{

		this.group.remove(this.current.name, callback);
	},

	/**
	 */

	'restart': function(callback)
	{
		this.group.restart(this.current.name, callback);
	}

});