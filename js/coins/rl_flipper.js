define(['utils/mean'], (mean) => {
    console.log('rl_flipper');
    let numTrials = 0;
    const totalNumberOfTrials = 1e5;
    const actionTracker = {};
    new Array(totalNumberOfTrials).fill(0).reduce((memory, trial, i) => {
        numTrials = i;
        const inputs = [];
        const action = policy(memory, inputs);

        // calculate reward
        const reward = new Array(200).fill(action).reduce((account, action) => {
            actionTracker[action] = actionTracker[action] || 0;
            actionTracker[action] = actionTracker[action]+1;
            return Math.random() <= .6 ?
                account + (action * account): // win
                account - (action * account);// lose
        },1);
        
        updateMemory(memory, inputs, action, reward);
        if((i % (totalNumberOfTrials / 20)) === 0) {
            console.log('reward', reward, memory, actionTracker);
        }
        return memory;
    }, {});
    
    // memory has all inputs as keys, mapped to an array of actions sorted by expected reward 
    // (should it be reward with their expected action? no, actions are unique, rewards aren't)
    function updateMemory(memory, inputs, action, reward) {
        const inputKey = JSON.stringify(inputs);
        memory[inputKey] = memory[inputKey] || {};
        memory[inputKey][action] = memory[inputKey][action] || 0;

        // move reward expectation slightly in direction of updated reward
        memory[inputKey][action] = memory[inputKey][action] + ((reward - memory[inputKey][action])*.25) ;
    }

    function value(memory, inputs) {
        const inputKey = JSON.stringify(inputs);
        memory[inputKey] = memory[inputKey] || {};

        // find action with highest reward
        const sortedActions = Object.keys(memory[inputKey])
            .map(action => ({action, reward: memory[inputKey][action]}))
            .sort((a, b) => b.reward - a.reward);

        return sortedActions.length > 0 ?
            sortedActions[0].action :
            Math.random();
    }

    function policy(memory, inputs) {
        const action = Math.random() < Math.max(.05, 1 / numTrials) ?
            Math.random(): // explore
            value(memory, inputs); // epxloit
        
        return Math.floor(action*10) / 10;
    }

});