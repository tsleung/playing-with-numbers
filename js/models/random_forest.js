define([], function() {
  return () => {

  };
});

/**
 * Create a random forest which can incrementally learn
 *
 * Based on the Mondrian random forest:
 * https://papers.nips.cc/paper/5234-mondrian-forests-efficient-online-random-forests.pdf
 * http://danroy.org/papers/RoyTeh-NIPS-2009.pdf
 * http://videolectures.net/icml08_roy_tmp/
 *
 */
function create_random_forest(inputs, outputs, depth, size) {
  // create as many trees as the size
  // randomize samples during training to the trees
  // randomize the features sent to trees (order of features, how many of them)
}
