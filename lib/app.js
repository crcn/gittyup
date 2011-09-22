var Structr = require('structr'),
checkout = require('./checkout'),
link = require('./link'),
nodefs = require('node-fs'),
exec = require('child_process').exec,
fs = require('fs'),
EventEmitter = require('sk/core/events').EventEmitter,
Process = require('./process'),
slug = require('./slug');


var App = EventEmitter.extend({
		
	/**
	 */

	'override __construct': function(gittyup, ops)
	{
		this._super();

		//max number of items to keep tabs on
		this.maxRecords = ops.maxRecords || 20;


		//what's handling the app
		this._gup = gittyup;

		//where are all the apps located?
		this.appsDir = gittyup.dirs.apps;

		this.appDir = this.appsDir + '/' + ops.name;

		//the name of the app
		this.name = ops.name;

		this.group = ops.group || '';
        
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

	'process': function(callback)
	{		
		this.current(function(err, result)
		{
			if(err || !result) return callback(err, result);

			callback(err, new Process(result));
		})
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
			self._update();
			callback(err, result);
		}

		var  output = ops.dir || (self.appDir + '/' + Date.now()),
		appDir = output + '/app',
		slugDir = output;// + '/slugs';

		
		nodefs.mkdirSync(appDir, 0755, true);
		nodefs.mkdirSync(slugDir, 0755, true);


		//need to get the previous item for the version / count
		self.current(function(err, previous)
		{

			//checkout the source which could be from a number of sources
			var ret = checkout({ source: source, app: self, output: appDir }, function(err, result)
			{
				console.log('checked out: ' + source);
			
				if(err) return callback(err, result);


				var app = {


					//where the root app is living
					rootDir: output,

					//where the physical app sources are
					appDir: appDir,

					//where the transportable slug is
					slugDir: slugDir,

					//the application name
					app: self.name,

					//the release number ~ how many times has the app been committed?
					release: previous ? previous.release + 1 : 1, 

					//when was the checkout created?
					createdAt: Date.now(),

					//used to determine what app to use. Can toggle back and forth between repos
					lastUsed: Date.now()
				};


				//add the info the checked out items so we have reference to what's up - backups, etc.
				self._gup.checkouts.insert(app, function(err, items)
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
	                    

						console.log('linking new app: ' + source);

						var linked = link(item, function(err, result)
						{
							if(err)
							{
								//rollback immediately.
								self.rollback();
								return callback(err);
							}

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
		})
			
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

			console.log('Removing repo %s', item.appDir)

			exec('rm -rf ' + item.rootDir, callback)
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

		self._update();
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

			self._update();
		});
	},

	/**
	 * slug for passing from server to server
	 */

	'makeSlug': function(callback)
	{
		var self = this;

		this.current(function(err, item)
		{
			//err, no item, OR slug exists? return
			if(err || !item || item.slug) return callback(err, item);

			
			var slugPath =  item.slugDir + '/' + item._id + '.tar.gz';

			slug.write(item.appDir, slugPath, function(err, result)
			{
				//success making the slug?
				if(!err)
				{

					//then update the current item with the new slug
					return self._gup.checkouts.update({ _id: item._id }, { $set : { slug: slugPath }}, function(err, result)
					{
						self.current(callback);
					});
				}

				//error
				callback(err, result);
			});
		});
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

			self.processController.remove(self.name, callback);
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
		
		self._remove();

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


			//no tester? no worries.
			if(!item.package || !item.package.scripts || !item.package.scripts.test) return callback('test script does not exist');


			exec(item.package.scripts.test, { cwd: item.path }, callback);
		});
	},



	/**
	 */

	'_update': function()
	{
		this.emit('update');	
	},

	/**
	 */

	'_remove': function()
	{
		this.emit('remove');
	}

});


module.exports = App;