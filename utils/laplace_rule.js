define([], () => {
  return (series) =>  series.reduce((accum, val) => accum + (val ? 1 : 0),0);
})
