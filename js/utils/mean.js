define(['./sum'], (sum) => {
  return (series) => sum(series) / series.length;
})
