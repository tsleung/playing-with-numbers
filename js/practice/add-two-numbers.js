define([], () => {
    /**
     * Definition for singly-linked list.
     */
    function ListNode(val) {
        this.val = val;
        this.next = null;
    }

    /**
     * @param {ListNode} l1
     * @param {ListNode} l2
     * @return {ListNode}
     */
    var addTwoNumbers = function(l1, l2) {
        let first = l1;
        let second = l2;
        let carry = 0;
        let solution = undefined;
        let currentSolutionNode = {val}
        while((first && first.val) || (second && second.val)) {
            let sum = first.val || 0 + second.val || 0 + carry;
            carry = 0;
            if(sum >= 10) {
                carry = 1;
                sum = sum - 10;
            }

            currentSolutionNode = {
                val: sum + carry
            };
            if (solution) {
                solution.next = currentSolutionNode;
            } else {
                solution = currentSolutionNode;
            }
            
            first = first.next;
            second = second.next;
        }
        return solution;
    };

    const first = {val:2, next:{val:4, next:{val:3,next:undefined}}};
    const second = {val:5, next:{val:6, next:{val:4,next:undefined}}};

    console.log(addTwoNumbers(first,second), 807);

});