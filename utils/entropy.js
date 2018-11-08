define([], () => {
  options();
  [
    'abcd',
    'aaaa',
    'abab',
    'bbbb',
    'aabb',
  ].map(entropy).forEach((str) => {
    console.log(str);
  })
  return entropy;

  function entropy (str) {
    const set = {};

    str.split('').forEach(
      c => (set[c] ? set[c]++ : (set[c] = 1))
    );

    return Object.keys(set).reduce((acc, c) => {
      const p = set[c] / str.length;
      return acc - (p * (Math.log(p) / Math.log(2)));
    }, 0);
  };
});


function get_shannon_entropy(s){
  var frequencies, entropy;

/*
  s = (true === /[\u0100-\uFFFFFFFF]/gu.test(s)) ? unescape(encodeURIComponent(s)) : s; //MOD#1 - normalize behavior to only work with "binary-string"                 (will modify normal shannon's entropy score making it incompatible with other implementations when using "above ASCII" chars)
  s = btoa(s);                                                                          //MOD#2 - normalize behavior to limit the char-set to just the BASE64-char-set (will modify normal shannon's entropy score making it incompatible with other implementations for every input since it process it to something different)
*/

  frequencies = s.split('')
                 .reduce(function(carry, current){
                    carry[current] = (carry[current] || 0) + 1;
                    return carry;
                 }, new Object(null));

  entropy = Object.keys(frequencies)
                  .reduce(function(carry, current){
                     var p = frequencies[current] / s.length;
                     carry = carry - (Math.log(p) / Math.log(2) * p);
                     return carry;
                  },0);

  return entropy;
}

console.log(                                     // DEFAULT               MOD#1                 MOD#1+MOD#2
 get_shannon_entropy("1223334444")               //  1.8464393446710154    -""-                  3.327819531114783
,get_shannon_entropy("0")                        //  0                     -""-                  1.5
,get_shannon_entropy("01")                       //  1                     -""-                  2
,get_shannon_entropy("0123")                     //  2                     -""-                  2.5
,get_shannon_entropy("01234567")                 //  3                     -""-                  3.418295834054489
,get_shannon_entropy("0123456789abcdef")         //  4                     -""-                  4.41829583405449
,get_shannon_entropy("0123456אג💩אב789abבבcdef")  //  4.303508854797679     4.241729296672174     4.652391277629866
);
