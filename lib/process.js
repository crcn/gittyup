var Structr = require('structr'),
beet = require('beet');


var Process = module.exports = Structr({
	
	/**
	 */

	'__construct': function(current)
	{
		this.current = current;
		this.group = beet.group(current.group);
		this.appName = current.app;
	},

	/**
	 */

	'start': function(callback)
	{
		this.group.add({ directory: this.current.appDir, command: 'node ./', name: this.appName }, callback);
	},

	/**
	 */

	'stop': function(callback)
	{
		this.group.remove(this.appName, callback);
	},

	/**
	 */

	'restart': function(callback)
	{
		this.group.restart(this.appName, callback);
	}

});