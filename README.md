Gittyup is a node.js deplyment utility with some slick features:

- Rollback support.
- Script testing before deployment.
- Start/Stop/Restart checked out apps.
- Make a slug out of your app and easily move it quickly between servers.


### To Do:

- Storage transports: rackspace, amazon aws, etc
- .slugignore



## Documentation


### .gittyup(rootDirectory)

root directory by default is /etc/gittyup/

```javascript

var gittyup = require('gittyup')('/etc/bonsai/garden/'),
app = gittyup.app('myApp');


app.checkout('myProjectSource', function(err, result)
{

	//something went wrong in the checkout phase - most likely in linking, rollback
	if(err) return app.rollback();
	
	//test to make sure everythings good
	app.test(function(err, result)
	{
		//something went wrong in the testing phase, rollback
		if(err) return app.rollback();


		//start upp the application
		app.process(function(err, process)
		{
			process.start();
		});
	});
});

//...

```


### .app(ops)

First argument can be either a string (app name), or object

#### arguments
	
* `name` - The name of the application.
* `group` - The group the application is in.
* `maxRecords` -  Maximum number of application records to keep locally.


### .app().checkout(source, callback)

From a git repository:

```javascript

gittyup.app('myApp').checkout('git@github.com:spiceapps/gittyup-test.git', function(err, result)
{
	//do stuff!
});

```

From a generated slug:

```javascript

gittyup.app('myApp').checkout('http://mydomain.com/someApp.slug', function(err, result)
{
});

```

From a local directory:

```javascript

gittyup.app('myApp').checkout('/some/local/path', function(err, result)
{
	
});

```

### .app().process(callback)

Returns a runnable process of the most recent checked out item.


````javascript


gittyup.app('myApp').process(function(err, process)
{

	process.start(function(err, result)
	{
		//...
	});

	process.stop(function(err, result)
	{
		//...
	});

	process.restart(function(err, result)
	{
		//...
	});
});


```

#### .app().test(callback)

Tests the most recent checked out item. Make sure to include "scripts:test" in your package.json. Something like:

```javascript


{
    "name": "myApp",

    "scripts": {
    	"test": "./test"
    }
}
````

When exiting the test program, an exit code of 0 tells gittyup the test was successful, whereas 1 tells gittyup the test failed.

### .app().makeSlug(callback)

Makes a slug out of the most recent checkout. Use this method if you need to move the application around between servers. 
Once a slug is made, calling "makeSlug" on the same checkout will have no effect.


```javascript

gittyup.app('myApp').makeSlug(function(err, item)
{
	console.log(item.slug); // /etc/gittyup/apps/myApp/16767565434/slug/753a644f4e7aaa7fc9132be92d000002.tar.gz

});

```

If you're moving the slug around, install gittyup on the other end and have something ready like this:

```javascript

gittyup.app('myApp').checkout('http://myServer.com/myApp.slug', function(err, result)
{
	//...do stuff with transported slug
})

```



### .app().current(callback)

Returns Information about the current checked out item.

### .app().history(callback)

Returns checkout history of the given application.

### .app().use(checkoutId)

Uses a previously used checkout item without removing the current one.

### .app().remove(checkoutId, callback)

Removes a checked out item.

### .app().destroy(callback)

Destroys the application, and all the checked out items.




