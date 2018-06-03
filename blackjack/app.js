define(['./blackjack'],(blackjack) => {
  return blackjack;
});

function gradient_descent() {
  console.log('hello!');
  (() => {
    const f = (x) => x*x + 5;
    const df = (x) => 2*x;
    gradientDescent(f, df);
  })();


  (() => {
    const f = (x) => x*x + 5;
    const df = (x) => 2*x;
    gradientDescent(f, df);
  })();
}

/**
 * Gradient descent of a single argument
 *
 * https://gist.github.com/marcouberti/1ef7cb046d7302630c5efad08a34c0ea
 *
 */
function gradientDescent(f, df) {
  var x = Math.random()*10000;
  var learning_rate = 0.1;
  var epochs = 100;
  var gradient;

  for(var e=1; e<epochs; e++) {
    gradient = df(x);
    x -= learning_rate * gradient;
    console.log("f(x) = "+f(x).toFixed(2)+" x = "+x.toFixed(2));
  }
}
// traveling salesman
// Trading
// Gridworld
// Fake news website: Faceswap images, generative text. Sentiment inversion, entity swap, mad libs style
//
