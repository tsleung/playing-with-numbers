define([], () => {
  return pct_change;
});

function pct_change(from_value, to_value) {
  return (to_value - from_value) / from_value;
}

((pct_change(100,103) == .03) ? () => {} : () => {throw new Error('pct_change broken');})()
