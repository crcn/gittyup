var Structr = require('structr'),
checkout = require('./checkout'),
link = require('./link'),
nodefs = require('node-fs'),
exec = require('child_process').exec,
fs = require('fs'),
Process = require('./process'),
slug = require('./slug');


var App = Structr({
		
	/**
	 */

	'override __construct': function(gittyup, ops)
	{
		this._super();

		//max number of items to keep tabs on
		this.maxRecords = ops.maxRecords || 10;


		//what's handling the app
		this._gup = gittyup;

		//where are all the apps located?
		this.appsDir = gittyup.dirs.apps;

		//the name of the app
		this.name = ops.name;


		//if ID is passed - use that for the directory. Easier changing an app name 
		//and keeping the folders separate.
		this._id = ops._id || ops.name;


		this.appDir = this.appsDir + '/' + this._id,
		this.currentDir = this.appDir + '/current',
		this.historyDir = this.appDir + '/history';


		this.group = ops.group || '';
        
		try
		{
			nodefs.mkdirSync(this.historyDir, 0755, true);
		}
		catch(e)
		{
			
		}
	},

	/**
	 */

	'process': function(callback)
	{		
		var self = this;

		this.current(function(err, result)
		{
			if(err || !result) return callback(err, result);

			callback(err, new Process(self, result));
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
			callback(err, result);
		}

		var  output = ops.dir || (self.historyDir + '/' + Date.now()),
		appDir = output + '/app',
		slugDir = output;// + '/slugs';

		
		nodefs.mkdirSync(appDir, 0755, true);
		nodefs.mkdirSync(slugDir, 0755, true);


		//need to get the previous item for the version / count
		self.current(function(err, previous)
		{

			//checkout the source which could be from a number of sources
			var ret = checkout({ source: source, app: self, output: appDir }, function(err, response)
			{
				console.log('checked out: ' + source);
			
				if(err) return callback(err, response ? response.result : undefined);


				var app = {


					//where the root app is living
					rootDir: output,

					//where the physical app sources are
					appDir: appDir,

					//where the transportable slug is
					slugDir: slugDir,

					//the application ID, or name
					app: self._id,

					//the release number ~ how many times has the app been committed?
					release: previous ? previous.release + 1 : 1, 

					//when was the checkout created?
					createdAt: Date.now()
				},
				                  
				                       
				//don't want to link the app in some cases ~ slugs for one...
				linkApp = response.link;




				//add the info the checked out items so we have reference to what's up - backups, etc.
				self._gup.checkouts.insert(Structr.copy(app, ops.data, true), function(err, items)
				{
					var item = items[0];                            

					//NOW that the item has been inserted, it's the *new* current item.
					self.use(item._id, function(err, item)
					{

						if(err) return callback(err, item);
	                    
	                    //next up, get the checkout history so we don't take up too much shit
						self.history(function(e, items)
						{
							while(items.length > self.maxRecords)
							{
								self.remove(items.pop()._id);
							}
						});

						self.makeSlug(function(){});
                                            
						
						console.log('linking new app: ' + source);
                        
      					
						var linked = linkApp ? link(item, function(err, result)
						{
							if(err)
							{
								//rollback immediately.
								self.rollback();
								return callback(err);
							}

							onCheckout(err, item);
						}) : false;


						//not linked? no prob
						if(!linked)
						{
							onCheckout(err, item);
						}                                      
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

			exec('sudo rm -rf ' + item.rootDir, callback)
		})	
	},

	/**
	 * history of all current repositories
	 */

	'history': function(callback)
	{
		//newest first
		this._gup.checkouts.find({ app: this._id }, { sort: { createdAt: -1 } }, function(err, items)
		{
			/*items.sort(function(a,b)
			{
				return a.createdAt < b.createdAt;
			})*/

			callback(err, items);
		});
	},

	/**
	 * uses a stored repository. As good as a rollback
	 */

	'use': function(repoId, callback)
	{
		var self = this;

		this._gup.checkouts.update({ _id: repoId }, { $set: { lastUsed: Date.now() }}, function(err, updated)
		{
			if(err || !updated.length) return callback(err || !updated.length);     
			                    


			console.log('using %s created at %s', updated[0].appDir, new Date(updated[0].createdAt));

			exec('rm '+self.currentDir+'; ln -s ' + updated[0].appDir + ' '+ self.currentDir, function(err, result)
			{
				if(err) return callback(err);

				callback(err, updated[0]);
			});
		});
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

			callback(false, item);
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
	 * destroys everything about the app locally
	 */

	'destroy': function(callback)
	{
		var self = this;


		this.process(function(err, proc)
		{
			if(proc) proc.stop();

			var self = this;
			

			exec('rm -rf ' + this.appDir, callback);
		});
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
	}

});


module.exports = App;