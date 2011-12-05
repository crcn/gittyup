var config = require('../lib').file('./yay.json');

config.set('address:zip',90218);


console.log(config.get('address:zip'));