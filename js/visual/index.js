define(['jquery','three'], ($,THREE) => {
  return () => {
    console.log('THREE', THREE);
    var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.0001, 1000 );
    position(camera, {y: 30, z: 150})
    rotation(camera, {x: 50})
    console.log('camera',camera)
    window.camera = camera;
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0xfafafa, 1 );

		document.body.appendChild( renderer.domElement );

    var cube1 = create_building();
    var cube2 = create_building();
    new Array(10).fill(0).forEach((nil, x) => {
      return new Array(10).fill(0).forEach((nil, z) => {
        const building = create_building();
        position(building,{
          x:-150 + x * 30 + 20,
          z:-150 + z * 30 + 20
        });
        scene.add(building);
      });
    });

    const people = new Array(5).fill(0).map((nul, x) => {
      const person = create_person();
      position(person,{
        x: Math.random() * 1000,
        z: Math.random() * -1000
      });
      scene.add( person );
      return person;
    })

    function create_person() {
      var geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry( 1, 1, 1 ));
      var material =  new THREE.LineBasicMaterial({
        color: 0xffaa22,
        vertexColors: THREE.VertexColors,
      });
      return new THREE.LineSegments( geometry, material );
    }


    function create_building() {
  		var geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry( 10, 20, 10 ));
  		var material =  new THREE.LineBasicMaterial({
        color: 0xffaa22,
        vertexColors: THREE.VertexColors,
      });
  		return new THREE.LineSegments( geometry, material );
    }

    function position(obj, options) {
      Object.assign(obj.position, options);
    }
    function rotation(obj, options) {
      Object.assign(obj.rotation, options);
    }

		var animate = function () {
      requestAnimationFrame( animate );
      // console.log('animating')

      // camera.position.z = camera.position.z > -500 ?
      //   camera.position.z - 2 : 1000;


      people.forEach(person => {
        person.position.x = person.position.x > -1000 ?
          person.position.x - 2 : Math.random() * 1000;
        person.position.z = person.position.z < 1000 ?
          person.position.z + 2 : -500;
        person.position.y = Math.max(-1 * .005 * Math.pow(person.position.x,2)+100,0)/2;

      });
        // camera.position.x = camera.position.x > -20 ?
        //   camera.position.x - .1 : 100;

			renderer.render( scene, camera );
		};

		animate();


  }
})
