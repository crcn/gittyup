var Structr = require('structr'),
App = require('./app'),
gumbo = require('gumbo');



var Gittyup = Structr({
	
	/**
	 */

	'__construct': function(root) {
		this.dirs = {
			apps: root + '/apps',
			db:  root + '/db'
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

	'app': function(opsOrName) {
		var ops = {};

		if(typeof opsOrName == 'string') {
			ops.name = opsOrName;
		} else {
			ops = opsOrName;
		}


		return new App(this, ops);
	},

	/**
	 */
});


module.exports = function(root) {
	 return new Gittyup(root || '/etc/gittyup/');
}