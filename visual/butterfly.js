define(['jquery'], function($) {
  return () => {
    const points = create_butterfly();
    const render_manager = create_xy_point_renderer(points);

  };
});

function create_butterfly() {
  const max_iterations = 1e5;
  const visual = [{x:0, y:1, z:1}];
  // const rho = 28;
  const rho = 28;
  // const sigma = 10;
  const sigma = 10;
  // const beta = 8 / 3;
  const beta = 8 / 3;
  // const t = .001;
  const t = .005;

  const interval = setInterval(() => {
    if(visual.length > max_iterations) {
      window.clearInterval(interval);
      console.log('done');
      return;
    }

    // const t = visual.length;
    const last = visual[visual.length - 1];
    const x = last.x + (t * (sigma * (last.y - last.x)));
    const y = last.y + (t * ((x * (rho - last.z)) - last.y));
    const z = last.z + (t * ((x * last.y) - (beta * last.z)));

    visual.push({x,y,z});
    // console.log('point',{x,y,z})

  },1);
  return visual;
}

function create_xy_point_renderer(points) {
  const canvas = $('<canvas></canvas>'); // create a canvas
  $('body').append(canvas); // add it to body
  canvas.width('500');
  canvas.height('300');
  const width = canvas.width();
  const height = canvas.height();
  window.canvas = canvas;

  const ctx = canvas[0].getContext('2d');


  setInterval(() => {
    draw();
  }, 200)

  function draw() {
    clearScreen();
    addGrass();
    points.forEach(point => {
      addRect(
        width * (1 / 4) + point.x*6,
        height * (1 / 5) + -point.y*2
      );
    })


  }

  function clearScreen() {
    ctx.clearRect(0,0,width,height)
  }
  function addGrass() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,width,height);
  }


  function addRect(x,y) {
    ctx.fillStyle = '#f00';
    ctx.fillRect(x,y,1,1);
  }

}
