Gittyup is a node.js deplyment utility with some slick features:

- Rollback support
- Script testing before deployment
- Supports any language (I Think...)


Example:

```javascript


var gittyup = require('gittyup'),
app = gittyup.app('test-app');

app.checkout('git@github.com:spiceapps/gittyup-test.git', function(err, result)
{
	

	//test to make sure it's working properly
	app.test(err, result)
	{
		if(err)
		{
			//rollback to the last working repo.
			return app.rollback();
		}	

		//start with supervisord!
		app.start(function(err, result)
		{
			if(!err) console.log('started gittyup-test!');
		});
	});


	
});
