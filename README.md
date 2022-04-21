# Maiar Compounder Bot
A bot used for harvesting, reinvesting and compounding rewards on the Maiar Exchange.

### Requirements
- NodeJS
- A server for running the script (We use node-cron lib + pm2 for running the bot, but several alternative are possible)

### Utility
At this moment, you can
- **Claim rewards** from the Maiar Exchange pools (see https://maiar.exchange/)
- **Reinvest rewards** in the pool (**MEX/LKMEX**)
- **Compound rewards** from the pool **MEX/LKMEX**

### Information
- `config/network.json` config file for network
- `config/allFarms.json` fetched data of all farm from maiar exchange api. We avoid querying this, this is not supposed 
to change for a long time
- `config/userConfig` the user config, you can set up min rewards for harvesting/compounding, frequency of the batch 
execution, define on which wallet execute the bot

### How does it work?
- in `config/userConfig.json`, put your desired wallet addresses with a name like this
```
 [
   { 
      "name": "my wallet name", 
      "address" : "erd address here"
   }
 ]
```
- in `wallets` folder, create a pem file of your wallet address. Your filename must be the public erd address
You can use this command with your mnemonic to create the pem file :
`erdpy --verbose wallet derive ./wallets/myErdAddress.pem --mnemonic`
- you can run `node index.js` for running the bot one time
- or you can run `pm2 start launcher.js`

### Goals
The bot works well for me. I personally have position in EGLD/USDC pool and LKMEX/MEX pool. So, I've only to query
2 pools, which is not too complex. I host it on a private server and I run it by using pm2/node-cron.

There's a lot of improvements to be made, so I decided to put the repository Open Source.

### Improvements to be made
- **More testing** (with several LKMEX nonce and several positions in farming pools)
- Figure out **how the proxy address of farm address are used through the Maiar Exchange**. Now it's hardcoded in the bot.
- `executeTransaction` function, which wait for SC pending execution result before passing to the next transactions 
by querying the API (there's no alternative atm, using erdjs 9.x, maybe in erdjs 10)
- I think we can **avoid erdJs**, it's used only for executing transaction. I think we just call POST /transactions on 
the Maiar API with a bearer token
- **Code refactoring** of course
- Automate config + deployment
