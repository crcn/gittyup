var Structr = require('Structr'),
App = require('./app'),
gumbo = require('gumbo');



var Gittyup = Structr({
	
	/**
	 */

	'__construct': function()
	{
		this.dirs = {
			apps: '/etc/gittyup/apps',
			db: '/etc/gittyup/db'
		};


		this.db = gumbo.db({
			persist: {
				fs: this.dirs.db
			}
		});

		this.checkouts = this.db.collection('checkouts');
	},

	/**
	 */

	'app': function(appName, groupName)
	{
		return new App(this, appName, groupName);
	}
});


module.exports = new Gittyup();