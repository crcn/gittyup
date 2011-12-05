var Structr = require('structr'),
beet = require('beet');


var Process = module.exports = Structr({
	
	/**
	 */

	'__construct': function(app, current) {

		this.current = current;

		this.appName = app.name;

		//name of the process                                                                                                                                                                    
		this.processId = this.appName;

		this.app = app;

		this.config = beet.configuration(app.currentDir + '/supervisord.conf');
	},

	/**
	 */

	'start': function(callback) {
		var programs = this.config.get('program');

		if(programs) {
			for(var programName in programs) {
				//skip if already present
				if(programName.indexOf(this.processId + '_') == 0) continue;
                                                                     	
				var name = this.processId + '_' + programName;
				
				//prepend the procid to the process name so it's not overriding anything specific
				var cfg = programs[name] = programs[programName];

				cfg.directory = this.app.currentDir;     
				cfg.name = name;
				
				this.config.setProgramDefaults(cfg);

				delete programs[programName]; 
			}
			
			this.config.save();
		} else {
			this.config.addProgram({ script: this.current.appDir, name: this.processId, environment: this.current.environment });
		}

		this.config.enable(callback);
	},

	/**
	 */

	'stop': function(callback) {
		this.config.disable(callback);
	},

	/**
	 */

	'restart': function(callback) {
		var self = this;
		this.stop(function() {
			console.log('Stopped');
			self.start(function(err, stdout, stderr) {
				console.log("Started");
				if(callback) callback(err, stdout, stderr);
			})
		})
	},


});