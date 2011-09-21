var gittyup = require('../lib/index'),
app = gittyup.app( { name: 'test', group: 'root' });


app.checkout('git@github.com:spiceapps/gittyup-test.git', function(err, result)
{
    app.makeSlug(function(err, item)
	{
		console.log(item);
	});
	
})

//console.log("GO")
	