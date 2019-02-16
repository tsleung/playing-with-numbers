
define([
  './fetch_single_stock_history',
  './option_chain_fetcher',
  'dt',
  '../sharpe_ratio',
  'utils/mean'
], function(
  fetch_historical,
  fetch_option_chain,
  dt,
  sharpe_ratio,
  mean,
) {
  return carver;

  /**
   * Carve 
   * - sample data with reduced biase (lookahead, sector, time)
   * - uncorrelated trades (beta/sector neutral)
   * - normalize values in time series https://stackoverflow.com/questions/19256930/python-how-to-normalize-time-series-data
   */
  function carver() {
    return [];
  }

  /**
   * Our RF model to be trained online should keep older version of our model and drop off ones which are weaker in order to add new models trained with newer data
   * 
   * https://datascience.stackexchange.com/questions/2314/on-line-random-forests-by-adding-more-single-decisions-trees
   */
  function train() {
    // we should use multiple models for performance ensemble - evaluate each differently
    // RF, RNN, CNN
    // dilated 1d cnn for timeseries, wavenet\

    // loss - squared error below the median, linear error above
  }

  /**
   * Scores a sequence of trades
   */
  function score() {}

  function createPolicyEvent(long, short) {
    // return L/S spread
    const state = [long, short];
    const actions = [long, short];
    return {state, actions};
  }

  /**
   * Based on features of the current state space, return a discrete action
   * 
   * We simplify valuation of individual trade rather than portfolio by uncorrelating actions vs requiring combination
   * e.g. Robot can move up/down/left/right and/or jump/crouch
   * e.g. We create actions which are the permutation of each - since int rading correlation is dangerous, we use neutrality
   * 
   * The output of a policy should be a table with dimensions per feature of given feature permutation, how do we behave
   * Features can be consolidated (rounding) or given noise to avoid overfitting
   */
  function policy(state, actions) {
    return event.securities.map(features).map(value);
    
  }

  /**
   * Valuation doesn't have to be discrete (range of values) but the action determined must be
   * e.g. using a RF, we can have 600 votes at long and 400 votes at short, which is .6 
   *   even so, we return the discrete action of 'buy'
   */
  function value(features) {
    return Math.round(Math.random());
  }

  /** 
   * Features of the state space are reduced to what we can observe, normalized (preferably) by methods stable over time 
   * e.g. stddev/vix/rsi/bollinger_bands
   */
  function features(event) {
    // generate sample features randomly
    return new Array(numFeatures()).fill().map(rand01);
  }
  function numFeatures() {
    return 3;
  }
  function rand01 () {
    return Math.round(Math.random()
  }

});