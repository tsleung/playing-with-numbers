define([], () => {
    // https://leetcode.com/problems/two-sum/solution/
    /**
     * @param {number[]} nums
     * @param {number} target
     * @return {number[]}
     */
    var twoSum = function(nums, target) {
        const complements = {};
        
        while(nums.length) {
            const num = nums.pop();
            const index = nums.length;
            const complement = target - num; 
            
            if (complements[num]) {
                return [index, complements[num]];
            } else {
                complements[complement] = index;
            }
        }   
    };
    
    console.log(twoSum([2,7,11,15],9), [0,1]);

})