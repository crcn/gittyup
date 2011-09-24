var Structr = require('structr'),
beet = require('beet');


var Process = module.exports = Structr({
	
	/**
	 */

	'__construct': function(app, current)
	{

		this.current = current;
		this.appName = current.app;


		//name of the process
		this.processName = current.app;

		this.app = app;

		this.config = beet.configuration(app.currentDir + '/supervisord.conf');
	},

	/**
	 */

	'start': function(callback)
	{
		var programs = this.config.get('program');
        
		if(programs)
		{
			for(var programName in programs)
			{

				//prepend the appname to the process name so it's not overriding anything specific
				var cfg = programs[this.processName + '.' + programName] = programs[programName];

				cfg.directory = this.app.currentDir;

				delete programs[programName]; 
			}
			
			this.config.save();
		}
		else
		{
			this.config.appProgram({ script: this.current.appDir, name: this.appName, environment: this.current.environment }, callback);
		}


	},

	/**
	 */

	'stop': function(callback)
	{
		//this.group.remove(this.appName, callback);
	},

	/**
	 */

	'restart': function(callback)
	{
		//this.group.restart(this.appName, callback);
	}

});