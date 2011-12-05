var prettyjson = require('./prettyjson');

exports.decode = function(string)
{
    return JSON.parse(string);
}

exports.encode = function(config)
{
    return prettyjson(JSON.stringify(config))
}