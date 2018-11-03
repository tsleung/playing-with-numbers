define([], () => {

  return story_builder;

});

/**
  Randomly generate initial conditions and paths through a story
*/
function story_builder() {
  // create locations for our world
  const locations = [
    'city',
    'waterfall',
    'mountain'
  ].map(name => create_location(name));
  // create actors
  const actors = [
    'eren',
  ].map(name => create_actor(name));

  // randomly assign actors to location
  while(actors.length) {
    const location = location[Math.round(Math.random() * locations.length)];
  }



  // create our filters, which forces the randomly generated simulations to adhere to major plot points
  // start is 0
  // at t = 50
  // create a hero's journey filter

  // monte carlo random initial conditions which produces storylines
  // can run a classifier for similar story lines, similar events

  // run our story
  const history = [
    locations
  ];

  while(history.length < 10) {
    const past = history[history.length - 1];
    const present = evaluate_time(past, history.length);
    locations.push(present);
  }

}

function evaluate_time() {

}
function evaluate_scene(location, actors) {

}

function create_actor(name) {
  return {
    name,
    active: true,
    capability: Math.random(),
    fof: Math.random()
  };
}

function create_location(name) {
  return {
    name,
    status: true,
  }
}
// perception of an actor
function determine_perception(actor) {
  // do we make everyone blind?
  // do we make them see all the same world?
  // do we orient them around a global view?
  // do we orient them amongst themselves?
}

/*
create a set of parameters for a character
set a function for how a person behaves
monte carlo run so that each character picks the best action

greatest happiness function
*/
