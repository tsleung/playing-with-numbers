# "Blackjack"
A program which via reinforcement learning plays simplified blackjack
https://docs.google.com/presentation/d/1VGwUWN6ukXfToAfjxbsnTbvCh8S7ekBKP1ePotVqCXM/edit?usp=sharing

## Getting started
* Open up chrome, open a new tab
* Open up the console of the chrome inspector
* Copy the raw contents of blackjack.js (https://gist.github.com/tsleung/2983a8feeeabaff2c2e0f0731a883b7d#file-blackjack-js)
* Paste into console of chrome inspector
* Hit enter to run

## Output
* Results of trial runs outputted to console
* Value table is outputted to body

## Quick modifications
* Original revision of the 'player_action_model' has a 'strategy_table' property. This property can be overwritten to use a saved model from a previous run.
* Modifying 'steps' parameter and 'step_sizes' will improve convergence
* Trial runs have a sliding window of 10k, for memory. Last run is 10% of sliding window. Modify the 'epochs' to change the sliding window.


## Appendix
Inspired by AlphaZero and David Silver's RL lectures
https://github.com/dalmia/David-Silver-Reinforcement-learning

This program achieves a win rate ~40%. Random policy has win rate of ~20%

Standard blackjack with rule sophistication (double down, late surrender) may help the player and account for deviation between win/loss rate. Usable ace feature is also not implemented.

 Summarized Net Win in Blackjack
  * EVENT  PROBABILITY
  * Win    42.42%
  * Push   8.48%
  * Loss   49.09%


## Alternate run
```python
python -m SimpleHTTPServer
```

In your browser navigate to http://localhost:8000/
