var nodefs = require('node-fs'),
fs  = require('fs'),
path = require('path'),
jsonPersistence = require('./persist/json'),
EventEmitter = require('events').EventEmitter;


exports.file = function(source, persistence)
{
    if(!persistence) persistence = jsonPersistence;
    
    nodefs.mkdirSync(path.dirname(source), 0755, true);
    
    var config = {}, timeout, emitter = new EventEmitter();
    
    
    try
    {
        config = persistence.decode(fs.readFileSync(source, 'utf8'));
    }
    catch(e)
    {
    }
    
    function value(key, value)
    {
        var chain = key.split(':'), prop, current = config, prev = config;
        
        while(chain.length)
        {
            prop = chain.shift();
            prev = current;
            
            if(!current[prop] && chain.length > 0) current[prop] = {};
            
            current = current[prop];
        }
        
        if(arguments.length == 1) return current;
        
        saveLater();
        
        return prev[prop] = value;
    }
    
    function saveNow()
    {
        fs.writeFileSync(source, persistence.encode(config));

        emitter.emit('save');
    }
    
    function saveLater()
    {
        clearTimeout(timeout);
        timeout = setTimeout(saveNow, 500);
    }
    
    return {
        get: value,
        set: value,
        save: saveNow,
        on: function(type, callback)
        {
            emitter.addListener(type, callback);

            return {
                dispose: function()
                {
                    emitter.removeListener(type, callback);
                }
            }
        }
    }
};