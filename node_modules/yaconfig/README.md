Yet Another Config library


##### There's at least a kajillion other libraries that do the same thing - why did you build one?

It look me longer looking for the right one vs just building it.


in my/config.js

````javascript

module.exports = require('yaconf').file('/etc/app/config.json');


````


in my/app.js

```javascript

var cfg = require('./config');


//saved
cfg.save('person:name', Craig );


cfg.get('person:name');// Craig
cfg.get('person');// { name: "Craig" }