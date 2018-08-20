define(['./pct_change'], function(pct_change) {
  return nominal_to_percent_change;

  function nominal_to_percent_change(history, period) {
    period = period || 1;
    const interval = history.map((value, i) => {
      return history[i+period] !== undefined ? pct_change(history[i + period], history[i]) : undefined;
    }).filter(val => val !== undefined); // remove last percentage change since empty
    return interval;
  }
});
