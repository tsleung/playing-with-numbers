define(['utils/sum'], (sum) => {

  // running tests
  const tests = [
    [[0], 1/3],
    [[1], 2/3],
    [[1,0], .5],
    [[0,1], .5],
    [[1,0,0], .4],
    [[1,0,0,0], 1/3],
    [[1,1,1,0], 2/3],
    [[0,0,0,0], 1/6],
    [[1,1,1,1], 5/6],
  ];
  tests.map(([params, expected]) => {
    return laplace(params) == expected;
  }).filter(Boolean).length === tests.length || (() => {
    throw new Error('laplace fail')
  })();

  return laplace;
  // (successes + 1) / (attempts + 2)
  function laplace(series) {
    // if value is truthy defined
    const successes = sum(series.map(val => val ? 1 : 0));
    const attempts = series.length;

    return (successes + 1) / (attempts + 2);
  }

});
