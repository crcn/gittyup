var Structr = require('structr'),
beet = require('beet');


var Process = module.exports = Structr({
	
	/**
	 */

	'__construct': function(app, current)
	{

		this.current = current;

		this.appName = app.name;

		//name of the process                                                                                                                                                                    
		this.processId = this.appName;

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
				//skip if already present
				if(programName.indexOf(this.processId+'_') == 0) continue;

				//prepend the procid to the process name so it's not overriding anything specific
				var cfg = programs[this.processId + '_' + programName] = programs[programName];

				cfg.directory = this.app.currentDir;

				delete programs[programName]; 
			}
			
			this.config.save();
		}
		else
		{
			this.config.addProgram({ script: this.current.appDir, name: this.processId, environment: this.current.environment }, callback);
		}

		this.config.enable();
	},

	/**
	 */

	'stop': function(callback)
	{
		this.config.disable();
	},

	/**
	 */

	'restart': function(callback)
	{
		//doesn't work with multiple procs
		//beet.restart(this.processId, callback);
	}

});