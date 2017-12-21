var ghpages = require('gh-pages');

ghpages.publish('examples/simply/dist')
.then(function() {
  console.log('Published to gp');
})
.catch(function(e) {
  console.log("Error while publishing to gp");
  console.log(e);
  process.exit(1);
});
