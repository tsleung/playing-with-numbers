define([], function() {
  return () => {
    const network = test_network();

  };
});

/**
 * Testing a simple nn implementation
 * Concepts from: http://ml-cheatsheet.readthedocs.io/en/latest/nn_concepts.html
 */
function test_network() {
  const inputs = [
    7, // dealer total
    5 // player total
  ];

  const outputs = [
    0, // stand
    1,  // hit
  ];

  const input_layer = create_layer(inputs.length);
  // const hidden_layers = create_hidden_layers(3, 2);
  const hidden_layers = [
    create_layer(4),
    create_layer(4)
  ];

  const output_layer = create_layer(outputs.length);

  const layers = [
    input_layer,
    ...hidden_layers,
    output_layer
  ];

  const synapses = connect_all_layers(layers);
  const network = new Network(layers, synapses);
  console.log('creating network',
    network,
    JSON.stringify(network, 0, 4),
  );

  for (var i = 0; i < network.inputs.length; i++) {
    network.inputs[i].signal = inputs[i];
  }

  let results;
  let error;
  console.log('inputs', inputs);
  console.log('expected outputs', outputs);
  const iterations = 1e4;
  for (var i = 0; i < iterations; i++) {
    results = forward(network.outputs);
    error = train(outputs, network.outputs, results);
    if (i % (iterations / 10) == 0) {
      console.log('training iterations:',i);
      console.log('results', results);
      console.log('error', error);
    }
  }

  console.log('results', results);
  console.log('error', error);

  return network;
}

/**
 * Train will take a set of output neurons and push each weighted error to its input
 */
function train(expectations, outputs, results) {
  // start with our output neurons
  return expectations.map((expectation, index) => {
    // create pairs and calculate error
    const result = results[index];
    const error = (expectation - result);
    const neuron = outputs[index];

    return update_for_error(neuron, error);
  }).reduce((sum, error) => {
    return sum + Math.pow(error, 2);
  }, 0);
}

/**
 *
 * References:
 * https://machinelearningmastery.com/implement-backpropagation-algorithm-scratch-python/
 */
function update_for_error(neuron, error) {
  const learning_rate = .05;
  // work with the input synapses, sum their weights
  // TODO: Modify biases of this neuron when implemented. Currently only synapses

  const weight_sum = neuron.inputs.reduce((sum, synapse) => synapse.weight + sum, 0);
  // modify their weights proportionally to fit better by a determined step size
  neuron.inputs.forEach(synapse => {
    // determine the proportion of our total error produced by a specific input synapse
    const synapse_proportion = synapse.weight / weight_sum;
    // find the error produced by each synapse tail, based on the weight
    const weight_adjustment = learning_rate * synapse_proportion * error * synapse.tail.signal;
    //console.log('adjustment', weight_adjustment);
    const adjusted_weight = synapse.weight + weight_adjustment;
    synapse.weight = adjusted_weight;
    // update all inputs
    update_for_error(synapse.tail, synapse_proportion * error);
  });

  return error;
}

/**
 * Evaluate neuron signal
 */
function forward(neurons) {
  return neurons.map(neuron => calculate_signal(neuron));
}

function calculate_signal(neuron) {
  const input_sum = neuron.inputs.reduce((sum, synapse) => {
    return sum + calculate_signal(synapse.tail) * synapse.weight;
  }, neuron.bias || 0); // add the bias first

  // create a signal from activation(sum)
  const signal = neuron.activation(input_sum);
  neuron.signal = signal;
  return signal;
}

// TODO: connect_layer_pair, connect_neurons
function connect_all_layers(layers) {
  const layer_pairs = layers.reduce((accum, layer) => {
    const new_pairs = accum.last.reduce((last_pairs, last_neuron) => {
      const pairs = layer.map(neuron => {
        const synapse = new Synapse (last_neuron, neuron);
        last_neuron.outputs.push(synapse);
        neuron.inputs.push(synapse);

        return synapse;
      });
      return [...last_pairs, ...pairs]
    },[]);

    return {
      last: layer,
      pairs: [...accum.pairs, ...new_pairs]
    };
  }, {
    last: [],
    pairs: []
  });

  return layer_pairs.pairs;
}

function create_hidden_layers(depth, size) {
  return Array.from(Array(depth)).map(item => create_layer(size));
}

function create_layer(size, activation) {
  return Array.from(Array(size)).map(item => activation ? new Neuron(activation) : new Neuron(sigmoid));
}

function relu(x) {
  return Math.max(0, x);
}

function relu_prime(z) {
  return z > 0 ? 1 : 0;
}

function sigmoid(x) {
    return 1/(1+Math.pow(Math.E, -x));
}

function sigmoid_prime(z) {
  return Math.exp(-z) / Math.pow(1 + Math.exp(-z), 2);
}

const ids = {neuron: 0, synapse: 0};

class Synapse {
  constructor(start, end) {
    this.id = ids.synapse++;
    this.weight = Math.round(Math.random() * 100) / 100;
    this.tail = start;
    this.head = end;
    this.toJSON = ()=> {
      return {
        id: this.id,
        tail: this.tail.id,
        head: this.head.id,
        weight: this.weight
      };
    };
  }
}

class Network {
  constructor(layers, synapses) {
    this.layers = layers;
    this.synapses = synapses;
    this.inputs = layers[0];
    this.outputs = layers[layers.length - 1];
    this.toJSON = () => ({
      synapses: this.synapses
    });
  }
}

class Neuron {
  constructor(activation) {
    this.id = ids.neuron++;
    this.activation = activation;
    this.bias = 0;
    this.signal = 0;
    this.inputs = [];
    this.outputs = [];
    this.toJSON = () =>({id: this.id,
      inputs: this.inputs.map(input => input.id),
      outputs: this.outputs.map(output => output.id)
    });
  }
}
