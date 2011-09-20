var Structr = require('structr'),
checkout = require('./checkout'),
link = require('./link'),
nodefs = require('node-fs'),
exec = require('child_process').exec,
fs = require('fs'),
beet = require('beet');


var App = Structr({
		
	/**
	 */

	'__construct': function(gittyup, name, group)
	{

		//max number of items to keep tabs on
		this.maxRecords = 5;


		//what's handling the app
		this._gup = gittyup;

		//where are all the apps located?
		this.appsDir = gittyup.dirs.apps;

		this.appDir = this.appsDir + '/' + name;

		//the name of the app
		this.name = name;

		this.group = group || '';

		try
		{
			nodefs.mkdirSync(this.appDir, 0755, true);
		}
		catch(e)
		{
			
		}
	},

	/**
	 */

	'_beet': function()
	{
		return this.__group || (this.__group = beet.group(this.group));
	},


	/**
	 * checks out the application
	 */

	'checkout': function(ops, callback)
	{
		var source, start;

		if(typeof ops == 'string')
		{
			source = ops;
			ops = {};	
		}
		else
		{
			start = ops.start;
			source = ops.repository;
		}

		if(!callback) callback = function(){};

		var self = this,
		running = false;


		function onCheckout(err, result)
		{
			console.log('done: ' + source);
						
			self.restartIfRunning(start);
			callback(err, result);
		}


		var  output = ops.dir || (self.appDir + '/' + Date.now());

		//checkout the source which could be from a number of sources
		var ret = checkout({ source: source, app: self, output: output }, function(err, result)
		{
			console.log('checked out: ' + source);
		
			if(err) return callback(err, result);


			//add the info the checked out items so we have reference to what's up - backups, etc.
			self._gup.checkouts.insert({ path: output, app: self.name, createdAt: Date.now(), lastUsed: Date.now() }, function(err, items)
			{
				var item = items[0];

				//next up, get the checkout history so we don't take up too much shit
				self.history(function(e, items)
				{
					//pop the oldest one off...
					if(items.length > self.maxRecords)
					{
						self.remove(items.pop()._id);
					}
				});



				//NOW that the item has been inserted, it's the *new* current item.
				self.current(function(err, item)
				{
					if(err) return callback(err, item);
                    
                    //var link = 

					//link up the current dep - it doesn't matter though
					//if(!item.package || !item.package.scripts || !item.package.scripts.link) return onCheckout(err, item);


					console.log('linking new app: ' + source);

					var linked = link(item, function(err, result)
					{
						if(err) return callback(err);

						onCheckout(err, item);
					});


					//not linked? no prob
					if(!linked)
					{
						onCheckout(err, item);
					}

					//so we need to link the item. TODO ~ detect the type of language running 
					/*exec('sudo npm link', { cwd: item.path }, function(err, result)
					{
						if(err) return callback(err);

						onCheckout(err, item);
					});*/
				});	
			});
		});		


		if(!ret) return callback('Cannot handle repo: '+ source);
			
	},

	/**
	 * removes an old repo
	 */

	'remove': function(checkoutId, callback)
	{
		if(!callback) callback = function(){}

		var self = this;

		this._gup.checkouts.findOne({ _id: checkoutId }, function(err, item)
		{
			if(!item) return callback('checkout does not exist');

			self._gup.checkouts.remove({ _id: checkoutId }, function(err, result)
			{
				
			});	

			console.log('Removing repo %s', item.path)

			exec('rm -rf ' + item.path, callback)
		})	
	},

	/**
	 * history of all current repositories
	 */

	'history': function(callback)
	{
		this._gup.checkouts.find({ app: this.name }, function(err, items)
		{
			//oldest last, newest first
			items.sort(function(a, b)
			{
				return a.lastUsed < b.lastUsed;
			});

			callback(err, items);
		});
	},

	/**
	 * uses a stored repository. As good as a rollback
	 */

	'use': function(repoId, callback)
	{
		this._gup.checkouts.update({ _id: checkoutId }, { $set: { lastUsed: Date.now() }});

		self.restartIfRunning();
	},

	/**
	 * returns the current repo
	 */

	'current': function(callback)
	{
		this.history(function(err, items)
		{
			if(err) return callback(err);

			var item = items[0];

			if(item)
			{
				try
				{
					item.package = JSON.parse(fs.readFileSync(item.path+'/package.json','utf8'));
				}
				catch(e)
				{
				}
			}

			callback(false, items[0]);
		})
	},

	/**
	 * removes from the last checkout
	 */

	'rollback': function(callback)
	{
		if(!callback) callback = function(){};
		var self = this;

		this.current(function(err, item)
		{
			if(err || !item) return callback(err, item);

			self.remove(item._id, callback);

			self.restartIfRunning();
		});
	},

	/**
	 * resets the beet process IF it's up
	 */

	'restart': function(start, callback)
	{
		var self = this;

		this._beet().restart(this.name, callback);	
	},

	/**
	 */

	'restartIfRunning': function(start)
	{
		this._beet().process(this.name, function(err, item)
		{
			if(!!item || start) self.start();
		});
	},

	/**
	 */

	'start': function(callback)
	{
		if(!callback) callback = function(){};
		var self = this;

		this.current(function(err, item)
		{
			if(err || !item) return callback('Unable to start app');



			self._beet().add({ directory: item.path, command: 'node ./', name: self.name }, function(err, result)
			{

				//hacky.
				setTimeout(function()
				{
					
					self._beet().start(self.name, callback);
				}, 2000);
			});
		})
	},

	/**
	 */

	'stop': function(callback)
	{
		console.log('stopping gittyup app: %s ', this.name);

		if(!callback) callback = function(){};
		var self = this;

		this.current(function(err, item)
		{
			if(err || !item) return callback('Unable to stop app');

			self._beet().remove(self.name, callback);
		})
	},

	/**
	 * destroys everything about the app locally
	 */

	'destroy': function(callback)
	{

		//stop the app
		this.stop();

		var self = this;

		self._gup.checkouts.remove({ app: this.name }, function(err, result)
		{
			callback(false, true);
					
		});

		exec('rm -rf ' + this.appDir, function(){});
	},

	/**
	 * tests the current checked-out application
	 */

	'test': function(callback)
	{
		this.current(function(err, item)
		{
			if(err) return callback(err);

			if(!item.package || !item.package.scripts || !item.package.scripts.test) return callback('test script does not exist');


			exec(item.package.scripts.test, { cwd: item.path }, callback);
		});
	}

});


module.exports = App;